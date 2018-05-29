export interface Signature {
  type: string;
  created: string;
  creator: string;
  domain?: string;
  nonce: string;
  signatureValue: string;
  signatureType: string;
}

export interface ClaimProperty {
  type: string;
  value: string;
}

export interface ClaimPropertyWithAccessCode {
  code: string;
  claimProperty: ClaimProperty;
  timestamp?: string;
}

export interface VerifiableClaim {
  id: string;
  type: string[];
  name?: string;
  issuer: string;
  issued: string;
  claim: ClaimProperty;
  expires?: string;
  revocation?: Revocation;
  signature?: Signature;
}

export interface Revocation {
  key: string;
}
