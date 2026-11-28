#!/usr/bin/env bash
# Assemble the static site served at https://deploytovercel-nine.vercel.app into $1 (default: ./.nine-dist):
#   /      landing (landing/index.html + assets + images)
#   /board design board page
#   /app   web app (run `node scripts/sync-mobile-web.mjs` first so app/ is current)
# Then deploy with: cd <dir> && vercel link --project deploy_to_vercel && vercel deploy --prod
set -euo pipefail
OUT="${1:-.nine-dist}"
rm -rf "$OUT" && mkdir -p "$OUT"
cp -r landing/index.html landing/assets landing/images landing/board "$OUT"/
cp -r app "$OUT"/app
cp share.jpg "$OUT"/ 2>/dev/null || true
python3 - "$OUT" <<'PY'
import json, sys
v = json.load(open('vercel.json'))
v.pop('functions', None)
v.update(installCommand='echo skip', buildCommand='echo skip', framework=None, outputDirectory='.')
json.dump(v, open(sys.argv[1] + '/vercel.json', 'w'), indent=2)
PY
echo "assembled in $OUT"
