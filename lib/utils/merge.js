module.exports = function () {
  var merged = {},
    objects;

  objects = Array.prototype.slice.call(arguments);

  objects.forEach(function (object) {
    if (object) {
      Object.keys(object).forEach(function(key) {
        merged[key] = object[key];
      });
    }
  });

  return merged;
};
