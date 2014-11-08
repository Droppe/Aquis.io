var net = require("net"),
  redis = require("redis"),
  util = require("util"),
  events = require("events"),
  cluster = require("cluster"),
  defaults;

defaults = {
  max: 2,
  min: 1,
  silent: false,
  discover: 5000,
  queue: Infinity,
  redis: {
    host: "0.0.0.0",
    port: 6379,
    options: {}
  }
};

function Pipe(input, output, worker, settings) {
  var self = this,
    workers = [],
    queue = [],
    index = 0,
    server,
    channel,
    register;

  settings = require("./utils").merge(defaults, settings);

  events.EventEmitter.call(this);

  channel = input + "-" + output;
  process.title = "Aqueduct:" + channel + "::Pipe";

  function next() {
    var worker,
      message;

    if (queue.length > 1 && workers.length < settings.max) {
      cluster.fork();
    }

    if (!workers[index] && index === 0) {
      self.emit("warning", "no workers are avaliable.");
      return;
    } else if (!workers[index]) {
      index = 0;
    }

    if (queue.length === 0) {
      return;
    }

    worker = workers[index];

    message = queue.shift();

    try {
      worker.send(JSON.parse(message.toString()));
      index += 1;
      self.emit("published", "a message was published to the worker");
    } catch (e) {
      self.emit("warning", "a message could not be sent");
    }
  }

  function publish(message) {
    queue.push(message);
    if (queue.length > settings.queue) {
      queue.shift();
    }
    next();
    return;
  }

  function connect(callback) {
    function retry() {
      setTimeout(function () {
        connect(callback);
      }, settings.discover);
    }

    register.keys("aqueduct:" + channel + "*", function (error, keys) {
      var key,
        connection;

      if (error) {
        self.emit("error", error);
        callback(error);
        return;
      }

      if (keys) {
        key = keys[Math.floor(Math.random() * keys.length)];
        register.get(key, function (error, value) {
          if (error) {
            self.emit("error", error);
            callback(error);
            return;
          }
          if (value) {
            value = JSON.parse(value);
            try {
              connection = net.connect(value.port, value.address, function () {
                callback(null, connection);
                connection.on("close", function () {
                  retry(callback);
                });
              });
            } catch(e) {
              self.emit("warning", "aqueduct is not accepting connections @" + key + ".");
              retry(callback);
              return;
            }
            return;
          }
          self.emit("warning", "an aqueduct could not be idetified.");
          retry();
        });
        return;
      }
      self.emit("warning", "An aqueduct for " + channel + " is not avaliable");
      retry();
    });
  }

  register = redis.createClient(
    settings.redis.port,
    settings.redis.host,
    settings.redis.options
  );


  cluster.setupMaster({
    exec: worker,
    silent: settings.silent
  });

  cluster.on("online", function (worker) {
    workers.push(worker);
    next();
  });

  cluster.on("fork", function(worker) {
    worker.on("error", function () {
      worker.kill();
    });

    worker.on("message", function (message) {
      if (message.status === "ready") {
        if (workers.length > queue.length && workers.length > settings.min) {
          worker.kill();
        }
        next();
      }
    });

    worker.on("exit", function () {
      workers.some(function (wonker, index) {
        if (wonker.id === worker.id) {
          workers.splice(index, 1);
          return true;
        }
      });
    });
  });

  for(var i = 0; i< settings.min; i += 1) {
    cluster.fork();
  }

  connect(function (error, client) {
    client.on("data", function (message) {
      var messages = message.toString().split(/(\r?\n)/g);
      messages.forEach(function (message) {
        if (message && message !== "\n") {
          publish(message);
        }
      });
    });
  });
}

util.inherits(Pipe, events.EventEmitter);

module.exports = Pipe;
