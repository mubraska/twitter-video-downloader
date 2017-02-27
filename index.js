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
    // var file   = fs.createReadStream(filePath);
    var readStream = new streamBuffers.ReadableStreamBuffer();
    readStream.put(writeableStream.getContents());
    readStream.stop();
    readStream.pipe(parser);

    parser.on('item', function(item) {
      // emits PlaylistItem, MediaItem, StreamItem, and IframeStreamItem
      item.set('uri', 'https://video.twimg.com' + item.get('uri'));
      // console.log(item);
    });
    parser.on('m3u', function(m3u) {
      // console.log("m3u", m3u);
      resolve(m3u);
    });
  });
}

function getUriFromm3u(m3u) {
  return m3u.items.StreamItem.slice(-1)[0].properties.uri;
}

module.exports = function(tweetUrl) {
  context = {
    videoStream: new streamBuffers.ReadableStreamBuffer(),
    downloadQueue: [],
    totalDuration: 0
  };

  return twitterdl.download(tweetUrl)
    .then((result) => {
      console.log("first_buffer", result);
      return Promise.all([parsem3u(result)]);
    })
    .then((result) => {
      console.log("stream_item", result[0].items.StreamItem);
      var uri = getUriFromm3u(result[0]);
      console.log("first_parse", uri);
      return downloader(uri);
    })
    .then((result) => {
      console.log("second_buffer", result);
      return Promise.all([parsem3u(result)]);
    })
    .then ((result) => {
      console.log("playlist_item", result[0].items.PlaylistItem);
      result[0].items.PlaylistItem.forEach((item) => {
        context.totalDuration += item.properties.duration;
      })
      context.downloadQueue = result[0].items.PlaylistItem.map((item) => {
        return item.properties.uri;
      });
      console.log("duration", context.totalDuration);
      console.log("playlist", context.downloadQueue);
      return Promise.each(context.downloadQueue, (item) => {
        console.log("downloading video");
        return downloader(item)
          .then((result) => {
            console.log("piping to video stream");
            context.videoStream.put(result.getContents());
          });
        });
    })
    .then(() => {
      console.log("ending stream");
      context.videoStream.stop();
      console.log("video_ts_buffer", context.videoStream);
      return Promise.all([ffmpeg.convertToMp4Buffer(context.videoStream, context.totalDuration)]);
    })
    .then((result) => {
      return result[0];
    });
}
