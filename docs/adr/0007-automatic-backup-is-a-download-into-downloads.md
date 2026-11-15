# Automatic backup is a download into `Downloads/draftab-backups/`

The service worker runs the backup with `chrome.alarms` and `chrome.downloads`, so it works with no tab open and needs no server or account. The file is generated as a `data:` URL, because the service worker has no `URL.createObjectURL`. It saves without asking, and only if something changed since the last backup.

## Consequences

If Chrome's "Ask where to save each file" option is on, each automatic backup opens the save dialog (documented in the README). Each backup also briefly shows Chrome's download icon.
