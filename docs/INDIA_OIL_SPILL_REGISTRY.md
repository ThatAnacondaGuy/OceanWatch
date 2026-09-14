# Indian Marine Oil-Spill Historical Incident Registry - Data Dictionary

This document defines the schema for the canonical historical incident registry stored in `data/reference/india_oil_spill_registry.json`.

## Core Identity
*   **`incident_id`**: (String) Unique identifier for the incident (e.g., `IND-OS-2017-001`).
*   **`incident_name`**: (String) Commonly accepted name of the incident (e.g., `Ennore Oil Spill 2017`).
*   **`incident_date`**: (String) ISO-8601 primary date of the incident (YYYY-MM-DD).
*   **`incident_start_date`**: (String) Date the spill began.
*   **`incident_end_date`**: (String) Date the leak/spill was contained, if known.
*   **`year`**: (Integer) Year of the incident.
*   **`status`**: (String) Current status of the incident (e.g., `Historical`, `Active`).

## Geography & Location
*   **`latitude`**: (Float/Null) Latitude in decimal degrees.
*   **`longitude`**: (Float/Null) Longitude in decimal degrees.
*   **`location_description`**: (String) Text description of the location.
*   **`state`**: (String) Affected Indian state (e.g., `Tamil Nadu`, `Maharashtra`).
*   **`coastal_region`**: (String) Broader coastal region (e.g., `Coromandel Coast`, `Konkan Coast`).
*   **`district`**: (String/Null) Specific district.
*   **`port`**: (String/Null) Nearest major port if applicable.
*   **`offshore_area`**: (String/Null) Relevant offshore block or maritime zone.

## Causality & Source
*   **`incident_type`**: (String) Type of incident (e.g., `Vessel Collision`, `Pipeline Leak`, `Vessel Sinking`, `Platform Blowout`).
*   **`cause`**: (String) Root cause (e.g., `Human Error`, `Structural Failure`, `Extreme Weather`).
*   **`vessel_name`**: (String/Null) Primary vessel involved. If multiple, separate with commas or list the source vessel.
*   **`imo`**: (String/Null) IMO number(s) of the vessel(s).
*   **`mmsi`**: (String/Null) MMSI number(s) of the vessel(s).
*   **`vessel_type`**: (String/Null) Type of vessel (e.g., `Oil Tanker`, `Cargo Ship`).
*   **`operator`**: (String/Null) Company or entity operating the source.

## Spillage & Pollutant
*   **`pollutant_type`**: (String) Type of oil (e.g., `Heavy Fuel Oil / Bunker`, `Crude Oil`, `Diesel`).
*   **`quantity_spilled`**: (Float/Null) Numerical amount spilled.
*   **`quantity_units`**: (String) Units for quantity (e.g., `tonnes`, `kilolitres`).
*   **`quantity_confidence`**: (String) e.g., `Exact`, `Estimated`, `Disputed`.

## Impact & Cleanup
*   **`affected_area`**: (String/Null) Description of the spatial footprint of the spill.
*   **`shoreline_affected`**: (String/Null) Length or description of oiled shoreline.
*   **`environmental_impact`**: (String/Null) Documented ecological damage (e.g., mangroves, turtles).
*   **`fisheries_impact`**: (String/Null) Documented socio-economic impact on fisheries.
*   **`economic_impact`**: (String/Null) Fines or economic losses.
*   **`response_action`**: (String/Null) Agencies involved in cleanup (e.g., `Indian Coast Guard`).
*   **`cleanup_status`**: (String) e.g., `Completed`, `Ongoing`.
*   **`cleanup_date`**: (String/Null) Date cleanup operations officially ended.

## Provenance & Evidence
*   **`historical_evidence_level`**: (String) Confidence rating:
    *   `CONFIRMED_OFFICIAL`: Documented by Indian Gov/Coast Guard/Tribunals.
    *   `SUPPORTED_BY_MULTIPLE_SOURCES`: Widespread reputable corroboration.
    *   `SECONDARY_DOCUMENTED`: Relies on news/third-party databases.
    *   `PARTIALLY_DOCUMENTED`: Incomplete or conflicting evidence.
*   **`data_confidence`**: (String) e.g., `High`, `Medium`, `Low`.
*   **`satellite_available`**: (Boolean) Indicates if historical satellite imagery is known to exist.
*   **`ais_available`**: (Boolean) Indicates if historical AIS tracks are known to exist.
*   **`oosa_available`**: (Boolean) Indicates if INCOIS OOSA analysis was run.
*   **`source_urls`**: (List of Strings) Primary links supporting the data.
*   **`primary_source`**: (String) Name of the primary authoritative source.
*   **`provenance_status`**: (String) Tracks if the incident is real historical data or synthetic. Must be `REAL_HISTORICAL` for this registry.
*   **`notes`**: (String) Important caveats, especially separating real historical facts from any synthetic platform demonstrations.
