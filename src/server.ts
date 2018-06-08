import "./controllers/claimController";
import * as emailService from "./services/emailService";
import * as bodyParser from "body-parser";
import * as express from "express";
import * as methodOverride from "method-override";
import { RegisterRoutes } from "./routes";
import * as assert from "assert";
import * as events from "./events";
assert(process.env.REDIS_URL, "process.env.REDIS_URL missing");
assert(process.env.PRIVATE_KEY, "process.env.PRIVATE_KEY missing");
assert(process.env.USER, "process.env.USER missing");
assert(process.env.PASS, "process.env.PASS missing");

const app = express();

import * as swaggerUi from "swagger-ui-express";
const swaggerDocument = require("./swagger.json"); // tslint:disable-line
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

/* tslint:disable-next-line */
console.log("Starting server on port 3000...");
app.listen(3000, "0.0.0.0");
