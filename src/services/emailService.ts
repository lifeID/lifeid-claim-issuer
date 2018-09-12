import * as emailValidator from "email-validator";
import { ClaimProperty } from "../models/claim";
import { ClaimTicket } from "../models/claimTicket";
import * as R from "ramda";
import * as Promise from "bluebird";
import { generateCode } from "./codeService";
import * as nodemailer from "nodemailer";
import {
  SENDGRID_HOST,
  SENDGRID_PASSWORD,
  SENDGRID_USERNAME,
  SENDGRID_PORT
} from "../constants";

const transporter = nodemailer.createTransport({
  host: SENDGRID_HOST,
  port: SENDGRID_PORT,
  auth: {
    user: SENDGRID_USERNAME,
    pass: SENDGRID_PASSWORD
  }
});

function handleEmailClaim(claimTicket: ClaimTicket): Promise<ClaimTicket> {
  return Promise.resolve(claimTicket).then(_addAccessCode);
}

function sendEmail(claimTicket: ClaimTicket) {
  console.log("sending email");
  return Promise.resolve(claimTicket)
    .then(_buildEmailMessage)
    .then(_sendMessageFromSendgrid);
}

function validateClaim(claimTicket: ClaimTicket): Promise<boolean> {
  const claimProperty = claimTicket.claim;

  return Promise.resolve(claimProperty)
    .then(() => {
      if (!emailValidator.validate(claimProperty.email)) {
        throw new Error(`The email address ${claimProperty.email} is invalid.`);
      }
    })
    .then(() => true);
}

function verifyNodemailer() {
  return transporter.verify((error, success) => {
    if (error) {
      console.log("An error occurred configuring nodemailer: ", error);
    } else {
      console.log("nodemailer configured successfully");
    }
  });
}

function _buildEmailMessage(claimTicket: ClaimTicket) {
  return {
    from: "noreply@lifeid.io", // sender address
    to: claimTicket.claim.email, // list of receivers
    subject: "LifeID email confirmation",
    text: `Your email confirmation code is ${claimTicket.code}`, // plain text body
    html: `LifeID has sent you an email confirmation code: <b>${
      claimTicket.code
    }</b>` // html body
  };
}

function _sendMessageFromSendgrid(message) {
  return transporter.sendMail(message, _loggingCallback);
}

function _loggingCallback(error, info) {
  if (error) {
    return console.log("An error occurred sending the email: ", error);
  } else {
    return console.log("Message sent successfully: ", info);
  }
}
function _addAccessCode(claimTicket: ClaimTicket): ClaimTicket {
  return R.merge({ code: generateCode(999999) }, claimTicket);
}

export { verifyNodemailer, handleEmailClaim, validateClaim, sendEmail };
