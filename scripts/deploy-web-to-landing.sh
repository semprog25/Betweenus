#!/usr/bin/env bash
# Deploy Vite web build into betweenus_landing while preserving domain / deep-link files.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT"
LANDING="${LANDING_DIR:-/Users/sharanestone/Semprog/betweenus_landing}"

cd "$APP"
npm run build

# Preserve website ownership / association files
KEEP=(CNAME .nojekyll apple-app-site-association assetlinks.json robots.txt sitemap.xml .well-known)

tmpdir="$(mktemp -d)"
for f in "${KEEP[@]}"; do
  if [[ -e "$LANDING/$f" ]]; then
    cp -a "$LANDING/$f" "$tmpdir/"
  fi
done

# Clear landing HTML/JS artifacts but keep .git
find "$LANDING" -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +

cp -a "$APP/dist/." "$LANDING/"

for f in "${KEEP[@]}"; do
  if [[ -e "$tmpdir/$f" ]]; then
    rm -rf "$LANDING/$f"
    cp -a "$tmpdir/$f" "$LANDING/"
  fi
done

# SPA fallback for GitHub Pages
cp "$LANDING/index.html" "$LANDING/404.html"

rm -rf "$tmpdir"
echo "Deployed web build to $LANDING"
