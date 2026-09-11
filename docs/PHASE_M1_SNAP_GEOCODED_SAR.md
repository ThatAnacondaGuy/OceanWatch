# Phase M-1: Proper Sentinel-1 Geocoding and Radiometric Validation

This document tracks the execution of the official Sentinel-1 Range-Doppler Terrain Correction pipeline for the acquired GRD product.

## 1. SNAP Dependency Verification
To operationally geocode a wide-swath Sentinel-1 GRD product, the European Space Agency's SNAP (Sentinel Application Platform) Sentinel-1 Toolbox is required. The system was scanned for the Graph Processing Tool (`gpt`) and standard SNAP application directories.

- **Status:** **SNAP_NOT_INSTALLED**
- **Details:** The SNAP `gpt` executable is missing from `/Applications`, `/opt`, `/usr/local`, and the active environment PATH.

## 2. Installation Requirements
To proceed with Phase M-1, the official ESA SNAP distribution must be installed on the host machine.
- **Download Link:** [ESA SNAP Download Page](https://step.esa.int/main/download/snap-download/)
- **Required Component:** Sentinel-1 Toolbox (or the "All Toolboxes" package).
- **Target OS:** macOS (Apple Silicon / Intel as appropriate).
- **CLI Requirement:** Ensure that the SNAP `bin/` directory containing `gpt` is added to the system `PATH` or symlinked to `/usr/local/bin/gpt` (avoiding conflict with the macOS GUID partition tool at `/usr/sbin/gpt`).

## 3. Operational Halt
In strict compliance with the deployment instructions, the fallback Python linear affine approximation has NOT been re-executed. No synthetic data, image-pixel coordinate substitutions, or U-Net inferences have been performed.

---

RADAR PROCESSING STATUS: BLOCKED
