# Tony's Tarot

A simple tarot reader, built from the *Tarot Cards for Beginners* (Rockridge Press) deck using card scans from steve-p.org.

## Run it

```bash
npm install
npm run dev
```

Then open the URL it prints (http://localhost:5173 by default).

## What's where

- `public/cards/` holds web-sized card images: `T-00`–`T-21` (Major Arcana), `C/P/S/W-0A..KI` (suits), `X-BA` (card back), `X-T01..T28` (instruction cards).
- `public/decks/<deck>/` holds the alternate deck art (Llewellyn Classic, New Vision, Chromatika, Viceversa, Thoth), renamed to the same card ids. `scripts/convert_decks.py` builds these from the scans and maps Thoth's names and numbering (Disks → Pentacles, Princess/Prince/Knight → Page/Knight/King, Adjustment VIII ↔ Justice, Lust XI ↔ Strength).
- `source_png/` (not in git) holds the original full-resolution scans.
- `src/meanings.json` has the upright and reversed meanings, transcribed from the text printed on each card.
- `src/spreads.js` has the 8 sample spreads from the instruction cards (layout, positions, suggested questions).
- `src/App.jsx` runs the table: shuffle, draw, and flip. `src/components/` holds the guide panel, large-print reader, browse, history, and guide views.
- Reading history is saved in your browser's localStorage.

## Credits

- Card scans: [steve-p.org/cards](https://steve-p.org/cards/). Decks © their publishers (Rockridge Press, Llewellyn, Lo Scarabeo, U.S. Games / AGM-Urania).
- Card meanings: transcribed from the *Tarot Cards for Beginners* cards and used for every deck.
- Fonts from the FontSpace "For Tarot Cards" collection: [Grim Reaper](https://www.fontspace.com/grim-reaper-font-f80002) (freeware, non-commercial) and [Romantique Initials](https://www.fontspace.com/romantique-initials-font-f1711) (public domain).
