import { EventEmitter } from "events";
import * as nodemailer from "nodemailer";
import * as assert from "assert";
assert(process.env.USER, "process.env.USER missing");
assert(process.env.PASS, "process.env.PASS missing");

const stmpConfig = {
  service: "Gmail",
  auth: {
    user: process.env.USER,
    pass: process.env.PASS
  }
};

const transporter = nodemailer.createTransport(stmpConfig);
const sendEmail = message => transporter.sendMail(message).catch(console.log);
const pubsub = new EventEmitter();

pubsub.on("email", sendEmail);

export { pubsub };
