# Interface texts come from our own dictionary, not `chrome.i18n`

The interface language is a user setting (Automatic, English or Português), and `chrome.i18n` only follows Chrome's own language, so the texts come from `src/i18n.ts`. The store listing and the extension description still use `_locales`.

## Consequences

The language is copied to the page's `localStorage` so the texts are right from the first paint. If `chrome.storage` holds a different value (for example after a backup import), the tab reloads once.
