export interface Claim {
  subject: string;
  issuer: string;
  issuedAt: string;
  claimType: string;
  claimValue: string;
  signature: string;
}
