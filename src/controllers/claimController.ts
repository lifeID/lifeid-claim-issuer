// controllers/claimController.ts

import { VerifyClaimRequest } from "../models/verifyClaimRequest";
import { VerifyClaimResponse } from "../models/verifyClaimResponse";
import { ClaimCreateRequest } from "../models/claimCreateRequest";
import { ClaimJWTCreateRequest } from "../models/claimJWTCreateRequest";
import { ClaimCreateResponse } from "../models/claimCreateResponse";
import { ApiError } from "../ApiError";

import * as Bluebird from "bluebird";

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
import claimService from "../services/claimService";

@Route("claims")
export class ClaimController extends Controller {
  //
  // JWT payload {"email": "address@test.com"}
  @SuccessResponse("201", "Created") // Custom success response
  @Response("400", "Bad request")
  @Post("{did}/request/{type}")
  public async createJWTClaim(
    did: string,
    type: string,
    @Body() claimRequest: ClaimJWTCreateRequest
  ): Promise<any> {
    if (type === "email") {
      return Bluebird.resolve()
        .then(() => claimService.verifyJWT(claimRequest.signedJWT, did))
        .then(() =>
          claimService.createClaimTicket({
            signedJWT: claimRequest.signedJWT,
            did,
            type
          })
        )
        .tap(claimTicket => claimService.storeClaimTicket(claimTicket))
        .tap(claimService.emitCallbackEvents)
        .then(res => ({
          created: true
        }))
        .catch(err => {
          console.log(err);
          throw new ApiError("BadRequest", 400, err);
        });
    } else {
      throw new ApiError("Claim type not supported", 404);
    }
  }

  // JWT payload {verificationCode: "123456"}
  @SuccessResponse("200", "Created")
  @Response("400", "Bad request")
  @Post("{did}/verify")
  public async verifyClaim(
    did: string,
    @Body() verifyRequest: VerifyClaimRequest
  ): Promise<any> {
    return (
      Bluebird.resolve()
        .then(() => claimService.verifyJWT(verifyRequest.signedJWT, did))
        .then(() =>
          claimService.findAndVerifyVerificationCode(
            verifyRequest.signedJWT,
            did
          )
        )
        .then(claimService.issueClaim)
        // .then(claim => ({
        //   verifiableClaim: claim
        // }))
        .catch(err => {
          console.log(err);
          throw new ApiError("BadRequest", 400, err);
        })
    );
  }
}
