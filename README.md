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
- `source_png/` holds the original full-resolution scans (1500×2624).
- `src/meanings.json` has the upright and reversed meanings, transcribed from the text printed on each card.
- `src/spreads.js` has the 8 sample spreads from the instruction cards (layout, positions, suggested questions).
- `src/App.jsx` runs the table: shuffle, draw, and flip. `src/components/` holds the guide panel, large-print reader, browse, history, and guide views.
- Reading history is saved in your browser's localStorage.
