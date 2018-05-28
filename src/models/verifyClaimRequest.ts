export interface VerifyClaimRequest {
  verificationCode: string;
  email: string;
  claimType: string;
}
