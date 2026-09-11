# OceanWatch AI — DATA SPECIFICATION

## 1. DATA SOURCES

Sentinel-1:
- primary SAR oil-detection input
- free/public source path for prototype

Sentinel-2:
- optical verification only when appropriate

Zenodo Sentinel-1 SAR Oil Spill Dataset:
- oil model training labels/data

xView3:
- ship detection training data

ERA5:
- wind gate + drift forcing
- use locally cached files during inference

CMEMS/HYCOM:
- ocean current forcing
- use locally cached files during inference

MarineCadastre:
- documented demo AIS source

Natural Earth:
- coastline/land masking

GEBCO:
- bathymetry reference where needed

## 2. DEMO VS PRODUCTION

DEMO:
- Gulf of Mexico
- MarineCadastre AIS
- public training datasets
- locally cached environmental forcing

PRODUCTION CONCEPT:
- Indian AIS / NAIS / ICG / approved commercial provider adapters
- Indian operating region
- approved government infrastructure and credentials

Never present demo MarineCadastre data as Indian government AIS.

## 3. FILE LAYOUT

data/
  raw/
  processed/
  cached/
  demo/
  manifests/

Do not commit huge datasets to git.
Use manifests/README files to identify external datasets.

## 4. REQUIRED METADATA

For each dataset record:
- source
- version/date
- region
- timestamp range
- checksum where possible
- license/usage note
- local path
- ingestion status

## 5. MISSING DATA BEHAVIOR

Missing:
- wind -> block wind-gated inference
- currents -> block drift or mark incomplete
- AIS -> mark attribution incomplete
- Sentinel scene -> no inference
- trained checkpoint -> training required before production inference

Never silently synthesize environmental or vessel data.

## 6. CACHE POLICY

Environmental data should be pre-cached for the target demo region/date windows.
Inference reads local cache.

Add a separate data sync job for refreshing cache.
Do not make the main inference job depend on a live external API unless explicitly enabled.
