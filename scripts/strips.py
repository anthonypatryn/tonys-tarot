# Build "text strip" sheets: for each card, top 30% (upright text) and bottom 32% rotated 180 (reversed text).
import sys, os
from PIL import Image, ImageDraw
src_dir, out_dir = sys.argv[1], sys.argv[2]
stems = sys.argv[3:]
os.makedirs(out_dir, exist_ok=True)
W = 900
for i in range(0, len(stems), 3):
    group = stems[i:i+3]
    parts = []
    for s in group:
        im = Image.open(os.path.join(src_dir, s + ".png")).convert("RGB")
        im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)
        h = im.height
        top = im.crop((0, 0, W, int(h * .30)))
        bot = im.crop((0, int(h * .68), W, h)).rotate(180)
        label = Image.new("RGB", (W, 40), "white")
        ImageDraw.Draw(label).text((10, 10), f"{s}   [top=UPRIGHT text, then REVERSED text below]", fill="black")
        parts += [label, top, Image.new("RGB", (W, 8), "red"), bot, Image.new("RGB", (W, 20), "black")]
    sheet = Image.new("RGB", (W, sum(p.height for p in parts)), "black")
    y = 0
    for p in parts:
        sheet.paste(p, (0, y)); y += p.height
    sheet.save(os.path.join(out_dir, f"sheet_{group[0]}.jpg"), quality=85)
print("ok")
