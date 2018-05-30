import { ClaimProperty } from "./claim";
export interface ClaimTicket {
  code?: string;
  subject: string;
  timestamp: string;
  claim: ClaimProperty;
}

export interface WrappedClaimTicket {
  revocationKey?: any;
  claimID?: string;
  claimTicket: ClaimTicket;
}
