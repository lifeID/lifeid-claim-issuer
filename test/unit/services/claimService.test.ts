import * as chai from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
chai.should();
chai.use(sinonChai);

import * as proxyquire from "proxyquire";
import claimService from "../../../src/services/claimService";
import * as Accounts from "web3-eth-accounts";
import * as R from "ramda";

const accounts = new Accounts();

describe("claimService", () => {
  describe("validateClaimRequest", () => {
    it("should accept a valid claim request", () => {
      const validClaimRequest = {
        claim: { type: "email", value: "john@travolta.com" },
        subject: "did:life:980723459082734059723905",
        signature: "190879827259359ui899897asdf"
      };
      return claimService.validateClaimRequest(validClaimRequest).then(res => {
        res.should.deep.equal(validClaimRequest);
      });
    });

    it("should throw an error if claim type is not defined", () => {
      const invalidClaimRequest = {
        claim: { type: "mail", value: "john@travolta.com" },
        subject: "did:life:980723459082734059723905",
        signature: "190879827259359ui899897asdf"
      };
      return claimService
        .validateClaimRequest(invalidClaimRequest)
        .then(res => {
          throw new Error("This should not be called");
        })
        .catch(err =>
          err.message.should.equal("Claim type 'mail' is not valid.")
        );
    });

    it("should throw an error if subject is not a valid DID", () => {
      const invalidClaimRequest = {
        claim: { type: "email", value: "john@travolta.com" },
        subject: "did:life:9ag80723459082734059723905",
        signature: "190879827259359ui899897asdf"
      };
      return claimService
        .validateClaimRequest(invalidClaimRequest)
        .then(res => {
          throw new Error("This should not be called");
        })
        .catch(err =>
          err.message.should.equal("The subject must be a valid DID.")
        );
    });
  });

  describe("verifySignature", () => {
    it("should verify a valid signature", () => {
      const unsignedValidClaimRequest = {
        claim: { type: "email", value: "john@travolta.com" },
        subject: "did:life:11234Fd4014b81F5d1fDA1355F1bfbD14C812d3f8D22b04f0"
      };
      const privateKey =
        "0x348ce564d427a3311b6536bbcff9390d6939987657564486954e971d960fe8709";

      const signedValidClaimRequest = R.merge(unsignedValidClaimRequest, {
        signature: accounts.sign(
          JSON.stringify(unsignedValidClaimRequest),
          privateKey
        ).signature
      });
      return claimService
        .verifySignature(signedValidClaimRequest)
        .then(res => res.should.equal(signedValidClaimRequest));
    });
    it("should throw an error on invalid signature", () => {
      const invalidClaimRequest = {
        claim: { type: "email", value: "john@travolta.com" },
        subject: "did:life:9ag80723459082734059723905",
        signature: "123235456"
      };
      return claimService
        .verifySignature(invalidClaimRequest)
        .then(res => {
          throw new Error("This should not be called.");
        })
        .catch(err => {
          err.message.should.equal("The signature is invalid.");
        });
    });
  });
  describe("createClaimTicket", () => {
    let claimServiceWithMock;
    let validClaim;
    let stub;
    let args;
    before(async () => {
      args = { type: "email", value: "john@travolta.com" };
      validClaim = {
        claim: args,
        subject: "did:life:11234Fd4014b81F5d1fDA1355F1bfbD14C812d3f8D22b04f0",
        signature:
          "0xa4648d9dc6bd841ad2991d99f0fe1cff6d44edca8b9cd3327e0306b031c844ce1c0938e4a7695909449c39f3fd1e5b69297496346bf784004d4374ba92debdfd1b"
      };
      stub = sinon.stub().returns(true);
      claimServiceWithMock = proxyquire("../../../src/services/claimService", {
        "./emailService": {
          handleEmailClaim: stub
        }
      });
    });
    it("should call handle email with email type", async () => {
      return claimServiceWithMock.default
        .createClaimTicket(validClaim)
        .then(res => {
          return stub.should.be.called;
        });
    });

    it("should add keys to claimTicket", () => {
      return claimService.createClaimTicket(validClaim).then(res => {
        return res.should.have.keys("timestamp", "code", "claim", "subject");
      });
    });

    it("should set the timestamp to the current time", () => {
      return claimService.createClaimTicket(validClaim).then(res => {
        return R.prop("timestamp", res).should.equal("1330688329321");
      });
    });
  });
  describe("validateVerifyClaimRequest", () => {
    let validVerifyClaimRequest;
    let invalidVerifyClaimRequest;
    let storage;
    before(() => {
      validVerifyClaimRequest = {
        verificationCode: "12345",
        email: "testing@123.com",
        type: "email"
      };

      invalidVerifyClaimRequest = {
        verificationCode: "12345",
        email: "testing@123.com",
        type: "emole"
      };
    });
    it("should accept a valid request", () => {
      return claimService
        .validateVerifyClaimRequest(validVerifyClaimRequest)
        .then(res => {
          return res.should.not.throw;
        });
    });

    it("should issue claim on valid verification", () => {
      return claimService
        .issueClaim(storage, validVerifyClaimRequest)
        .then(res => {
          res.should.have.keys(["verifiableClaim"]);
        });
    });
    it("should throw an error if invalid type", () => {
      return claimService
        .validateVerifyClaimRequest(invalidVerifyClaimRequest)
        .then(res => {
          throw new Error("this should not be called");
        })
        .catch(err => {
          err.message.should.equal("Claim type 'emole' is not valid.");
        });
    });
  });
});
