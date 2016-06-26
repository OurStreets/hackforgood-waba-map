L.mapbox.accessToken = 'pk.eyJ1IjoiYWx1bHNoIiwiYSI6ImY0NDBjYTQ1NjU4OGJmMDFiMWQ1Y2RmYjRlMGI1ZjIzIn0.pngboKEPsfuC4j54XDT3VA';

var map = L.mapbox.map('map', 'mapbox.light', { zoomControl: false })
    .setView([38.898, -77.043], 12);

new L.Control.Zoom({ position: 'bottomright' }).addTo(map);

var dcBufferLayer = L.mapbox.featureLayer().addTo(map);
var mocoBufferLayer = L.mapbox.featureLayer().addTo(map);
var fairfaxBufferLayer = L.mapbox.featureLayer().addTo(map);

var dcBikeLanes = L.mapbox.featureLayer().addTo(map);
var mocoBikeWays = L.mapbox.featureLayer().addTo(map);
var fairfaxBikeLanes = L.mapbox.featureLayer().addTo(map);

dcBikeLanes.loadURL('./DC_bikelanes.geojson')
    .on('ready', done);

mocoBikeWays.loadURL('./MontgomeryCountyBikeways.geojson')
    .on('ready', done);

fairfaxBikeLanes.loadURL('./FairfaxBicycleRoutes.geojson')
    .on('ready', done);

// styles and color paletter for map
var bikeLaneStyle = { color: 'green', weight: 2 };
var bufferStyle = { "fill": "#56B6DB",
                    "stroke": "#1A3742",
                    "stroke-width": 2
                };
// Each buffer feature object needs to have the properties set individually
function setProperties (buffer) {
    for (var i = 0; i < buffer.features.length; i++) {
        buffer.features[i].properties = bufferStyle;
    }
}

function done() {
    dcBikeLanes.setStyle(bikeLaneStyle);
    mocoBikeWays.setStyle(bikeLaneStyle);
    fairfaxBikeLanes.setStyle(bikeLaneStyle);

    function run() {
        var radius = parseInt(document.getElementById('radius').value);
        if (isNaN(radius)) radius = 500;

        var buffer = turf.buffer(dcBikeLanes.getGeoJSON(), radius / 5280, 'miles');
        setProperties(buffer);
        dcBufferLayer.setGeoJSON(buffer);

        var bufferMoco = turf.buffer(mocoBikeWays.getGeoJSON(), radius / 5280, 'miles');
        setProperties(bufferMoco);
        mocoBufferLayer.setGeoJSON(bufferMoco);

        var bufferFairfax = turf.buffer(fairfaxBikeLanes.getGeoJSON(), radius / 5280, 'miles');
        setProperties(bufferFairfax);
        fairfaxBufferLayer.setGeoJSON(bufferFairfax);


    }

    run();

    document.getElementById('radius').onchange = run;
}