var net = require("net"),
  redis = require("redis"),
  util = require("util"),
  utils = require("./utils"),
  events = require("events"),
  defaults;

defaults = {
  redis: {
    host: "0.0.0.0",
    port: 6379,
    options: {}
  },
  host: undefined,
  port: 0,
  maxConnections: Infinity
};

function Aqueduct(input, output, settings) {
  var self = this,
    clients = [],
    index = 0,
    subscriber,
    channel,
    server;

  settings = utils.merge(defaults, settings);
  events.EventEmitter.call(this);

  function publish(message) {
    var client;

    if (clients.length === 0) {
      self.emit("warning", "no clients are avaliable");
      return;
    }

    if (index >= clients.length) {
      index = 0;
    }

    client = clients[index];
    client.write(message + "\n");

    index += 1;

    self.emit("published", "a message was published to the client");
  }

  channel = input + "-" + output;

  process.title = "Aqueduct:" + channel + "::Aqueduct";

  server = net.createServer(function(socket) {
    socket.id = utils.md5(socket.remoteAddress + ":" + socket.remotePort);
    clients.push(socket);
    socket.on("end", function () {
      clients.some(function (client, index) {
        if (client.id === socket.id) {
          clients.splice(index, 1);
          return true;
        }
      });
    });
    socket.on("error", function (error) {});
  });

  server.maxConnections = settings.maxConnections;

  server.listen(settings.port, settings.host, function() {
    var address = JSON.stringify(server.address()),
      id = utils.uuid.v4(),
      key = "aqueduct:" + channel + ":" + id,
      register;

    register = redis.createClient(
      settings.redis.port,
      settings.redis.host,
      settings.redis.options
    );

    register.set(key, address);

    server.on("close", function () {
      process.exit();
    });

    process.on("exit", function(code) {
      register.del(key);
    });

    process.on("SIGINT", function() {
      process.exit();
    });
  });

  subscriber = redis.createClient(
    settings.redis.port,
    settings.redis.host,
    settings.redis.options
  );

  subscriber.subscribe(input);

  subscriber.on("message", function (channel, message) {
    publish(message);
  });
}

util.inherits(Aqueduct, events.EventEmitter);

module.exports = Aqueduct;
