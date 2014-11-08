var chai = require("chai"),
  expect = chai.expect;

describe("Aqueduct.io", function () {
  var Aqueduct = require("../").Aqueduct,
    base;

  describe("Aqueduct", function () {
    it("Aqueduct is expected to be ok", function (done) {
      expect(Aqueduct).to.be.ok;
      done();
    });
  });
});
