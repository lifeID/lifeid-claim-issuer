import { ClaimProperty } from "./claim";
export interface ClaimTicket {
  code?: string;
  subject: string;
  timestamp: string;
  claim: ClaimProperty;
}
