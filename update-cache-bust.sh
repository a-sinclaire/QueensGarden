#!/bin/bash
# Update cache-busting value in index.html to current git commit hash
# Updates both script tags (?cb=) and link tags (?v=)
# Usage: ./update-cache-bust.sh

COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "dev")

# Update all ?cb= values in script tags
# Update all ?v= values in link tags (CSS files)
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s/?cb=[^\"']*/?cb=${COMMIT_HASH}/g" index.html
  sed -i '' "s/\\.css\\?v=[^\"']*/\\.css?v=${COMMIT_HASH}/g" index.html
else
  # Linux
  sed -i "s/?cb=[^\"']*/?cb=${COMMIT_HASH}/g" index.html
  sed -i "s/\\.css\\?v=[^\"']*/\\.css?v=${COMMIT_HASH}/g" index.html
fi

echo "Updated cache-busting to: ${COMMIT_HASH}"
echo "Run this script before committing to auto-update cache-busting values"

