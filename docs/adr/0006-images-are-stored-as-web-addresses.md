# Images are stored as web addresses, never as files

An image block holds only its `http`/`https` address and its description, never the picture. `data:` and other schemes are dropped.

## Consequences

If a site removes a picture, it is gone from the note too. Backups don't contain pictures. Opening a note loads its images from their sites, so those sites see the request. A pasted image with no web address (a screenshot, a file) is ignored.
