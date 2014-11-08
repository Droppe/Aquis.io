var chai = require("chai"),
  expect = chai.expect;

describe("Pipe.io", function () {
  var Pipe = require("../").Pipe,
    base;

  describe("Pipe", function () {
    it("Pipe is expected to be ok", function (done) {
      expect(Pipe).to.be.ok;
      done();
    });
  });
});
