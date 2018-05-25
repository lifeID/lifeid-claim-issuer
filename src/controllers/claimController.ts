// controllers/claimController.ts

import { VerifyClaimRequest } from "../models/verifyClaimRequest";
import { VerifyClaimResponse } from "../models/verifyClaimResponse";
import { ClaimCreateRequest } from "../models/claimCreateRequest";
import { ClaimCreateResponse } from "../models/claimCreateResponse";
import { ApiError } from "../ApiError";

import {
  Get,
  Post,
  Route,
  Body,
  Query,
  Header,
  Path,
  SuccessResponse,
  Controller,
  Response
} from "tsoa";
import { reject } from "bluebird";

@Route("claims")
export class ClaimController extends Controller {
  @SuccessResponse("201", "Created") // Custom success response
  @Post("request")
  public async createClaim(
    @Body() claimRequest: ClaimCreateRequest
  ): Promise<ClaimCreateResponse> {
    return Promise.resolve(claimRequest)
      .then(() => ({
        claimID: "123"
      }))
      .catch(err => {
        throw new ApiError("BadRequest", 400, err);
      });
  }

  @SuccessResponse("201", "Created") // Custom success response
  @Post("verify")
  public async verifyClaim(
    @Body() claimRequest: VerifyClaimRequest
  ): Promise<VerifyClaimResponse> {
    return Promise.resolve(claimRequest)
      .then(() => ({
        verifiableClaim: {
          id: "http://claim-issuer.com/claim/123",
          type: ["Credential", "EmailCredential"],
          issuer: "https:/claim-issuer.lifeid.io",
          issued: "2010-1-1",
          claim: [{ type: "email", value: "jon@123.com" }],
          revocation: { id: "123", type: "uh" },
          signature: {
            type: "sometype",
            created: "2016-06-18T21:19:10Z",
            creator: "https:/claim-issuer.lifeid.io",
            domain: "json.org",
            nonce: "4234234234",
            signatureValue: "asdfasdfasdf"
          }
        }
      }))
      .catch(err => {
        throw new ApiError("BadRequest", 400, err);
      });
  }
}
