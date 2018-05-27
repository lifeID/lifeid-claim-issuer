export interface Signature {
  type: string;
  created: string;
  creator: string;
  domain?: string;
  nonce: string;
  signatureValue: string;
}

export interface ClaimProperty {
  type: string;
  value: string;
  timestamp?: string;
}

export interface WrappedClaimProperty {
  [code: string]: string;
}

export interface VerifiableClaim {
  id: string;
  type: string[];
  name?: string;
  issuer: string;
  issued: string;
  claim: ClaimProperty[];
  expires?: string;
  revocation?: Revocation;
  signature: Signature;
}

export interface Revocation {
  id: string;
  type: string;
}
