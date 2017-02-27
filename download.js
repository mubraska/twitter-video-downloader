var Promise = require('bluebird');
var streamBuffers = require('stream-buffers');
var downloader = require('download');

module.exports = function (url) {
  return new Promise((resolve, reject) => {
    var context = {
      writeableStream: new streamBuffers.WritableStreamBuffer()
    };

    downloader(url)
      .on('finish', function(response) {
        console.log('download finished');
      })
      .on('end', function(response) {
        console.log("download completed");
      })
      .on('data', function(progress) {
        context.writeableStream.write(progress);
      })
      .then(function() {
        context.writeableStream.end();
        console.log("resolving");
        resolve(context.writeableStream);
      })
      .catch(function(err) {
        reject(new Error(err));
      })
  });
}
