# Saving a page: capture in the page, conversion in a new Draftab tab

The service worker injects the capture (`clip-page.js`, with Mozilla Readability, in its own bundle so the new tab doesn't load it) into the clicked tab and hands the HTML to a new Draftab tab through a temporary `clip:<uuid>` key. That tab does the conversion, because the service worker has no DOM. The HTML is parsed with `DOMParser` (an inert document: nothing runs or loads) and turned into blocks with the editor's schema, so only Draftab blocks survive.

## Consequences

Leftover `clip:` keys older than 10 minutes are deleted when the service worker starts and before each capture; they never go into backups. Readability is Apache 2.0 while the other shipped dependencies are MIT like the project; its license goes into `THIRD_PARTY_NOTICES.txt` in the package.
