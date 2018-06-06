import * as assert from "assert";
assert(process.env.USER, "process.env.USER missing");
assert(process.env.PASS, "process.env.PASS missing");
export const TIMESTAMP_FORMAT = "YYYY-MM-DDTHH:mm:ss\\Z";
export const STMP_CONFIG = {
  service: "SendGrid",
  auth: {
    user: process.env.USER,
    pass: process.env.PASS
  }
};
