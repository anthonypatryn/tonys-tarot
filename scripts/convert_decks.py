# Convert downloaded deck scans (source_png/<Deck>-<id>.png) into public/decks/<key>/<canonical id>.webp
# and write src/decks.generated.json with each deck's aspect ratio.
# Canonical ids match the Beginners deck: T-00..T-21, C/P/S/W-0A..10, J1 (page), J2 (knight), QU, KI.
import sys, os, json, statistics
from PIL import Image, ImageDraw

SRC, PUB, OUT_JSON = sys.argv[1], sys.argv[2], sys.argv[3]
WIDTH = 640

DECKS = {
    'chromatika': 'Chro',
    'classic': 'Clas',
    'newvision': 'NewV',
    'viceversa': 'VicV',
    'thoth': 'Thot',
}

def canonical(deck, stem):
    """Map a source id (after 'Deck-') to a canonical id, or None to skip."""
    if deck == 'VicV':
        # Front sides only: CF-0A -> C-0A, TF-08 -> T-08
        if len(stem) > 2 and stem[1] == 'F':
            return stem[0] + stem[2:]
        return None
    if deck == 'Thot':
        suit, rank = stem.split('-')
        if suit == 'T':
            # Thoth numbers Adjustment (Justice) as VIII and Lust (Strength) as XI.
            return {'T-08': 'T-11', 'T-11': 'T-08'}.get(stem, stem)
        suit = {'D': 'P'}.get(suit, suit)  # Disks -> Pentacles
        rank = {'PS': 'J1', 'PN': 'J2', 'KN': 'KI'}.get(rank, rank)  # Princess, Prince, Knight
        return f'{suit}-{rank}'
    return stem

def make_back(path, w, h):
    """A plain symmetric back for decks without one (Viceversa)."""
    im = Image.new('RGB', (w, h), (22, 46, 58))
    d = ImageDraw.Draw(im)
    gold = (212, 175, 96)
    m = w // 16
    d.rectangle([m, m, w - m, h - m], outline=gold, width=max(2, w // 120))
    d.rectangle([m * 1.6, m * 1.6, w - m * 1.6, h - m * 1.6], outline=gold, width=1)
    step = w // 8
    for y in range(int(m * 2.4), int(h - m * 2.2), step):
        for x in range(int(m * 2.4), int(w - m * 2.2), step):
            r = step // 5
            d.polygon([(x, y - r), (x + r, y), (x, y + r), (x - r, y)], outline=gold)
    cx, cy, R = w // 2, h // 2, w // 5
    d.ellipse([cx - R, cy - R, cx + R, cy + R], fill=(22, 46, 58), outline=gold, width=3)
    d.ellipse([cx - R // 2, cy - R // 2, cx + R // 2, cy + R // 2], outline=gold, width=2)
    im.save(path, quality=85)

meta = {}
for key, deck in DECKS.items():
    out = os.path.join(PUB, key)
    os.makedirs(out, exist_ok=True)
    ratios, count = [], 0
    for f in sorted(os.listdir(SRC)):
        if not f.startswith(deck + '-') or not f.endswith('.png'):
            continue
        stem = f[len(deck) + 1:-4]
        if stem == 'X-BA':
            cid = 'back'
        elif stem.startswith('X-'):
            continue
        else:
            cid = canonical(deck, stem)
            if not cid:
                continue
        im = Image.open(os.path.join(SRC, f)).convert('RGB')
        if cid != 'back':
            ratios.append(im.height / im.width)
            count += 1
        im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
        im.save(os.path.join(out, cid + '.webp'), quality=80, method=6)
    ratio = statistics.median(ratios)
    if not os.path.exists(os.path.join(out, 'back.webp')):
        make_back(os.path.join(out, 'back.webp'), WIDTH, round(WIDTH * ratio))
    meta[key] = {'ratio': round(ratio, 4), 'cards': count}
    print(key, meta[key])

with open(OUT_JSON, 'w') as fh:
    json.dump(meta, fh, indent=1)
