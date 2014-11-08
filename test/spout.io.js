var chai = require("chai"),
  expect = chai.expect;

describe("Spout.io", function () {
  var Spout = require("../").Spout,
    base;

  describe("Spout", function () {
    it("Spout is expected to be ok", function (done) {
      expect(Spout).to.be.ok;
      done();
    });
  });
});
