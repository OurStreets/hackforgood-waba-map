var fs = require('fs');
var path = require('path');
var request = require('request');

function combine(directory) {
	var combined = { type: 'FeatureCollection', features: [] };

	if (fs.existsSync(path.resolve(directory, 'all.geojson'))) fs.unlinkSync(path.resolve(directory, 'all.geojson'));

	fs.readdir(directory, function (err, files) { if (err) throw err;
	  files.forEach( function (file) {
	    console.log(directory+'\\'+file);
	    var temp = JSON.parse(fs.readFileSync(path.resolve(directory,file)));
	    Array.prototype.push.apply(combined.features,temp.features);
	  });
	  fs.writeFileSync(path.resolve(directory, 'all.geojson'), JSON.stringify(combined));
});
}

combine('mappedfacilities');
combine('filteredfacilities');
combine('rawfacilities');





