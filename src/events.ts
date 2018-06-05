import { EventEmitter } from "events";
import * as nodemailer from "nodemailer";
import * as assert from "assert";
assert(process.env.USER, "process.env.USER missing");
assert(process.env.PASS, "process.env.PASS missing");

const stmpConfig = {
  pool: true,
  host: "stmp.gmail.com",
  port: "587", // google's tls port, for ssl use 465
  secure: true,
  auth: {
    user: process.env.USER,
    pass: process.env.PASS
  }
};

const transporter = nodemailer.createTransport(stmpConfig);
const sendEmail = message => transporter.sendMail(message);
const pubsub = new EventEmitter();

pubsub.on("email", sendEmail);

export { pubsub };
