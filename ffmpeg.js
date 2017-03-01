var ffmpeg = require('fluent-ffmpeg');
var Promise = require('bluebird');
var streamBuffers = require('stream-buffers');
var fs   = require('fs');

var convertToMp4Buffer = function(inputBuffer, duration) {
  return new Promise((resolve, reject) => {
    var stream = null;
    stream = new streamBuffers.WritableStreamBuffer();
    try {
      ffmpeg()
        .input(inputBuffer)
        .format('mp4')
        .duration(duration)
        .audioCodec('copy')
        .videoCodec('copy')
        .outputOptions(['-bsf:a aac_adtstoasc', '-movflags frag_keyframe+empty_moov'])
        .output(stream)
        .on('end', () => {
          stream.end();
          resolve(stream);
        })
        .run();

    } catch (e) {
      console.log(e);
      reject(e);
    }
  });
}

module.exports = {
  convertToMp4Buffer: convertToMp4Buffer
}
