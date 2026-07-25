#!/bin/bash
# Setup script — installs dev dependencies and configures pre-commit hooks
# Run once after cloning: bash scripts/setup.sh

set -e

echo "🔧 Installing dev dependencies..."
npm install -D \
  eslint \
  prettier \
  husky \
  lint-staged \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  eslint-plugin-react \
  eslint-plugin-react-hooks

echo "🪝 Setting up pre-commit hooks..."
npx husky init

echo "✅ Setup complete!"
echo ""
echo "Available commands:"
echo "  npm run lint          — Check for lint errors"
echo "  npm run lint:fix      — Auto-fix lint errors"
echo "  npm run format        — Format all files"
echo "  npm run format:check  — Check formatting without changing files"
echo ""
echo "Pre-commit hooks will run lint and format on staged files."
