import os
import argparse
from PIL import Image
import sys

def optimize_image(source_path, dest_path, max_size_kb=600):
    try:
        # Check if source exists
        if not os.path.exists(source_path):
            print(f"Error: Source file not found: {source_path}")
            sys.exit(1)

        # Open image
        img = Image.open(source_path)
        
        # Convert to RGB if necessary (e.g. from RGBA PNG)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        # Create destination directory if it doesn't exist
        dest_dir = os.path.dirname(dest_path)
        if dest_dir and not os.path.exists(dest_dir):
            os.makedirs(dest_dir)

        # Optimization loop
        quality = 95
        min_quality = 10
        step = 5
        
        while quality >= min_quality:
            img.save(dest_path, "JPEG", quality=quality)
            size = os.path.getsize(dest_path)
            size_kb = size / 1024.0
            
            print(f"Saved {os.path.basename(dest_path)} with quality {quality}, size: {size_kb:.2f}KB")
            
            if size_kb <= max_size_kb:
                print(f"Success! Final size: {size_kb:.2f}KB <= {max_size_kb}KB")
                return
            
            quality -= step

        print(f"Warning: Could not compress below {max_size_kb}KB even at quality {min_quality}. Final size: {os.path.getsize(dest_path)/1024:.2f}KB")

    except Exception as e:
        print(f"Error optimizing image: {e}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert and optimize image to JPG under a specific size.")
    parser.add_argument("source_path", help="Path to the source image")
    parser.add_argument("dest_path", help="Path to the destination image")
    parser.add_argument("--max_size", type=int, default=600, help="Maximum size in KB (default: 600)")

    args = parser.parse_args()
    optimize_image(args.source_path, args.dest_path, args.max_size)
