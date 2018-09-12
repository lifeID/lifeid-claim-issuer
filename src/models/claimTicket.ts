import { ClaimProperty } from "./claim";
export interface ClaimTicket {
  code?: string;
  subject: string;
  timestamp: string;
  claim: any;
  type: string;
}

export interface WrappedClaimTicket {
  revocationKey?: any;
  claimID?: string;
  claimTicket: ClaimTicket;
}
