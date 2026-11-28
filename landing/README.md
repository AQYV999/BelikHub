# Landing page (BelikHub, Batang)

Static copy of the landing deployed at https://belikhubweb.vercel.app, kept here so it is not lost.
`index.html` is the landing, `board/` is the design board page, `assets/` and `images/` are its files.

The site on https://deploytovercel-nine.vercel.app is assembled from:

- `landing/*` at `/` (landing) and `/board`; run `scripts/assemble-nine.sh` to build the deploy folder
- `app/` at `/app` (web app: run `node scripts/sync-mobile-web.mjs` to rebuild it from `mobile/`)
- `vercel.json` rewrites, without the `functions` block (no `api/` on that project)
