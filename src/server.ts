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
}).then(connection => {

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
  claimService.storeClaimToPostgres("12345","hash12345")
    .tap(claim => console.log("RB DEBUG: Claim stored: id:" + claim.claimID + ", hash: " + claim.claimHash))
    .then(() => console.log("RB DEBUG: Getting from postgres"))
    .then(() => claimService.getClaimFromPostgres("12345"))
    .tap(claim => console.log("RB DEBUG: Claim found: id:" + claim.claimID + ", hash: " + claim.claimHash))
    .tap(() => console.log("RB DEBUG: Triggering Claim Not Found Error"))
    .then(() => claimService.getClaimFromPostgres("789"))
    .tap(claim => console.log("RB DEBUG: Claim found: id:" + claim.claimID + ", hash: " + claim.claimHash))
    .catch(error => console.log("RB DEBUG: " + error));

}).catch(error => console.log(error));

  // here you can start to work with your entities
  /* tslint:disable-next-line */
  console.log(`Starting server on port ${PORT}...`);
  //app.listen(PORT); //RB 20180810
  app.listen(parseInt(PORT), "0.0.0.0");//RB 20180810
