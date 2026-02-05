#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Read version from manifest.json
VERSION=$(grep '"version"' "$PROJECT_ROOT/extension/manifest.json" | sed 's/.*"\([0-9.]*\)".*/\1/')
if [ -z "$VERSION" ]; then
  echo "Error: could not read version from manifest.json" >&2
  exit 1
fi

ZIP_NAME="simgrid-racestand-extension-v${VERSION}.zip"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Building ${ZIP_NAME} ..."

# Copy extension files, excluding dev artifacts
rsync -a \
  --exclude='test-*.js' \
  --exclude='.gitkeep' \
  "$PROJECT_ROOT/extension/" "$TMP_DIR/extension/"

# Create zip
cd "$TMP_DIR"
zip -r "$PROJECT_ROOT/$ZIP_NAME" extension/ -x '*.DS_Store'

echo ""
echo "Created $ZIP_NAME ($(du -h "$PROJECT_ROOT/$ZIP_NAME" | cut -f1 | xargs))"
