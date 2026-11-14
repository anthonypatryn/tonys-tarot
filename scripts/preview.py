import sys
from PIL import Image
src, dst, w = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(src).convert("RGB")
im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
im.save(dst, quality=88)
