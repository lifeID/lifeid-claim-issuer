// controllers/claimController.ts

import { VerifyClaimRequest } from "../models/verifyClaimRequest";
import { VerifyClaimResponse } from "../models/verifyClaimResponse";
import { ClaimCreateRequest } from "../models/claimCreateRequest";
import { ClaimCreateResponse } from "../models/claimCreateResponse";
import { ApiError } from "../ApiError";

import * as Bluebird from "bluebird";

import { RedisAdapter } from "../adaptors/redis_adaptor";

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
import claimService from "../services/claimService";

const storage = new RedisAdapter("Session");

@Route("claims")
export class ClaimController extends Controller {
  @SuccessResponse("201", "Created") // Custom success response
  @Response("400", "Bad request")
  @Post("request")
  public async createClaim(
    @Body() claimRequest: ClaimCreateRequest
  ): Promise<ClaimCreateResponse> {
    return Bluebird.resolve(claimRequest)
      .then(claimService.validateClaimRequest)
      .then(claimService.verifySignature)
      .then(claimService.createClaimTicket)
      .tap(claimTicket => claimService.storeClaimTicket(storage, claimTicket))
      .tap(claimService.runCallbacks)
      .then(res => ({
        created: true
      }))
      .catch(err => {
        throw new ApiError("BadRequest", 400, err);
      });
  }

  @SuccessResponse("200", "Created")
  @Response("400", "Bad request")
  @Post("verify")
  public async verifyClaim(
    @Body() claimRequest: VerifyClaimRequest
  ): Promise<VerifyClaimResponse> {
    return Bluebird.resolve(claimRequest)
      .then(claimService.validateVerifyClaimRequest)
      .then(() => claimService.issueClaim(storage, claimRequest))
      .then(claim => ({
        verifiableClaim: claim
      }))
      .catch(err => {
        throw new ApiError("BadRequest", 400, err);
      });
  }

  @Get("{claimID}")
  public async getClaim(claimID: string): Promise<string> {
    return Bluebird.resolve(claimID)
      .then(claimID => claimService.getClaimHash(storage, claimID))
      .catch(err => {
        throw new ApiError("BadRequest", 400, err);
      });
  }
}
