﻿var fs = require('fs');
var path = require('path');
var request = require('request');

var montgomery = { name: 'Montgomery County, MD', url: 'https://data.montgomerycountymd.gov/api/geospatial/icc2-ppee?method=export&format=GeoJSON', type: 'geojson', filename: 'MD_MontgomeryCounty.geojson', mappingFunction: mocoMap, done: false };
var arlington = { name: 'Arlington County, VA', url: 'http://gisdata.arlgis.opendata.arcgis.com/datasets/af497e2747104622ac74f4457b3fb73f_4.geojson', type: 'geojson', filename: 'VA_Arlington.geojson', mappingFunction: arlingtonMap, done: false };
var alexandria = { name: 'Alexandria, VA', url: 'http://data.alexgis.opendata.arcgis.com/datasets/685dfe61f1aa477f8cbd21dceb5ba9b5_0.geojson', type: 'geojson', filename: 'VA_Alexandria.geojson', mappingFunction: alexandriaMap, done: false };
var dcLanes = { name: 'Washington, DC Bike Lanes', url: 'http://opendata.dc.gov/datasets/294e062cdf2c48d5b9cbc374d9709bc0_2.geojson', type: 'geojson', filename: 'DC_Washington_BikeLanes.geojson', mappingFunction: dcLanesMap, done: false, onDone: combineDC };
var dcTrails = { name: 'Washington, DC Trails', url: 'http://opendata.dc.gov/datasets/e8c2b7ef54fb43d9a2ed1b0b75d0a14d_4.geojson', type: 'geojson', filename: 'DC_Washington_Trails.geojson', mappingFunction: dcTrailsMap, done: false, onDone: combineDC };
var princeGeorges = { name: 'Prince George\'s County, MD', url: 'http://gisdata.pgplanning.org/opendata/downloadzip.asp?FileName=/data/ShapeFile/Master_Plan_Trail_Ln.zip', type: 'shapefile', filename: 'MD_PrinceGeorgesCounty.geojson', mappingFunction: pgMap, done: false };

function fetch(locality) {
    console.log('fetching file for ' + locality.name);
    if (locality.type == 'shapefile') {
        request({
            url: locality.url,
            encoding: null
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                fs.writeFileSync(path.resolve('bikelanes', 'temp.zip'), body);
                console.log('Converting Shapefile to GeoJson for ' + locality.name);
                var formData = { upload: fs.createReadStream(path.resolve('bikelanes', 'temp.zip')), targetSrs: 'EPSG:4326' };
                request.post({
                    url: 'http://ogre.adc4gis.com/convert',
                    formData: formData
                }, function (error, response, body) {
                    fs.unlinkSync(path.resolve('bikelanes', 'temp.zip'));
                    if (!error && response.statusCode === 200) {
                        mapFilterSave(JSON.parse(body), locality);
                    } else {
                        console.log('ERROR: ' + error);
                    }
                });
            } else {
                console.log('ERROR: ' + error);
            }
        })        
    }
    else {
        request({
            url: locality.url,
            json: true
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                mapFilterSave(body, locality);
            } else {
                console.log('ERROR: ' + error);
            }
        })
    }
    
}

function mapFilterSave(geoJson, locality) {
    //each locality has their own labeling & categorizing system.  Normalize them.
    console.log('mapping raw file for ' + locality.name);
    console.log('# of raw features: ' + geoJson.features.length);
    var mappedGeoJson = locality.mappingFunction(geoJson);

    //filter it so we don't have sharrows and wide shoulders and other things WABA doesn't consider infrastructure
    console.log('filtering mapped file for ' + locality.name);
    mappedGeoJson.features = mappedGeoJson.features.filter(isRealBikeFacility);

    console.log('writing finalized file to disk for ' + locality.name);
    //write to disk
    fs.writeFileSync(path.resolve('bikelanes', locality.filename), JSON.stringify(mappedGeoJson));
    locality.done = true;
    if (locality.onDone) locality.onDone();
}

function mocoMap(rawGeoJson) {
    //keep objectid
    //keep name
    //convert category = 'Paved Off-Road Trail' to wabaclassification = 'Paved Trail'
    //convert category = 'Bike Lanes' to wabaclassification = 'Bike Lane'
    //convert category = 'Bike-Friendly Shoulders' to wabaclassification = 'Shoulder'
    //convert category = 'Signed On-Road Route' to wabaclassification = 'Signed Route'
    //convert category = 'Natural Surface' to wabaclassification = 'Unpaved Trail'
    //convert category = 'Separated Bike Lanes' to wabaclassification = 'Separated Bike Lanes'

    var geojson = { type: 'FeatureCollection', features: [] };
    for (var i = 0; i < rawGeoJson.features.length; i++) {
        var rawFeature = rawGeoJson.features[i];
        var mappedFeature = { type: 'Feature', properties: { objectid: rawFeature.properties.objectid, name: rawFeature.properties.name }, geometry: rawFeature.geometry };
        if (rawFeature.properties.category == 'Paved Off-Road Trail') mappedFeature.properties.wabaclassification = 'Paved Trail';
        if (rawFeature.properties.category == 'Bike Lanes') mappedFeature.properties.wabaclassification = 'Bike Lane';
        if (rawFeature.properties.category == 'Bike-Friendly Shoulders') mappedFeature.properties.wabaclassification = 'Shoulder';
        if (rawFeature.properties.category == 'Signed On-Road Route') mappedFeature.properties.wabaclassification = 'Signed Route';
        if (rawFeature.properties.category == 'Natural Surface') mappedFeature.properties.wabaclassification = 'Unpaved Trail';
        if (rawFeature.properties.category == 'Separated Bike Lanes') mappedFeature.properties.wabaclassification = 'Separated Bike Lane';

        geojson.features.push(mappedFeature);
    }

    return geojson;
}

function arlingtonMap(rawGeoJson) {
    //convert OBJECTID to objectid
    //convert Label to name
    //convert Route_Type = 'Off Street Trail' to wabaclassification = 'Paved Trail'
    //convert Route_Type = 'Marked Route' to wabaclassification = 'Bike Lane'
    //convert Route_Type = 'Sharrow' to wabaclassification = 'Sharrows'
    //convert Route_Type = 'Suggested Route' to wabaclassification = 'Signed Route'

    var geojson = { type: 'FeatureCollection', features: [] };
    for (var i = 0; i < rawGeoJson.features.length; i++) {
        var rawFeature = rawGeoJson.features[i];
        var mappedFeature = { type: 'Feature', properties: { objectid: rawFeature.properties.OBJECTID, name: rawFeature.properties.Label }, geometry: rawFeature.geometry };
        if (rawFeature.properties.Route_Type == 'Off Street Trail') mappedFeature.properties.wabaclassification = 'Paved Trail';
        if (rawFeature.properties.Route_Type == 'Marked Route') mappedFeature.properties.wabaclassification = 'Bike Lane';
        if (rawFeature.properties.Route_Type == 'Sharrow') mappedFeature.properties.wabaclassification = 'Sharrows';
        if (rawFeature.properties.Route_Type == 'Suggested Route') mappedFeature.properties.wabaclassification = 'Signed Route';

        geojson.features.push(mappedFeature);
    }

    return geojson;
}

function alexandriaMap(rawGeoJson) {
    //filter to STATUS = 'Existing'
    //convert FID to objectid
    //convert TRAILTYPE = 'Off Street' to wabaclassification = 'Paved Trail'
    //convert TRAILTYPE = 'On Street' and SHARROW = 'No' to wabaclassification = 'Bike Lane'
    //convert TRAILTYPE = 'On Street' and SHARROW = 'Yes' to wabaclassification = 'Sharrows'

    var geojson = { type: 'FeatureCollection', features: [] };
    rawGeoJson.features = rawGeoJson.features.filter(function (value) { return value.properties.STATUS == 'Existing'; })

    for (var i = 0; i < rawGeoJson.features.length; i++) {
        var rawFeature = rawGeoJson.features[i];
        var mappedFeature = { type: 'Feature', properties: { objectid: rawFeature.properties.FID }, geometry: rawFeature.geometry };
        if (rawFeature.properties.TRAILTYPE == 'Off Street') mappedFeature.properties.wabaclassification = 'Paved Trail';
        if (rawFeature.properties.TRAILTYPE == 'On Street' && rawFeature.properties.SHARROW == 'No') mappedFeature.properties.wabaclassification = 'Bike Lane';
        if (rawFeature.properties.TRAILTYPE == 'On Street' && rawFeature.properties.SHARROW == 'Yes') mappedFeature.properties.wabaclassification = 'Sharrows';

        geojson.features.push(mappedFeature);
    }

    return geojson;
}

function dcLanesMap(rawGeoJson) {
    //convert OBJECTID to objectid
    //convert FACILITY = 'Bus/Bike Lane' to wabaclassification = 'Bus/Bike Lane'
    //convert FACILITY = 'Existing Bike Lane' to wabaclassification = 'Bike Lane'
    //convert FACILITY = 'Cycle Track' to wabaclassification = 'Separated Bike Lane'
    //convert FACILITY = 'Shared Lane' to wabaclassification = 'Sharrows'
    //convert FACILITY = 'Contraflow Bike Lane' to wabaclassification = 'Bike Lane'
    //convert FACILITY = 'Climbing Lane' to wabaclassification = 'Bike Lane'

    var geojson = { type: 'FeatureCollection', features: [] };
    for (var i = 0; i < rawGeoJson.features.length; i++) {
        var rawFeature = rawGeoJson.features[i];
        var mappedFeature = { type: 'Feature', properties: { objectid: rawFeature.properties.OBJECTID }, geometry: rawFeature.geometry };
        if (rawFeature.properties.FACILITY == 'Bus/Bike Lane') mappedFeature.properties.wabaclassification = 'Bus/Bike Lane';
        if (rawFeature.properties.FACILITY == 'Existing Bike Lane') mappedFeature.properties.wabaclassification = 'Bike Lane';
        if (rawFeature.properties.FACILITY == 'Climbing Lane') mappedFeature.properties.wabaclassification = 'Bike Lane';
        if (rawFeature.properties.FACILITY == 'Shared Lane') mappedFeature.properties.wabaclassification = 'Sharrows';
        if (rawFeature.properties.FACILITY == 'Contraflow Bike Lane') mappedFeature.properties.wabaclassification = 'Bike Lane';
        if (rawFeature.properties.FACILITY == 'Cycle Track') mappedFeature.properties.wabaclassification = 'Separated Bike Lane';

        geojson.features.push(mappedFeature);
    }

    return geojson;
}

function dcTrailsMap(rawGeoJson) {
    //convert OBJECTID to objectid
    //convert NAME to name
    //set all to wabaclassification = 'Paved Trail'

    var geojson = { type: 'FeatureCollection', features: [] };
    for (var i = 0; i < rawGeoJson.features.length; i++) {
        var rawFeature = rawGeoJson.features[i];
        var mappedFeature = { type: 'Feature', properties: { objectid: rawFeature.properties.OBJECTID, name: rawFeature.properties.NAME }, geometry: rawFeature.geometry };
        mappedFeature.properties.wabaclassification = 'Paved Trail';

        geojson.features.push(mappedFeature);
    }

    return geojson;
}

function pgMap(rawGeoJson) {
    //filter to FACILITY_S = 'Existing'
    //convert FACILITY_N to name
    //convert FACILITY_T = 'Hard Surface Trail' to wabaclassification = 'Paved Trail'
    //convert FACILITY_T = 'Shared Roadway' to wabaclassification = 'Sharrows'
    //convert FACILITY_T = 'Bike Lane' to wabaclassification = 'Bike Lane'

    var geojson = { type: 'FeatureCollection', features: [] };
    rawGeoJson.features = rawGeoJson.features.filter(function (value) { return value.properties.FACILITY_S == 'Existing'; })

    for (var i = 0; i < rawGeoJson.features.length; i++) {
        var rawFeature = rawGeoJson.features[i];
        var mappedFeature = { type: 'Feature', properties: { objectid: i }, geometry: rawFeature.geometry };
        if (rawFeature.properties.FACILITY_T == 'Hard Surface Trail') mappedFeature.properties.wabaclassification = 'Paved Trail';
        if (rawFeature.properties.FACILITY_T == 'Shared Roadway') mappedFeature.properties.wabaclassification = 'Sharrows';
        if (rawFeature.properties.FACILITY_T == 'Bike Lane') mappedFeature.properties.wabaclassification = 'Bike Lane';
        if (rawFeature.properties.FACILITY_T == 'Natural Surface Trail') mappedFeature.properties.wabaclassification = 'Unpaved Trail';
        if (rawFeature.properties.FACILITY_T == 'Sidepath') mappedFeature.properties.wabaclassification = 'Sidewalk';

        geojson.features.push(mappedFeature);
    }

    return geojson;
}

function isRealBikeFacility(value) {
    return (value.properties.wabaclassification == 'Paved Trail' || value.properties.wabaclassification == 'Bike Lane' || value.properties.wabaclassification == 'Separated Bike Lane');
}

function combineDC() {
    if (dcLanes.done && dcTrails.done) {
        console.log('Combining DC Trails geojson with DC Lanes geojson');
        var lanes = JSON.parse(fs.readFileSync(path.resolve('bikelanes', dcLanes.filename), 'utf8'));
        var trails = JSON.parse(fs.readFileSync(path.resolve('bikelanes', dcTrails.filename), 'utf8'));
        lanes.features = lanes.features.concat(trails.features);

        fs.writeFileSync(path.resolve('bikelanes', 'DC_Washington.geojson'), JSON.stringify(lanes));
        fs.unlinkSync(path.resolve('bikelanes', dcLanes.filename));
        fs.unlinkSync(path.resolve('bikelanes', dcTrails.filename));
    }
    
}

fetch(montgomery);
fetch(arlington);
fetch(alexandria);
fetch(dcLanes);
fetch(dcTrails);
fetch(princeGeorges);

