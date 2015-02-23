var redis = require("redis"),
  events = require("events"),
  util = require("util"),
  utils = require("./utils"),
  River = require("./river.io"),
  defaults;

defaults = {
  expire: 60 * 60 * 24 * 7,
  distance: 0,
  redis: {
    host: "0.0.0.0",
    port: 6379,
    options: {}
  }
};

function Spout(output, settings) {
  var self = this;

  settings = utils.merge(defaults, settings);
  River.call(this, output, {redis: settings.redis});
  process.title = "Aqueduct:" + output + "::Spout";
}

util.inherits(Spout, River);

module.exports = Spout;
