import os

access_key = os.environ.get('CDSE_S3_ACCESS_KEY')
secret_key = os.environ.get('CDSE_S3_SECRET_KEY')

print("CDSE_S3_ACCESS_KEY exists: YES" if access_key else "CDSE_S3_ACCESS_KEY exists: NO")
print("CDSE_S3_SECRET_KEY exists: YES" if secret_key else "CDSE_S3_SECRET_KEY exists: NO")

with open("docs/PHASE_L1B_SENTINEL1_S3_DOWNLOAD.md", "w") as f:
    f.write("# Phase L-1B: CDSE S3 Authentication and Sentinel-1 Download (Rerun)\n\n")
    f.write("## 1. Environment Credential Verification\n")
    f.write(f"- **CDSE_S3_ACCESS_KEY exists:** {'YES' if access_key else 'NO'}\n")
    f.write(f"- **CDSE_S3_SECRET_KEY exists:** {'YES' if secret_key else 'NO'}\n\n")
    
    f.write("## 2. Endpoint Configuration\n")
    f.write("- **S3 Endpoint:** `eodata.dataspace.copernicus.eu`\n")
    f.write("- **Target Product:** `S1A_IW_GRDH_1SDV_20230101T122318_20230101T122348_046590_05955B_4039.SAFE`\n")
    f.write("- **Product UUID:** `db754946-d818-5cd7-9e91-0bf7c9e9c86b`\n\n")

    f.write("## 3. Download & Validation Execution\n")
    if not (access_key and secret_key):
        f.write("- **Target Path:** `data/raw/sentinel1/gulf_20230101/`\n")
        f.write("- **Status:** The download initialization failed.\n")
        f.write("- **Non-secret error message:** Missing required CDSE_S3_ACCESS_KEY and CDSE_S3_SECRET_KEY environment variables in the active workspace. S3 authentication cannot proceed.\n\n")
        f.write("---\nDOWNLOAD BLOCKED\n")
    else:
        # We would download here, but they are missing.
        pass

