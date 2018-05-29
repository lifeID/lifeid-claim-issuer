// claimService

import { ClaimCreateRequest } from "../models/claimCreateRequest";
import { VerifyClaimRequest } from "../models/verifyClaimRequest";

import { UnsignedClaimRequest } from "../models/unsignedClaimRequest";
import { ClaimProperty, VerifiableClaim } from "../models/claim";
import { ClaimTicket } from "../models/claimTicket";
import * as R from "ramda";
import * as mndid from "mndid";
import * as Promise from "bluebird";
import * as Accounts from "web3-eth-accounts";
import * as emailService from "./emailService";

const accounts = new Accounts();

const validClaims = [
  {
    type: "email",
    validationFunction: emailService.validateClaim,
    handlerFunction: emailService.handleEmailClaim,
    callbackFunctions: [emailService.sendEmail]
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
  storage,
  verifyClaimRequest: VerifyClaimRequest
): Promise<VerifiableClaim> {
  return Promise.resolve(verifyClaimRequest)
    .then(claimRequest => _fetchClaimTicket(storage, claimRequest))
    .then(claimTicket =>
      _matchVerificationCode(claimTicket, verifyClaimRequest)
    )
    .then(_createClaim);
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
  const _handleClaim = _getClaimHandlerFunction(claimRequest.claim);
  return Promise.resolve(claimRequest)
    .then(_createClaimTicket)
    .then(_handleClaimTicket);
}

function storeClaimTicket(
  storage,
  claimTicket: ClaimTicket
): Promise<ClaimTicket> {
  // store claim and expire in 1 day(86400 seconds)
  return storage
    .upsert(claimTicket.claim.value, claimTicket, 86400)
    .then(() => claimTicket);
}

function runCallbacks(claimTicket): void {
  const callbackFunctions = _getCallbackFunctions(claimTicket.claim);
  R.map(callbackFunctions, fun => fun(claimTicket));
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
  storage,
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

function _generateClaimData(claimTicket: ClaimTicket) VerifiableClaim {
  return {
    id: `${process.env.host}/claims/123`,
    type: ["Credential", "EmailCredential"],
    issuer: `${process.env.host}`,
    issued: _getTimestamp(),
    claim: claimTicket.claim,
    revocation: { key: "123" },
  };

}

function _generateSignature(unsignedClaim) {
 return {  signature: {
      type: "Secp256k1",
      created: "2016-06-18T21:19:10Z",
      creator:`${process.env.host}`,
      nonce: "4234234234",
      signatureValue: "asdfasdfasdf"
    } }
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

function _getCallbackFunctions(
  claim: ClaimProperty
): (claim: ClaimTicket) => ClaimTicket {
  return R.prop("callbackFunctions", _findValidClaim(claim.type));
}

export default {
  validateClaimRequest,
  verifySignature,
  createClaimTicket,
  validateVerifyClaimRequest,
  storeClaimTicket,
  runCallbacks,
  issueClaim
};
