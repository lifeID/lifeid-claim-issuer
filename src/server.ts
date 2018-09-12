require("dotenv").config();
import "./controllers/claimController";
import * as emailService from "./services/emailService";
import * as bodyParser from "body-parser";
import * as express from "express";
import * as methodOverride from "method-override";
import { RegisterRoutes } from "./routes";
import * as assert from "assert";
import * as events from "./events";
import { PORT } from "./constants";
assert(process.env.REDIS_URL, "process.env.REDIS_URL missing");
assert(process.env.PRIVATE_KEY, "process.env.PRIVATE_KEY missing");
assert(process.env.SENDGRID_USER, "process.env.USER missing");
assert(process.env.SENDGRID_PASS, "process.env.PASS missing");
assert(process.env.PORT, "a process.env.PORT must be set");

const app = express();

import * as swaggerUi from "swagger-ui-express";
const swaggerDocument = require("./swagger.json"); // tslint:disable-line
swaggerDocument.host = process.env.HOST;
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
    console.log(err);
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
console.log(`Starting server on port ${PORT}...`);
app.listen(PORT);
