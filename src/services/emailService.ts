import * as emailValidator from "email-validator";
import { ClaimProperty } from "../models/claim";
import { ClaimTicket } from "../models/claimTicket";
import * as leftPad from "left-pad";
import * as R from "ramda";
import * as Promise from "bluebird";
import { pubsub } from "../events";

function handleEmailClaim(claimTicket: ClaimTicket): Promise<ClaimTicket> {
  return Promise.resolve(claimTicket).then(_addAccessCode);
}

function sendEmail(claim: ClaimTicket, emailer) {
  return true;
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
  return R.merge({ code: _generateCode() }, claimTicket);
}

function _generateCode() {
  return leftPad(_getRandomInt(99999), 5, 0);
}

function _getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

export { handleEmailClaim, validateClaim, sendEmail };
