import os
import subprocess

def download_and_extract(tiny_file, dest_dir):
    with open(tiny_file, 'r') as f:
        lines = [line.strip() for line in f.readlines() if line.strip()]
        
    os.makedirs(dest_dir, exist_ok=True)
    
    current_url = None
    for line in lines:
        if line.startswith("http"):
            current_url = line
        elif line.startswith("checksum"):
            if current_url:
                # determine split and filename
                split = "train" if "/train/" in current_url else "validation"
                filename = current_url.split("?")[0].split("/")[-1]
                split_dir = os.path.join(dest_dir, split)
                os.makedirs(split_dir, exist_ok=True)
                
                filepath = os.path.join(split_dir, filename)
                if not os.path.exists(filepath):
                    print(f"Downloading {filename}...")
                    subprocess.run(["curl", "-s", "-o", filepath, current_url])
                
                print(f"Extracting {filename}...")
                subprocess.run(["tar", "-xzf", filepath, "-C", split_dir])
                
if __name__ == "__main__":
    download_and_extract("data/raw/xview3/tiny.txt", "data/raw/xview3/tiny")
