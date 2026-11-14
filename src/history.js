// Reading history, stored in this browser's localStorage.
const KEY = 'tarot-history-v1';

export function loadHistory() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}

function write(all) {
  try { localStorage.setItem(KEY, JSON.stringify(all.slice(0, 300))); } catch { /* storage full or blocked */ }
  return all;
}

// Insert or replace (by id), newest first.
export function upsertReading(reading) {
  const all = loadHistory();
  const i = all.findIndex(r => r.id === reading.id);
  // Keep the date of the first save, so editing the journal later doesn't move the reading to another day.
  if (i >= 0) all[i] = { ...reading, date: all[i].date || reading.date }; else all.unshift(reading);
  return write(all);
}

export function replaceHistory(all) {
  return write(all);
}

export function deleteReading(id) {
  return write(loadHistory().filter(r => r.id !== id));
}
