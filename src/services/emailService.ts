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
    from: "noreply@lifeid.io", // sender address
    to: claim.claim.value, // list of receivers
    subject: "LifeID email confirmation", // Subject line
    text: `Your email confirmation code is ${claim.code}`, // plain text body
    html: `LifeID has sent you an email confirmation code: <b>${claim.code}</b>` // html body
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
