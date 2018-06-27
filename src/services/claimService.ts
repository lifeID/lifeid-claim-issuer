// claimService

import { ClaimCreateRequest } from "../models/claimCreateRequest";
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
  return Promise.resolve(claimRequest)
    .tap(() => _validateClaim(claimRequest.claim))
    .then(_validateSubject)
    .then(_validateClaimDetails);
}

function validateVerifyClaimRequest(
  verifyClaimRequest: VerifyClaimRequest
): Promise<VerifyClaimRequest> {
  return Promise.resolve(verifyClaimRequest).tap(() =>
    _validateClaimType(verifyClaimRequest)
  );
}

function issueClaim(
  verifyClaimRequest: VerifyClaimRequest
): Promise<VerifiableClaim> {
  return Promise.resolve(verifyClaimRequest)
    .then(claimRequest => _fetchClaimTicket(claimRequest))
    .then(claimTicket =>
      _matchVerificationCode(claimTicket, verifyClaimRequest)
    )
    .then(_createRevocationKey)
    .then(_createClaimID)
    .then(_createClaim)
    .tap(wrappedClaim => _storeClaim(wrappedClaim))
    .then(wrappedClaim => wrappedClaim.claim);
}

function verifySignature(
  claimRequest: ClaimCreateRequest
): Promise<ClaimCreateRequest> {
  const checkSignature = _createVerifier(R.prop("signature", claimRequest));
  const unsignedClaimRequest = R.dissoc("signature", claimRequest);
  return Promise.resolve(unsignedClaimRequest)
    .then(checkSignature)
    .then(res => claimRequest);
}

function createClaimTicket(
  claimRequest: ClaimCreateRequest
): Promise<ClaimTicket> {
  return Promise.resolve(claimRequest)
    .then(_createClaimTicket)
    .then(_handleClaimTicket);
}

function storeClaimTicket(claimTicket: ClaimTicket): Promise<ClaimTicket> {
  // store claim and expire in 1 day(86400 seconds)
  return storage
    .upsert(claimTicket.claim.value, claimTicket, 86400)
    .then(() => claimTicket);
}

function emitCallbackEvents(claimTicket): void {
  const callbackEvents = _getCallbackEvents(claimTicket.claim);
  R.map(event => {
    pubsub.emit(event, claimTicket);
  }, callbackEvents);
}

function getClaimHash(claimID: string): Promise<string> {
  return Promise.resolve()
    .then(() => _fetchClaim(claimID))
    .then(claim => claim.claimHash)
    .catch(err => {
      throw new Error("The claim was not found.");
    });
}

function _fetchClaim(claimID: string) {
  return storage.find(claimID).then(JSON.parse);
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
function _matchVerificationCode(
  claimTicket: ClaimTicket,
  verifyClaimRequest: VerifyClaimRequest
) {
  if (claimTicket.code !== verifyClaimRequest.verificationCode) {
    throw new Error("Claim not found");
  }
  return claimTicket;
}

function _fetchClaimTicket(
  claimRequest: VerifyClaimRequest
): Promise<ClaimTicket> {
  return Promise.resolve()
    .then(() => storage.find(claimRequest.value))
    .then(claimTicket => {
      if (!claimTicket) {
        throw new Error("Claim not found");
      }
      return claimTicket;
    });
}

function _createClaimTicket(claimRequest: ClaimCreateRequest): ClaimTicket {
  return {
    timestamp: _getTimestamp(),
    claim: claimRequest.claim,
    subject: claimRequest.subject
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
  return Promise.resolve(wrappedClaimTicket)
    .then(() => _generateClaimData(wrappedClaimTicket))
    .then(_signClaim);
}

function _generateClaimData(
  wrappedClaimTicket: WrappedClaimTicket
): WrappedClaim {
  console.log(process.env);
  return {
    revocationKey: wrappedClaimTicket.revocationKey,
    claimID: wrappedClaimTicket.claimID,
    claim: {
      id: `${process.env.HOST}/v1/claims/${wrappedClaimTicket.claimID}`,
      type: ["Credential", "EmailCredential"],
      issuer: `${process.env.HOST}`,
      issued: _getFormattedTimestamp(),
      claims: [wrappedClaimTicket.claimTicket.claim],
      revocation: {
        key: wrappedClaimTicket.revocationKey.address,
        type: "Secp256k1"
      }
    }
  };
}

function _signClaim(wrappedClaim: WrappedClaim): WrappedClaim {
  const signature = accounts.sign(
    JSON.stringify(wrappedClaim.claim),
    process.env.PRIVATE_KEY
  ).signature;

  return R.mergeDeepLeft(wrappedClaim, {
    claim: { signature: _createSignatureBlock(signature) }
  });
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

function _validateClaim(claim: ClaimProperty): Promise<ClaimProperty> {
  return Promise.resolve(claim)
    .tap(() => _validateClaimType(claim))
    .then(_validateClaimSpecifics);
}

function _validateClaimType(
  claim: ClaimProperty | VerifyClaimRequest
): boolean {
  if (!_findValidClaim(claim.type)) {
    throw new Error(`Claim type '${claim.type}' is not valid.`);
  }
  return true;
}

function _validateClaimSpecifics(claim: ClaimProperty): ClaimProperty {
  if (!_getValidationFunction(claim)) {
    // Get validation function should thow error
  }
  return claim;
}

function _findValidClaim(type: string) {
  return R.find(R.propEq("type", type))(validClaims);
}

function _validateSubject(
  claimRequest: ClaimCreateRequest
): Promise<ClaimCreateRequest> {
  return mndid
    .validateDID(claimRequest.subject)
    .then(res => {
      return claimRequest;
    })
    .catch(err => {
      throw new Error("The subject must be a valid DID.");
    });
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
          // TODO: validate the did public key via an API call
          mndid.getDDO(unsignedClaimRequest.subject)
        ]).spread((recoveredKey: string, ddo: any) => {
          const matchPublicKey = (keyData: any): boolean => {
            const publicKey = R.prop("publicKey", keyData);
            return R.equals("0x" + publicKey, recoveredKey);
          };
          if (R.none(matchPublicKey, ddo.publicKeys)) {
            throw new Error("The public keys don't match.");
          }
          return true;
        });
      })
      .catch(err => {
        throw new Error("The signature is invalid.");
      });
  };
}

function _getPublicKeyFromDID(did: string): Promise<string> {
  return mndid.getKeyFromDID(did);
}

function _handleClaimTicket(claimTicket: ClaimTicket): ClaimTicket {
  const claimHandler = _getClaimHandlerFunction(claimTicket.claim);
  return claimHandler(claimTicket);
}

function _getValidationFunction(
  claim: ClaimProperty
): (claim: ClaimProperty) => boolean {
  return R.prop("validationFunction", _findValidClaim(claim.type));
}

function _getClaimHandlerFunction(
  claim: ClaimProperty
): (claim: ClaimTicket) => ClaimTicket {
  return R.prop("handlerFunction", _findValidClaim(claim.type));
}

function _getCallbackEvents(claim: ClaimProperty) {
  return R.prop("callbackEvents", _findValidClaim(claim.type));
}

export default {
  validateClaimRequest,
  verifySignature,
  createClaimTicket,
  validateVerifyClaimRequest,
  storeClaimTicket,
  emitCallbackEvents,
  issueClaim,
  getClaimHash
};
