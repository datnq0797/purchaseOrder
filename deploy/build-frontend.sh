#!/usr/bin/env bash
# Build the React SPA and drop it into backend/public/ so Laravel serves it.
# Run this locally before every `git push` that changes the frontend.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> building frontend"
( cd frontend && npm ci && npm run build )

echo "==> syncing into backend/public/"
rm -rf backend/public/assets
cp -r frontend/dist/. backend/public/

echo "==> done. Review 'git status' then commit backend/public/ + push."
