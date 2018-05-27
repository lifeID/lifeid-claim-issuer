import * as emailValidator from "email-validator";
import { ClaimProperty, ClaimPropertyWithAccessCode } from "../models/claim";
import * as leftPad from "left-pad";
import * as R from "ramda";
import * as Promise from "bluebird";
import { pubsub } from "../events";

function handleEmailClaim(claim: ClaimProperty) {
  return Promise.resolve(claim)
    .then(_validateEmail)
    .then(addTimestamp)
    .then(wrapPropertyWithCode)
    .tap(storeClaim)
    .tap(sendEmail)
    .then(() => true);
}

function addTimestamp(claimProperty: ClaimProperty): ClaimProperty {
  return R.merge({ timestamp: `${new Date().getTime()}` }, claimProperty);
}
function wrapPropertyWithCode(
  claimProperty: ClaimProperty
): ClaimPropertyWithAccessCode {
  pubsub.emit("loggedIn", "test");
  return {
    code: _generateCode(),
    claimProperty
  };
}

function _validateEmail(claimProperty): ClaimProperty {
  if (!emailValidator.validate(claimProperty.value)) {
    throw new Error(`The email address ${claimProperty.value} is invalid.`);
  }
  return claimProperty;
}

function storeClaim(claimProperty: ClaimPropertyWithAccessCode): boolean {
  pubsub.emit("Data:Store", JSON.stringify(claimProperty));
  return true;
}

function sendEmail(claimProperty: ClaimPropertyWithAccessCode): boolean {
  pubsub.emit("Email:Send", JSON.stringify(claimProperty));
  return true;
}

function _generateCode() {
  return leftPad(_getRandomInt(99999), 5, 0);
}

function _getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

export { handleEmailClaim, wrapPropertyWithCode, addTimestamp };
