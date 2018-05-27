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
        claims: [{ type: "email", value: "john@travolta.com" }],
        subject: "did:life:980723459082734059723905",
        signature: "190879827259359ui899897asdf"
      };
      return claimService.validateClaimRequest(validClaimRequest).then(res => {
        res.should.deep.equal(validClaimRequest);
      });
    });

    it("should throw an error if claim type is not defined", () => {
      const invalidClaimRequest = {
        claims: [{ type: "mail", value: "john@travolta.com" }],
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
        claims: [{ type: "email", value: "john@travolta.com" }],
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
        claims: [{ type: "email", value: "john@travolta.com" }],
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
        claims: [{ type: "email", value: "john@travolta.com" }],
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
  describe("createClaimRequeset", () => {
    let claimServiceWithMock;
    let validClaim;
    let stub;
    let args;
    before(async () => {
      args = { type: "email", value: "john@travolta.com" };
      validClaim = {
        claims: [args],
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
        .createClaimRequeset(validClaim)
        .then(res => {
          return stub.should.be.calledWith(args);
        });
    });
    it("should return true", () => {
      return claimServiceWithMock.default
        .createClaimRequeset(validClaim)
        .then(res => {
          return res.should.be.true;
        });
    });
  });
});
