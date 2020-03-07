var fs = require('fs');
var path = require('path');
var request = require('request');
var merger = require('@mapbox/geojson-merge');

var mappedfiles = [];
var filteredfiles = [];

fs.readdir('mappedfacilities', function (err, files) { if (err) throw err;
  files.forEach( function (file) {
    mappedfiles.push(path.resolve('mappedfacilities', file));
    console.log(file);
  });
  var mergedStream = merger.mergeFeatureCollectionStream(mappedfiles);
  var mergedFile = fs.createWriteStream(path.resolve('mappedfacilities', 'all.geojson'));
  mergedStream.pipe(mergedFile);
});

fs.readdir('filteredfacilities', function (err, files) { if (err) throw err;
  files.forEach( function (file) {
    filteredfiles.push(path.resolve('filteredfacilities', file));
    console.log(file);
  });
  var mergedStream = merger.mergeFeatureCollectionStream(filteredfiles);
  var mergedFile = fs.createWriteStream(path.resolve('filteredfacilities', 'all.geojson'));
  mergedStream.pipe(mergedFile);
});