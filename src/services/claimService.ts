// claimService

import { ClaimCreateRequest } from "../models/claimCreateRequest";
import { UnsignedClaimRequest } from "../models/unsignedClaimRequest";
import { ClaimProperty } from "../models/claim";
import * as R from "ramda";
import * as mndid from "mndid";
import * as Promise from "bluebird";
import * as Accounts from "web3-eth-accounts";
import emailService from "./emailService";
const accounts = new Accounts();

const validClaims = { email: emailService.handleEmailClaim };

function validateClaimRequest(
  claimRequest: ClaimCreateRequest
): Promise<ClaimCreateRequest> {
  return Promise.resolve(claimRequest)
    .then(_validateClaims)
    .then(_validateSubject);
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

function createClaimRequeset(
  claimRequest: ClaimCreateRequest
): Promise<boolean> {
  return Promise.resolve(claimRequest).then(_handleClaimTypes);
}

function _validateClaims(claimRequest: ClaimCreateRequest): ClaimCreateRequest {
  R.all(_validateClaim, claimRequest.claims);
  return claimRequest;
}

function _validateClaim(claim: ClaimProperty): boolean {
  if (!R.contains(claim.type, R.keys(validClaims))) {
    throw new Error(`Claim type '${claim.type}' is not valid.`);
  }
  return true;
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
    //TODO: Refactor this mama jama
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

function _handleClaimTypes(claimRequest: ClaimCreateRequest): boolean {
  R.map(_handleClaim, claimRequest.claims);
  return true;
}

function _handleClaim(claim: ClaimProperty) {
  return validClaims[claim.type](claim);
}

export default { validateClaimRequest, verifySignature, createClaimRequeset };
