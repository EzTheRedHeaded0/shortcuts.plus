SHORTCUTS+ STATIC SITE

This archive is organized for a normal static deployment.

Upload the CONTENTS of this folder as the site root. The main page is:
  /index.html

Required runtime files at the same level as index.html:
  app.js
  styles.css
  shortcuts.json
  favicon.svg

Do not use the old top-level bootstrap index.html from the original archive.
Do not deploy the old src/worker.js unless you specifically want the Cloudflare Worker version.

IMPORTANT:
A File Garden URL that points to a ZIP is served as a ZIP file. A browser cannot treat that ZIP URL itself as index.html. To have an HTML URL, upload/deploy index.html (and its assets) as files rather than linking directly to the ZIP object.
