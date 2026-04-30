#!/usr/bin/env bash

set -euo pipefail

APP_DIR="/var/www/ireland-bus-tracking"
TMP_CLONE_DIR="$APP_DIR/tmp"
REPO_URL="https://github.com/marcosAlvarezCalabria/Bus-Tracker-v3-"

echo "Preparing application directory at $APP_DIR"
mkdir -p "$APP_DIR"

if [ -d "$TMP_CLONE_DIR" ]; then
  echo "Removing previous temporary clone directory at $TMP_CLONE_DIR"
  rm -rf "$TMP_CLONE_DIR"
fi

echo "Cloning repository into temporary directory"
git clone "$REPO_URL" "$TMP_CLONE_DIR"

cat <<'INFO'
IMPORTANT: This repository must end up directly in /var/www/ireland-bus-tracking.
If cloning leaves files inside a nested folder, flatten the clone with:

git clone https://github.com/marcosAlvarezCalabria/Bus-Tracker-v3- /var/www/ireland-bus-tracking/tmp
mv /var/www/ireland-bus-tracking/tmp/* /var/www/ireland-bus-tracking/
mv /var/www/ireland-bus-tracking/tmp/.* /var/www/ireland-bus-tracking/ 2>/dev/null
rmdir /var/www/ireland-bus-tracking/tmp
INFO

echo "Flattening cloned repository into $APP_DIR"
shopt -s dotglob nullglob

for entry in "$TMP_CLONE_DIR"/*; do
  name="$(basename "$entry")"

  if [ "$name" = "." ] || [ "$name" = ".." ] || [ "$name" = ".git" ]; then
    continue
  fi

  mv "$entry" "$APP_DIR/"
done

mv "$TMP_CLONE_DIR/.git" "$APP_DIR/.git"
rmdir "$TMP_CLONE_DIR"

echo "Repository contents are now in $APP_DIR"
