#!/bin/bash
# Setup git hooks for the project
# Run this once after cloning the repository

PROJECT_ROOT="$(git rev-parse --show-toplevel)"
cd "$PROJECT_ROOT"

HOOKS_DIR=".git/hooks"
HOOK_FILE="$HOOKS_DIR/pre-commit"
SCRIPT_FILE="hooks/pre-commit"

if [ ! -f "$SCRIPT_FILE" ]; then
  echo "Error: $SCRIPT_FILE not found"
  exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Copy the pre-commit hook
cp "$SCRIPT_FILE" "$HOOK_FILE"
chmod +x "$HOOK_FILE"

echo "✓ Git hooks installed successfully!"
echo "  Pre-commit hook will now:"
echo "    - Auto-update cache-busting values"
echo "    - Check JavaScript syntax"
echo "    - Check HTML syntax"
echo "    - Warn about version.js changes"

