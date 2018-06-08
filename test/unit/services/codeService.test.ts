import * as chai from "chai";
import * as sinon from "sinon";
chai.should();
import { generateCode } from "../../../src/services/codeService";

describe("code service", () => {
  describe("generateCode", () => {
    it("should take a number and return a string of the same length", () => {
      const max = 999999;
      generateCode(max).length.should.equal(6);
    });
  });
});
