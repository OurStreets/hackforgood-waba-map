var fs = require('fs');
var path = require('path');
var request = require('request');
var merger = require('@mapbox/geojson-merge');

var myfiles = [];

fs.readdir('mappedfacilities', function (err, files) { if (err) throw err;
  files.forEach( function (file) {
    myfiles.push(path.resolve('mappedfacilities', file));
    console.log(file);
  });
  var mergedStream = merger.mergeFeatureCollectionStream(myfiles);
  var mergedFile = fs.createWriteStream(path.resolve('mappedfacilities', 'all.geojson'));
  mergedStream.pipe(mergedFile);
});

fs.readdir('filteredfacilities', function (err, files) { if (err) throw err;
  files.forEach( function (file) {
    myfiles.push(path.resolve('filteredfacilities', file));
    console.log(file);
  });
  var mergedStream = merger.mergeFeatureCollectionStream(myfiles);
  var mergedFile = fs.createWriteStream(path.resolve('filteredfacilities', 'all.geojson'));
  mergedStream.pipe(mergedFile);
});