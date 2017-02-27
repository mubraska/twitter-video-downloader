// The following code was copied from the npm library twitter-dl.
// twitter-dl uses ISC license.
'use strict';

let _ = require('underscore');
let scrape = require('metatag-crawler');
let rest = require('restling');
let Promise = require('bluebird');
let fs = require('fs');
var downloader = require('../download.js');

function parse(url) {
  return new Promise((resolve, reject) => {
    scrape(url, (err, data) => {
      rest.get(data.og.videos[0].url).then(function(result) {
        let myRegexp = /data-config=\"(.*?)\"/g;
        let match = myRegexp.exec(result.data);
        let json = match[1].replace(/\&quot;/g, '"');
        let urlvid = JSON.parse(json).video_url;
        resolve(urlvid);
      }, function(error) {
        if (error.response) {
          reject(error.response);
        }
      });
    });
  });
}

function download(url) {
  return new Promise((resolve, reject) => {
    parse(url).then((result) => {
      downloader(result).then((stream) => {
        resolve(stream);
      }).catch((err) => {
        reject(err);
      });
    }).catch((err) => {
      reject(err);
    });
  });
}

module.exports = {
  download:download
}
