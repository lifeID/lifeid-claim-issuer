import { ClaimProperty } from "./claim";
export interface ClaimCreateRequest {
  claims: ClaimProperty[];
  subject: string;
  signature: string;
}
