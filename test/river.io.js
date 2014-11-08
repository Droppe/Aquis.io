var chai = require("chai"),
  expect = chai.expect;

describe("River.io", function () {
  var River = require("../").River,
    base;

  describe("River", function () {
    it("River is expected to be ok", function (done) {
      expect(River).to.be.ok;
      done();
    });
  });
});
