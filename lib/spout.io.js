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
  var self = this,
    subscriber,
    meter;

  settings = utils.merge(defaults, settings);

  River.call(this, output, {redis: settings.redis});

  process.title = "Aqueduct:" + output + "::Spout";

  this.remove = function (key) {
    meter.del(key);
  };

  this.getMeter = function(output, key, callback) {
    key = "meter:" + output + ":" + MD5(key);
    meter.get(key, function (error, value) {
      var record;

      if (error) {
        self.emmit("error", error);
        callback(error);
        return;
      }

      if (value) {
        value = JSON.parse(value);
        callback(null, value);
        return;
      }

      callback(null);
    });
  };

  this.setMeter = function(key, value, callback) {
    meter.set(key, JSON.stringify(value), function (error, result) {
      if (error) {
        self.emmit("error", error);
        callback(error);
        return;
      }

      if(result) {
        self.emit("metered", "an event was metered", value);
      }
      callback(null);
    });
  };

  this.meter = function(key, data, meta) {
    key = "meter:" + output + ":" + MD5(key);

    meter.get(key, function (error, value) {
      var record;

      if (error) {
        self.emmit("error", error);
        return;
      }

      record = {
        "@timestamp": Date.now()
      };

      if (meta) {
        record["@meta"] = meta;
      }

      if (value) {
        value = JSON.parse(value);
        data["@meter"] = value["@meter"];
        data["@meter"].records.push(record);
        value = data;
      } else {
        value = data;
        value["@meter"] = {
          key: key,
          records: [record]
        };
      }

      meter.set(key, JSON.stringify(value), function (error, result) {
        if (error) {
          self.emmit("error", error);
          return;
        }

        if (settings.expire) {
          meter.expire(key, settings.expire);
        }

        if(result) {
          self.emit("metered", "an event was metered", value);
        }
      });
    });
  };

  meter = redis.createClient(
    settings.redis.port,
    settings.redis.host,
    settings.redis.options
  );
}

util.inherits(Spout, River);

module.exports = Spout;
