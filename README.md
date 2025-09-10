SPEDhelper — Weekly Plans
=========================

Live site: https://tkerns226.github.io/SPEDhelper/

A simple dashboard to view teacher weekly slide decks by cohort and subject. The front page is a table (rows: 7A/7B/7C/Other; columns: Math, Science, STEM, ELA, SS, Humanities) with a right‑side preview panel that opens slide decks inline.

Repo Layout
----------
- `index.html` — front page (table + viewer, inline JSON fallback)
- `assets/styles.css` — theme, layout, and table/viewer styles
- `assets/app.js` — renders table from JSON, handles viewer, local edits
- `assets/decks.json` — source of truth for cohorts/subjects/links
- `assets/favicon.svg` — site icon
- `scripts/start_server.ps1` — quick local static server (Windows/PowerShell)
- `.github/workflows/pages.yml` — deploys to GitHub Pages on push to `main`
- `.nojekyll` — disables Jekyll for static assets

Editing Links
-------------
Preferred: edit `assets/decks.json` and push to `main`.

Each cell can be:
- `null` — shows a placeholder `-`
- A teacher name: `{ "name": "Beck" }` — shows the name only
- A linked plan: `{ "name": "Kerns", "url": "https://..." }` — shows name as a link

Example snippet:

```
"7C": {
  "ELA": { "name": "Ekert", "url": "https://docs.google.com/presentation/.../edit" },
  "SS":  { "name": "Kerns", "url": "https://docs.google.com/presentation/..." }
}
```

Tip: The app converts Google Slides edit/view URLs to the proper `/embed` URL for the inline preview.

Quick edits in the browser
--------------------------
- Open the site and click “Add link” under a cell to attach a URL.
- Click “Export JSON” to copy the merged JSON, then replace `assets/decks.json` in the repo and push to `main`.

Local Preview (optional)
------------------------
Windows PowerShell:

```
scripts/start_server.ps1 -Port 5500
```

Then open http://127.0.0.1:5500

Deployment
----------
This repo deploys via GitHub Pages using Actions.
- Any push to `main` triggers the workflow and publishes to: https://tkerns226.github.io/SPEDhelper/
- You can check progress under the “Actions” tab.
- If the Pages site isn’t enabled yet, verify under Settings → Pages → Build and deployment → Source: “GitHub Actions”.

Notes
-----
- Some external sites disallow embedding in iframes; in that case use the “Open in new tab” link above the viewer.
- The inline JSON template in `index.html` provides a fallback for `file://` viewing.
