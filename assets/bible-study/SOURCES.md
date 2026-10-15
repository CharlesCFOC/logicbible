# Bible Study source data

- Place names, approximate coordinates and chapter references: [OpenBible.info Bible Geocoding](https://www.openbible.info/geo/), merged dataset, Creative Commons Attribution (CC BY). Multiple identifications and uncertain locations are possible. These pins are an aid to orientation, not evidence of an exact ancient site or event.
- Coastlines: [Natural Earth](https://www.naturalearthdata.com/), via world-atlas 2 land-110m, public domain. Modern coastlines, no historical national boundaries.
- Rebuild the locally shipped dataset with `node scripts/build-bible-study-geography.mjs`.
- Direct manuscript and primary-text links in `scripts/bible-study-tools.js` were checked on 2026-10-14. A catalogue link identifies a witness; it does not establish every historical claim on a generated card. Other publications remain explicitly labelled research leads.
