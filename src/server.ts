require("dotenv").config(); // tslint:disable-line
import "./controllers/claimController";
import * as emailService from "./services/emailService";
import * as bodyParser from "body-parser";
import * as express from "express";
import * as methodOverride from "method-override";
import { RegisterRoutes } from "./routes";
import * as assert from "assert";
import * as events from "./events";
import { PORT } from "./constants";
import "reflect-metadata";
import {createConnection} from "typeorm";
import {Claim} from "./models/entity/Claim";
import claimService from "./services/claimService";

assert(process.env.REDIS_URL, "process.env.REDIS_URL missing");
assert(process.env.PRIVATE_KEY, "process.env.PRIVATE_KEY missing");
assert(process.env.SENGRID_USER, "process.env.SENGRID_USER missing");
assert(process.env.SENGRID_PASS, "process.env.SENGRID_PASS missing");
assert(process.env.PORT, "a process.env.PORT must be set");

export const app = express();

import * as swaggerUi from "swagger-ui-express";
import { VerifiableClaim, ClaimProperty } from "./models/claim";
import { ClaimTicket } from "./models/claimTicket";
import { VerifyClaimRequest } from "./models/verifyClaimRequest";
const swaggerDocument = require("./swagger.json"); // tslint:disable-line

createConnection({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "postgres",
  database: "postgres",
  entities: [
      Claim
  ],
  synchronize: true,
  logging: false
}).then(async connection => {

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  
  RegisterRoutes(app);
  
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      const status = err.statusCode || 500;
      const body: any = {
        fields: err.fields || undefined,
        message: err.message || "An error occurred during the request.",
        name: err.name,
        status
      };
      res.status(status).json(body);
    }
  );
  
  events.setupEvents();
  
  emailService.verifyNodemailer();

  console.log("RB DEBUG: Saving to postgres");
  let claim = await claimService._storeClaimToPostgres("12345","hash12345")
  console.log("RB DEBUG: Claim stored: id:" + claim.claimID + ", hash: " + claim.claimHash);
  console.log("RB DEBUG: Getting from postgres");
  claim = await claimService._getClaimFromPostgres("12345");
  console.log("RB DEBUG: Claim found: id:" + claim.claimID + ", hash: " + claim.claimHash);
  console.log("RB DEBUG: Triggering Claim Not Found Error");
  try {
    await claimService._getClaimFromPostgres("789");
  }
  catch(error) {
    console.log("RB DEBUG: " + error);
  }
  console.log("RB DEBUG: Storing claim");
  let mock : VerifiableClaim = { 
    id: "mock",
    type: ["mock"],
    issuer: "mock",
    issued: "mock",
    claims: [{type: "mock", value: "mock"}]
  };
  let wrappedClaim = { claimID: "6789", claim: mock };
  let wrappedClaimOut = await claimService._storeClaim(wrappedClaim);
  console.log("RB DEBUG: The wrapped claim is " + JSON.stringify(wrappedClaimOut));
  console.log("RB DEBUG: Fetching claim");
  claim = await claimService._getClaimFromPostgres(wrappedClaim.claimID);
  console.log("RB DEBUG: The claim is " + JSON.stringify(claim));

  console.log("RB DEBUG: Issue Claim");
  let validVerifyClaimRequest : VerifyClaimRequest;
  let mockClaimTicket : ClaimTicket;
  let mockClaim : ClaimProperty;
  validVerifyClaimRequest = {
    verificationCode: "12345",
    value: "testing@123.com",
    type: "email"
  };

  mockClaim = {
    type: "email",
    value: "testing@123.com"
  };

  mockClaimTicket = {
    code: "12345",
    subject: "did:life:11234Fd4014b81F5d1fDA1355F1bfbD14C812d3f8D22b04f0",
    timestamp: "1330688329321",
    claim: mockClaim
  }
  claimService.storeClaimTicket(mockClaimTicket)
    .tap(res => console.log("RB DEBUG: Claim Ticket Value:" + res.claim.value))
    .catch(err => console.log("RB DEBUG: Error:" + err));
  claimService
    .issueClaim(validVerifyClaimRequest)
    .tap(res => {
      console.log("RB DEBUG: The verifiable claim is: " + JSON.stringify(res));
    });
// console.log("RB DEBUG: Fetch the claim hasg");
// let claimHash = getClaimHash();


}).catch(error => console.log(error));

  // here you can start to work with your entities
  /* tslint:disable-next-line */
  console.log(`Starting server on port ${PORT}...`);
  //app.listen(PORT); //RB 20180810
  app.listen(parseInt(PORT), "0.0.0.0");//RB 20180810
