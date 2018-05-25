import { ClaimProperty } from "./claim";
export interface UnsignedClaimRequest {
  claims: ClaimProperty[];
  subject: string;
}
