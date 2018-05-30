import { ClaimProperty } from "./claim";
export interface ClaimCreateRequest {
  claim: ClaimProperty;
  subject: string;
  signature: string;
}
