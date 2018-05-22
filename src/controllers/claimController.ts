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
        claim: {
          subject: "123",
          issuer: "lifeid",
          issuedAt: "123123",
          claimType: "email",
          claimValue: "jon@123.com",
          signature: "adsfsadf"
        }
      }))
      .catch(err => {
        throw new ApiError("BadRequest", 400, err);
      });
  }
}
