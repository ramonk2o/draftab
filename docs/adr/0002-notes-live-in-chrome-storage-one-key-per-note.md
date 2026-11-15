# Notes live in `chrome.storage.local`, one key per note

Notes and settings are kept in `chrome.storage.local` with `unlimitedStorage`, under one key per note (`note:<id>`), always through `src/storage.ts`. That avoids localStorage's ~5 MB limit, survives clearing cookies, can be reached from the service worker, and means each keystroke rewrites one note instead of all of them.

## Consequences

Search runs in memory over every note, which is fine for a few hundred notes. Open tabs update their list with only the note that changed (last write wins).
