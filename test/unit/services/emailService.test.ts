import * as chai from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
chai.should();
chai.use(sinonChai);
import * as R from "ramda";
import * as proxyquire from "proxyquire";
import * as emailService from "../../../src/services/emailService";
import * as timekeeper from "timekeeper";
import { pubsub } from "../../../src/events";
const time = new Date(1330688329321);

describe("emailService", () => {
  before(() => {
    timekeeper.freeze(time);
  });
  describe("handleEmailClaim", () => {
    let validClaimProperty;
    before(() => {
      validClaimProperty = { type: "email", value: "email@test.com" };
    });
    it("should return true when email address is valid", () => {
      return emailService.handleEmailClaim(validClaimProperty).then(res => {
        return res.should.be.true;
      });
    });
    it("should throw an error when email is invalid", () => {
      const invalidClaimProperty = {
        type: "email",
        value: "email"
      };
      return emailService
        .handleEmailClaim(invalidClaimProperty)
        .then(() => {
          throw new Error("this should not be called");
        })
        .catch(err => {
          return err.message.should.equal(
            `The email address ${invalidClaimProperty.value} is invalid.`
          );
        });
    });

    it("should add a timestamp to claim property", () => {
      const property = emailService.addTimestamp(validClaimProperty);
      property.should.have.keys("timestamp", "type", "value");
    });

    it("should set the timestamp to the current time", () => {
      const property = emailService.addTimestamp(validClaimProperty);
      R.prop("timestamp", property).should.equal("1330688329321");
    });
    describe("wrapPropertyWithCode", () => {
      it("should generate a unique code", () => {
        const res = emailService.wrapPropertyWithCode(validClaimProperty);
        res.code.should.match(/^\d{1,5}$/);
      });

      it("should wrap property", () => {
        const res = emailService.wrapPropertyWithCode(validClaimProperty);
        res.claimProperty.should.equal(validClaimProperty);
      });
    });
    it("should save claim data", () => {
      const spy = sinon.spy();
      pubsub.on("Data:Store", spy);
      return emailService.handleEmailClaim(validClaimProperty).then(() => {
        return spy.should.have.been.called;
      });
    });
    it("should send an email", () => {
      const spy = sinon.spy();
      pubsub.on("Email:Send", spy);
      return emailService.handleEmailClaim(validClaimProperty).then(() => {
        return spy.should.have.been.called;
      });
    });
  });
});
