import * as emailValidator from "email-validator";
import { ClaimProperty } from "../models/claim";
import { ClaimTicket } from "../models/claimTicket";
import * as R from "ramda";
import * as Promise from "bluebird";
import { pubsub } from "../events";
import { generateCode } from "./codeService";

function handleEmailClaim(claimTicket: ClaimTicket): Promise<ClaimTicket> {
  return Promise.resolve(claimTicket).then(_addAccessCode);
}

function sendEmail(claim: ClaimTicket) {
  const message = {
    from: "noreply-lifeid.io", // sender address
    to: "seth@lifeid.io", // list of receivers
    subject: "Hello ✔", // Subject line
    text: "It's the plain text body", // plain text body
    html: `<b>${claim.code}</b>` // html body
  };
  pubsub.emit("email", message);
  return;
}

function validateClaim(claimTicket: ClaimTicket): Promise<boolean> {
  const claimProperty = claimTicket.claim;

  return Promise.resolve(claimProperty)
    .then(() => {
      if (!emailValidator.validate(claimProperty.value)) {
        throw new Error(`The email address ${claimProperty.value} is invalid.`);
      }
    })
    .then(() => true);
}
function _addAccessCode(claimTicket: ClaimTicket): ClaimTicket {
  return R.merge({ code: generateCode(999999) }, claimTicket);
}

export { handleEmailClaim, validateClaim, sendEmail };
