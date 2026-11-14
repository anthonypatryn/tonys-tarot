# Convert source PNGs to web-sized WebP for the app.
import sys, os
from PIL import Image
src_dir, out_dir = sys.argv[1], sys.argv[2]
os.makedirs(out_dir, exist_ok=True)
for f in sorted(os.listdir(src_dir)):
    if not f.endswith(".png"): continue
    im = Image.open(os.path.join(src_dir, f)).convert("RGB")
    w = 800
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(os.path.join(out_dir, f.replace("T4Be-", "").replace(".png", ".webp")), quality=82, method=6)
print(len(os.listdir(out_dir)))
