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
  describe("validateClaim", () => {
    let validClaimTicket;
    before(() => {
      validClaimTicket = {
        subject: "did:life:12345",
        timestamp: "12345",
        claim: { type: "email", value: "email@test.com" }
      };
    });
    it("should accept a valid email", () => {
      return emailService.validateClaim(validClaimTicket).then(res => {
        return res.should.not.throw;
      });
    });
    it("should throw an error when email is invalid", () => {
      const invalidClaimTicket = {
        subject: "did:12345122345",
        timestamp: "123123123",
        claim: {
          type: "email",
          value: "email"
        }
      };
      return emailService
        .validateClaim(invalidClaimTicket)
        .then(() => {
          throw new Error("this should not be called");
        })
        .catch(err => {
          return err.message.should.equal(
            `The email address ${invalidClaimTicket.claim.value} is invalid.`
          );
        });
    });

    describe("handleEmailClaim", () => {
      it("should generate a unique code", () => {
        return emailService.handleEmailClaim(validClaimTicket).then(res => {
          return res.code.should.match(/^\d{1,5}$/);
        });
      });
    });
  });
});
