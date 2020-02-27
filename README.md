# AlongthePike fork of WABA Bike Infrastructure Map Project

## Development

This is a fork of the original WABA Bike Map project from DCFemTech where I am continuing to work on the infrastructure code which 
fetches, maps and filters the raw GIS files from each jurisdiction to produce consistent, more useful GeoJSON.

Once you've installed Node, to run this project:

1. Clone the repo locally: `git clone https://github.com/alongthepike/hackforgood-waba-map.git` or `git clone git@github.com:alongthepike/hackforgood-waba-map.git` depending on your git setup
2. Change into the directory: `cd hackforgood-waba-map`
3. Install dependencies: `npm install`
4. Fetch and process the jurisdictional GIS files: `npm run fetch`

### Data Sources

| Location | URL | Description |
|----------|-----|-------------|
| Montgomery County, MD | [Bikeways from dataMontgomery](https://data.montgomerycountymd.gov/Transportation/Bikeways/icc2-ppee) | Filtered by category = "Paved Off-Road Trail" or "Bike Lanes" or "Separated Bike Lanes" |
| Fairfax County, VA | [Bicycle routes from Fairfax GIS Data](http://data.fairfaxcountygis.opendata.arcgis.com/datasets/0dacd6f1e697469a81d6f7292a78d30e_16?geometry=-77.32%2C38.826%2C-77.24%2C38.846) and [County Trails from Fairfax GIS Data](http://data.fairfaxcountygis.opendata.arcgis.com/datasets/8a08319c7cb449b9a9329709f8dfdb30_3) and [Non-County Trails from Fairfax GIS Data](http://data.fairfaxcountygis.opendata.arcgis.com/datasets/ffa1a86b009c4528899c7e0ae50b5e5b_4) | Routes filtered by STATUS = 'Bike Lane', Trails filtered by SURFACE_MATERIAL = 'Asphalt' or SURFACE_MATERIAL = 'Concrete' |
| Arlington County, VA | [Bike routes from Arlington County GIS Data](https://gisdata-arlgis.opendata.arcgis.com/datasets/bike-route-lines) | Filtered by Route_Type = "Off Street Trail" or "Marked Route". |
| Alexandria City, VA | [Bike trails from Alexandria Open GIS Data Portal](http://data.alexgis.opendata.arcgis.com/datasets/685dfe61f1aa477f8cbd21dceb5ba9b5_0) | Filtered by (TRAILTYPE = "Off Street" or "On Street") and SHARROW = "No" |
| Prince George's County, MD | [Master Plan Trails from PG Planning Open Data Portal](http://gisdata.pgplanning.org/opendata/downloadzip.asp?FileName=/data/ShapeFile/Master_Plan_Trail_Ln.zip) | Filtered by FACILITY_S = "Existing" AND "FACILITY_T = "Bike Lane" OR "FACILITY_T" = "Hard Surface Trail" |
| Washington, DC | [Bicycle Lanes from opendata.dc.gov](http://opendata.dc.gov/datasets/294e062cdf2c48d5b9cbc374d9709bc0_2) and [Bike Trails from opendata.dc.gov](http://opendata.dc.gov/datasets/e8c2b7ef54fb43d9a2ed1b0b75d0a14d_4) | Filtered by FACILITY = "Existing Bike Lane" OR "Climbing Lane" OR "Contraflow Bike Lane" or "Cycle Track" |
