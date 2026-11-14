# Convert decks that come as folders of images (cut from printable PDFs, or image packs) into
# <out>/<key>/<canonical id>.webp + back.webp, and merge each deck's aspect ratio into a JSON file.
#   python scripts/convert_extra.py <key> <source dir> <out dir> <json file>
# Canonical ids match the Beginners deck: T-00..T-21, C/P/S/W-0A,02..10,J1 (page),J2 (knight),QU,KI.
import sys, os, json, re, statistics
from PIL import Image, ImageDraw

KEY, SRC, OUT, JSON_PATH = sys.argv[1:5]
WIDTH = 640
SUITS = ['W', 'C', 'S', 'P']
PIPS = ['0A'] + [f'{n:02d}' for n in range(2, 11)]
COURTS = ['J1', 'J2', 'QU', 'KI']
STANDARD = [f'T-{n:02d}' for n in range(22)] + [f'{s}-{r}' for s in SUITS for r in PIPS + COURTS]
# Grand Etteilla / Etteilla I trump number -> nearest traditional trump
ETTEILLA = {0: 0, 1: 4, 2: 19, 3: 18, 4: 17, 5: 21, 6: 2, 7: 6, 8: 3, 9: 11, 10: 14,
            11: 8, 12: 12, 13: 5, 14: 15, 15: 1, 16: 20, 17: 13, 18: 9, 19: 16, 20: 10, 21: 7}


def numbered(files):
    return sorted(f for f in files if re.match(r'^\d{3}\.png$', f))


def plan(key, files):
    """Return [(source file, canonical id)] and the back image file (or None)."""
    if key in ('deckaura', 'verdict'):
        # Printed in standard order: trumps 0-21, then Wands, Cups, Swords, Pentacles, each Ace..10, Page, Knight, Queen, King.
        return list(zip(numbered(files), STANDARD)), 'back.png'
    if key == 'courtgames':
        # Marseille order: trumps I-XXI (Justice VIII, Strength XI), the Fool last; suits King, Queen, Knight, Page, X..II, Ace.
        trumps = [f'T-{n:02d}' for n in [1, 2, 3, 4, 5, 6, 7, 11, 9, 10, 8] + list(range(12, 22)) + [0]]
        suits = [f'{s}-{r}' for s in SUITS for r in ['KI', 'QU', 'J2', 'J1'] + PIPS[::-1]]
        return list(zip(numbered(files), trumps + suits)), 'back.png'
    if key == 'etteilla1':
        pairs = []
        for f in files:
            m = re.match(r'^(\d+) ', f)
            if not m:
                continue
            n = int(m.group(1))
            if n <= 21:
                cid = f'T-{ETTEILLA[n]:02d}'
            elif n == 78:
                cid = 'T-00'
            else:
                k = n - 22
                s = SUITS[k // 14]
                cid = f'{s}-' + (['KI', 'QU', 'J2', 'J1'] + PIPS[::-1])[k % 14]
            pairs.append((f, cid))
        return pairs, None
    if key == 'silicondawn':
        majors = {'MA-0(0)-The-Fool': 0, 'MA-1-The-Magician': 1, 'MA-2-The-High-Priestess': 2, 'MA-3-The-Empress': 3,
                  'MA-4-The-Emperor': 4, 'MA-5-The-High-Priest': 5, 'MA-6-The-Lovers': 6, 'MA-7-The-Chariot': 7,
                  'MA-8-Fortitude': 8, 'MA-9-The-Hermit': 9, 'MA-10-Fortune': 10, 'MA-11-Justice': 11, 'MA-12-Traitor': 12,
                  'MA-13-Death': 13, 'MA-14-Temperance': 14, 'MA-15-The-Devil': 15, 'MA-16-The-Tower': 16, 'MA-17-Star': 17,
                  'MA-18-Moon': 18, 'MA-19-Sun': 19, 'MA-20-Judgement': 20, 'MA-21-Universe': 21}
        suit = {'wands': 'W', 'cups': 'C', 'swords': 'S', 'pent': 'P'}
        rank = {'ace': '0A', 'princess': 'J1', 'prince': 'J1', 'cavalier': 'J2', 'queen': 'QU', 'queen-2': 'QU', 'king': 'KI'}
        rank.update({str(n): f'{n:02d}' for n in range(2, 11)})
        pairs = []
        for f in files:
            stem = f[:-4]
            if stem in majors:
                pairs.append((f, f'T-{majors[stem]:02d}'))
                continue
            m = re.match(r'^(wands|cups|swords|pent)-(.+)$', stem)
            if m and m.group(2) in rank:
                pairs.append((f, f'{suit[m.group(1)]}-{rank[m.group(2)]}'))
        return pairs, 'card-back.jpg'
    raise SystemExit(f'unknown deck {key}')


def make_back(path, w, h):
    im = Image.new('RGB', (w, h), (44, 22, 18))
    d = ImageDraw.Draw(im)
    gold = (212, 175, 96)
    m = w // 16
    d.rectangle([m, m, w - m, h - m], outline=gold, width=max(2, w // 120))
    d.rectangle([m * 1.6, m * 1.6, w - m * 1.6, h - m * 1.6], outline=gold, width=1)
    cx, cy, R = w // 2, h // 2, w // 4
    for k in range(8):
        import math
        a = k * math.pi / 4
        d.line([cx, cy, cx + R * math.cos(a), cy + R * math.sin(a)], fill=gold, width=2)
    d.ellipse([cx - R, cy - R, cx + R, cy + R], outline=gold, width=3)
    d.ellipse([cx - R // 3, cy - R // 3, cx + R // 3, cy + R // 3], fill=(44, 22, 18), outline=gold, width=2)
    im.save(path, quality=85)


files = os.listdir(SRC)
pairs, back = plan(KEY, files)
ids = [c for _, c in pairs]
assert len(ids) == 78 and len(set(ids)) == 78, (len(ids), len(set(ids)), sorted(set(STANDARD) - set(ids)))
out = os.path.join(OUT, KEY)
os.makedirs(out, exist_ok=True)
ratios = []
for f, cid in pairs:
    im = Image.open(os.path.join(SRC, f)).convert('RGB')
    ratios.append(im.height / im.width)
    im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS).save(os.path.join(out, cid + '.webp'), quality=80, method=6)
ratio = statistics.median(ratios)
if back:
    im = Image.open(os.path.join(SRC, back)).convert('RGB')
    im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS).save(os.path.join(out, 'back.webp'), quality=80, method=6)
else:
    make_back(os.path.join(out, 'back.webp'), WIDTH, round(WIDTH * ratio))
meta = json.load(open(JSON_PATH)) if os.path.exists(JSON_PATH) else {}
meta[KEY] = {'ratio': round(ratio, 4), 'cards': 78}
json.dump(meta, open(JSON_PATH, 'w'), indent=1)
print(KEY, meta[KEY])
