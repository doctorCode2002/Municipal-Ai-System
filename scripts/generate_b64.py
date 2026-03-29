import base64
import os

assets_dir = r"frontend/src/assets"
output_file = r"frontend/src/features/landing/team_images.ts"

# Ensure the output directory exists
os.makedirs(os.path.dirname(output_file), exist_ok=True)

print(f"Opening images from {assets_dir}...")

images_to_load = ["bushra.jpg", "mohammed.jpg", "nadeen.jpg"]
loaded = 0

with open(output_file, "w", encoding="utf-8") as f:
    f.write("export const teamImages: Record<string, string> = {\n")
    for filename in images_to_load:
        name = filename.split(".")[0]
        path = os.path.join(assets_dir, filename)
        if os.path.exists(path):
            with open(path, "rb") as img:
                print(f"Processing {filename}...")
                b64 = base64.b64encode(img.read()).decode()
                f.write(f'  {name}: "data:image/jpeg;base64,{b64}",\n')
                loaded += 1
        else:
            print(f"File not found: {path}")
    f.write("};\n")

print(f"Successfully wrote {loaded} images to {output_file}")
