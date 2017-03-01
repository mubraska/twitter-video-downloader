var Promise = require('bluebird');
var streamBuffers = require('stream-buffers');
var downloader = require('download');

module.exports = function (url) {
  return new Promise((resolve, reject) => {
    var context = {
      writeableStream: null
    };
    context.writeableStream = new streamBuffers.WritableStreamBuffer()

    downloader(url)
      .on('finish', function(response) {
      })
      .on('end', function(response) {
      })
      .on('data', function(progress) {
        context.writeableStream.write(progress);
      })
      .then(function() {
        context.writeableStream.end();
        resolve(context.writeableStream);
      })
      .catch(function(err) {
        reject(new Error(err));
      })
  });
}
