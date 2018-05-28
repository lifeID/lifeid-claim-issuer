import * as emailValidator from "email-validator";
import { ClaimProperty, ClaimPropertyWithAccessCode } from "../models/claim";
import * as leftPad from "left-pad";
import * as R from "ramda";
import * as Promise from "bluebird";
import { pubsub } from "../events";

function handleEmailClaim(claim: ClaimProperty) {
  return Promise.resolve(claim)
    .then(_validateEmail)
    .then(_wrapPropertyWithCode)
    .tap(_emitStoreClaim)
    .tap(_emitSendEmail);
}

function storeClaim(
  storage,
  claim: ClaimPropertyWithAccessCode
): Promise<boolean> {
  // store claim and expire in 1 day(86400 seconds)
  return storage.upsert(claim.claimProperty.value, claim, 86400);
}

function sendEmail(claim: ClaimPropertyWithAccessCode, emailer) {
  return true;
}

function _wrapPropertyWithCode(
  claimProperty: ClaimProperty
): ClaimPropertyWithAccessCode {
  pubsub.emit("loggedIn", "test");
  return {
    code: _generateCode(),
    timestamp: _getTimestamp(),
    claimProperty
  };
}

function _getTimestamp(): string {
  return `${new Date().getTime()}`;
}

function _validateEmail(claimProperty): ClaimProperty {
  if (!emailValidator.validate(claimProperty.value)) {
    throw new Error(`The email address ${claimProperty.value} is invalid.`);
  }
  return claimProperty;
}

function _emitStoreClaim(claimProperty: ClaimPropertyWithAccessCode): boolean {
  pubsub.emit("Data:Store", JSON.stringify(claimProperty));
  return true;
}

function _emitSendEmail(claimProperty: ClaimPropertyWithAccessCode): boolean {
  pubsub.emit("Email:Send", JSON.stringify(claimProperty));
  return true;
}

function _generateCode() {
  return leftPad(_getRandomInt(99999), 5, 0);
}

function _getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

export { handleEmailClaim, storeClaim };
