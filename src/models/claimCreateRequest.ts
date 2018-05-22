export interface ClaimCreateRequest {
  claimType: string;
  claimValue: string;
  subject: string;
  signature: string; // claimValue + subject
}
