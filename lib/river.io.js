var redis = require("redis"),
  util = require("util"),
  utils = require("./utils"),
  events = require("events"),
  defaults;

defaults = {
  redis: {
    host: "0.0.0.0",
    port: 6379,
    options: {}
  }
};

function River(output, settings) {
  var self = this,
    channel,
    publisher;

  settings = utils.merge(defaults, settings);

  events.EventEmitter.call(this);

  channel = output;
  process.title = "Aqueduct:" + channel + "::River";

  publisher = redis.createClient(
    settings.redis.port,
    settings.redis.host,
    settings.redis.options
  );

  this.publish = function (data) {
    var message;
    if (typeof data === "string") {
      try {
        message = data;
        data = JSON.parse(data);
      } catch (e) {
        self.emit("error", "invalid data", data);
        return;
      }
    } else {
      message = JSON.stringify(data);
    }

    publisher.publish(output, message);
    self.emit("published", "a message was published to redis", data);
  };
}

util.inherits(River, events.EventEmitter);

module.exports = River;
