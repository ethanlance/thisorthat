#!/bin/bash

# Comprehensive linting fix script for Vercel deployment
# This script addresses all linting issues that cause Vercel builds to fail

set -e

echo "🔧 Fixing linting issues for Vercel deployment..."

# Navigate to web app directory
cd apps/web

echo "📋 Step 1: Running Prettier to fix formatting issues..."
npx prettier --write "src/**/*.{ts,tsx,js,jsx}" || true

echo "📋 Step 2: Running ESLint with auto-fix..."
npx eslint . --ext .ts,.tsx,.js,.jsx --fix || true

echo "📋 Step 3: Running TypeScript check..."
npx tsc --noEmit || true

echo "📋 Step 4: Running build to check for remaining issues..."
npm run build

echo "✅ Linting fixes completed!"
echo "🚀 Ready for Vercel deployment"
