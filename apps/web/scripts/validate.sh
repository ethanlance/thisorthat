#!/bin/bash

# Comprehensive validation script
# This script runs all validation checks that should pass before committing

set -e  # Exit on any error

echo "🔍 Running comprehensive validation..."

# Change to the web app directory
cd "$(dirname "$0")/.."

echo "📦 Installing dependencies..."
npm ci

echo "🔧 Running ESLint..."
npm run lint

echo "💅 Running Prettier check..."
npm run format:check

echo "📝 Running TypeScript type check..."
npx tsc --noEmit

echo "🧪 Running tests..."
npm run test:run

echo "🏗️  Running build..."
npm run build

echo "✅ All validation checks passed!"
echo "🚀 Ready to commit!"
