var twitterdl = require('./twitter-dl/index.js');
var m3u8 = require('m3u8');
var fs   = require('fs');
var Promise = require('bluebird');
var downloader = require('./download.js');
var streamBuffers = require('stream-buffers');
var ffmpeg = require('./ffmpeg.js');

function parsem3u(writeableStream) {
  return new Promise((resolve, reject) => {
    var parser = m3u8.createStream();
    var readStream = new streamBuffers.ReadableStreamBuffer();
    readStream.put(writeableStream.getContents());
    readStream.stop();
    readStream.pipe(parser);

    parser.on('item', function(item) {
      item.set('uri', 'https://video.twimg.com' + item.get('uri'));
    });
    parser.on('m3u', function(m3u) {
      resolve(m3u);
    });
  });
}

function getUriFromm3u(m3u) {
  return m3u.items.StreamItem.slice(-1)[0].properties.uri;
}

module.exports = function(tweetUrl) {
  return new Promise((resolve) => {
    context = {
      videoStream: new streamBuffers.ReadableStreamBuffer(),
      downloadQueue: [],
      totalDuration: 0
    };

    twitterdl.download(tweetUrl)
      .then((result) => {
        return Promise.all([parsem3u(result)]);
      })
      .then((result) => {
        var uri = getUriFromm3u(result[0]);
        return downloader(uri);
      })
      .then((result) => {
        return Promise.all([parsem3u(result)]);
      })
      .then ((result) => {
        result[0].items.PlaylistItem.forEach((item) => {
          context.totalDuration += item.properties.duration;
        })
        context.downloadQueue = result[0].items.PlaylistItem.map((item) => {
          return item.properties.uri;
        });
        return Promise.each(context.downloadQueue, (item) => {
          return downloader(item)
            .then((result) => {
              context.videoStream.put(result.getContents());
            });
          });
      })
      .then(() => {
        context.videoStream.stop();
        return Promise.all([ffmpeg.convertToMp4Buffer(context.videoStream, context.totalDuration)]);
      })
      .then((result) => {
        resolve(result[0]);
      });
  });
}
