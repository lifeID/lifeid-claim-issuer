import { ClaimCreateRequest } from "../models/claimCreateRequest";
import { ClaimJWTCreateRequest } from "../models/claimJWTCreateRequest";
import { VerifyClaimRequest } from "../models/verifyClaimRequest";
import { RedisAdapter } from "../adaptors/redis_adaptor";

import { UnsignedClaimRequest } from "../models/unsignedClaimRequest";
import { ClaimProperty, VerifiableClaim, WrappedClaim } from "../models/claim";
import { ClaimTicket, WrappedClaimTicket } from "../models/claimTicket";
import * as R from "ramda";
import * as mndid from "mndid";
import * as Promise from "bluebird";
import * as Accounts from "web3-eth-accounts";
import * as emailService from "./emailService";
import { format } from "date-fns";
import { TIMEOUT } from "dns";
import { TIMESTAMP_FORMAT } from "../constants";
import { generateCode } from "./codeService";
import { pubsub } from "../events";
import fetch from "node-fetch";

import * as didJWT from "lifeid-did-jwt";
didJWT.registerLife("http://localhost:8888");

const storage = new RedisAdapter("Session");

const Web3 = require("web3"); //tslint:disable-line
const web3 = new Web3();
const accounts = new Accounts();

const validClaims = [
  {
    type: "email",
    validationFunction: emailService.validateClaim,
    handlerFunction: emailService.handleEmailClaim,
    callbackEvents: ["email:sendConfirmationEmail"]
  }
];

function validateClaimRequest(
  claimRequest: ClaimCreateRequest
): Promise<ClaimCreateRequest> {
  return Promise.resolve(claimRequest).then(_validateClaimDetails);
}

function issueClaim(claimTicket: ClaimTicket): Promise<VerifiableClaim> {
  return Promise.resolve()
    .then(() => _createRevocationKey(claimTicket))
    .then(_createClaimID)
    .then(_createClaim)
    .tap(wrappedClaim => _storeClaim(wrappedClaim))
    .then(wrappedClaim => wrappedClaim.claim);
}

function verifySignature(
  claimRequest: ClaimCreateRequest
): Promise<ClaimCreateRequest> {
  // const checkSignature = _createVerifier(R.prop("signature", claimRequest));
  // const unsignedClaimRequest = R.dissoc("signature", claimRequest);
  return (
    Promise.resolve() // .resolve(unsignedClaimRequest)
      // .then(checkSignature)
      .then(res => claimRequest)
  );
}

function createClaimTicket(request: {
  signedJWT: string;
  did: string;
  type: string;
}): Promise<ClaimTicket> {
  return Promise.resolve()
    .then(() => _createClaimTicket(request.signedJWT, request.type))
    .then(_handleClaimTicket);
}

function storeClaimTicket(claimTicket: ClaimTicket): Promise<ClaimTicket> {
  // store claim and expire in 1 day(86400 seconds)
  return storage
    .upsert(claimTicket.subject, claimTicket, 86400)
    .then(() => claimTicket);
}

function emitCallbackEvents(claimTicket): void {
  const callbackEvents = _getCallbackEvents(claimTicket.type);
  R.map(event => {
    pubsub.emit(event, claimTicket);
  }, callbackEvents);
}

function verifyJWT(signedJWT: string, did: string): Promise<string> {
  return Promise.resolve()
    .then(() =>
      didJWT.verifyJWT(signedJWT, {
        audience: did
      })
    )
    .then(res => {
      console.log(res);
      return signedJWT;
    });
}
function findAndVerifyVerificationCode(signedJWT: string, did: string) {
  return Promise.resolve(_fetchClaimTicket(did)).then(claimTicket => {
    _matchVerificationCode(claimTicket, signedJWT);
    return claimTicket;
  });
}

function _storeClaim(wrappedClaim: WrappedClaim): WrappedClaim {
  console.log("Storing hash of ", JSON.stringify(wrappedClaim.claim));
  storage.upsert(
    wrappedClaim.claimID,
    JSON.stringify({
      claimHash: web3.utils.sha3(JSON.stringify(wrappedClaim.claim))
    }),
    10000000
  );
  return wrappedClaim;
}
function _matchVerificationCode(claimTicket: ClaimTicket, signedJWT: string) {
  const decodedClaim = didJWT.decodeJWT(signedJWT);
  console.log(decodedClaim);
  const verificationCode = decodedClaim.payload.payload.verificationCode;
  if (claimTicket.code !== verificationCode) {
    throw new Error("Verification code doesn't match");
  }
  return claimTicket;
}

function _fetchClaimTicket(did: string): Promise<ClaimTicket> {
  console.log(did);
  return Promise.resolve()
    .then(() => storage.find(did))
    .then(claimTicket => {
      if (!claimTicket) {
        throw new Error("Claim not found");
      }
      return claimTicket;
    });
}

function _createClaimTicket(signedJWT: string, type: string): ClaimTicket {
  const decodedClaim = didJWT.decodeJWT(signedJWT);
  console.log("DECODED: ", decodedClaim);
  console.log({
    timestamp: _getTimestamp(),
    claim: decodedClaim.payload.payload,
    subject: decodedClaim.payload.iss,
    type
  });

  return {
    timestamp: _getTimestamp(),
    claim: decodedClaim.payload.payload,
    subject: decodedClaim.payload.iss,
    type
  };
}

function _createRevocationKey(claimTicket: ClaimTicket): WrappedClaimTicket {
  const revocationKey = accounts.create(generateCode(9999999999999));
  return {
    revocationKey,
    claimTicket
  };
}

function _createClaimID(
  wrappedClaimTicket: WrappedClaimTicket
): WrappedClaimTicket {
  const code = generateCode(99999999);
  return R.merge({ claimID: code }, wrappedClaimTicket);
}

function _createClaim(
  wrappedClaimTicket: WrappedClaimTicket
): Promise<WrappedClaim> {
  return Promise.resolve(wrappedClaimTicket).then(() =>
    _generateClaimData(wrappedClaimTicket)
  );
  // .then(_signClaim);
}

function _generateClaimData(
  wrappedClaimTicket: WrappedClaimTicket
): WrappedClaim {
  return {
    revocationKey: wrappedClaimTicket.revocationKey,
    claimID: wrappedClaimTicket.claimID,
    claim: _createClaimJWT(wrappedClaimTicket)
  };
}

function _createClaimJWT(wrappedClaimTicket: WrappedClaimTicket) {
  const signer = didJWT.SimpleSigner(process.env.PRIVATE_KEY);
  return didJWT.createJWT(
    {
      aud: process.env.LIFEID_DID,
      exp: 1957463421,
      name: "lifeID verified email claim",
      data: {
        id: `${process.env.HOST}/v1/claims/${wrappedClaimTicket.claimID}`,
        type: ["Credential", "EmailCredential"],
        issuer: `${process.env.HOST}`,
        issued: _getFormattedTimestamp(),
        claim: wrappedClaimTicket.claimTicket.claim,
        revocation: {
          key: wrappedClaimTicket.revocationKey.address,
          type: "Secp256k1"
        }
      }
    },
    { issuer: process.env.LIFEID_DID, signer }
  );
}

function _createSignatureBlock(signature) {
  return {
    signature: {
      type: "Secp256k1",
      created: _getFormattedTimestamp(),
      creator: `${process.env.HOST}`,
      signatureValue: signature
    }
  };
}

function _getFormattedTimestamp() {
  return format(new Date(), TIMESTAMP_FORMAT);
}

function _getTimestamp(): string {
  return `${new Date().getTime()}`;
}

function _validateClaimDetails(
  claimRequest: ClaimCreateRequest
): ClaimCreateRequest {
  // TODO: add logic
  return claimRequest;
}

function _findValidClaim(type: string) {
  return R.find(R.propEq("type", type))(validClaims);
}

function _validateClaimSpecifics(claim: ClaimProperty): ClaimProperty {
  if (!_getValidationFunction(claim)) {
    // Get validation function should thow error
  }
  return claim;
}

function _createVerifier(
  signature: string
): (unsignedClaimrequest: UnsignedClaimRequest) => Promise<boolean> {
  return (unsignedClaimRequest: UnsignedClaimRequest) => {
    // TODO: Refactor this mama jama
    return Promise.resolve()
      .then(() => {
        return Promise.all([
          accounts.recover(JSON.stringify(unsignedClaimRequest), signature),
          fetch(
            `${process.env.API_BRIDGE_ADDRESS}/v1/userdid/${
              unsignedClaimRequest.subject
            }`
          ).then(response => response.json())
        ]).spread((recoveredKey: string, ddo: any) => {
          console.log(ddo);
          const matchPublicKey = (keyData: any): boolean => {
            const publicKey = R.prop("ethereumAddress", keyData);
            return R.equals(
              publicKey.toLowerCase(),
              recoveredKey.toLowerCase()
            );
          };
          if (R.none(matchPublicKey, ddo.publicKey)) {
            throw new Error("The public keys don't match.");
          }
          return true;
        });
      })
      .catch(err => {
        console.log(err);
        throw new Error("The signature is invalid.");
      });
  };
}

function _getPublicKeyFromDID(did: string): Promise<string> {
  return mndid.getKeyFromDID(did);
}

function _handleClaimTicket(claimTicket: ClaimTicket): ClaimTicket {
  const claimHandler = _getClaimHandlerFunction(claimTicket.type);
  return claimHandler(claimTicket);
}

function _getValidationFunction(
  claim: ClaimProperty
): (claim: ClaimProperty) => boolean {
  return R.prop("validationFunction", _findValidClaim(claim.type));
}

function _getClaimHandlerFunction(
  type: string
): (claim: ClaimTicket) => ClaimTicket {
  return R.prop("handlerFunction", _findValidClaim(type));
}

function _getCallbackEvents(type: string) {
  return R.prop("callbackEvents", _findValidClaim(type));
}

export default {
  validateClaimRequest,
  verifySignature,
  createClaimTicket,
  storeClaimTicket,
  emitCallbackEvents,
  issueClaim,
  verifyJWT,
  findAndVerifyVerificationCode
};
