import "./controllers/claimController";
import * as bodyParser from "body-parser";
import * as express from "express";
import * as methodOverride from "method-override";
import { RegisterRoutes } from "./routes";

const app = express();

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
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
    const status = err.status || 500;
    const body: any = {
      fields: err.fields || undefined,
      message: err.message || "An error occurred during the request.",
      name: err.name,
      status
    };
    res.status(status).json(body);
  }
);

/* tslint:disable-next-line */
console.log("Starting server on port 3000...");
app.listen(3000, "0.0.0.0");
