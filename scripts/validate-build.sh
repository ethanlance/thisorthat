#!/bin/bash

# Build validation script for Vercel deployment
# This script simulates the Vercel build environment

set -e

echo "🔍 Validating build for Vercel deployment..."

# Check Node.js version
echo "📋 Checking Node.js version..."
node --version
npm --version

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run linting
echo "🔍 Running linting..."
npm run lint

# Run type checking
echo "🔍 Running type checking..."
npx tsc --noEmit

# Run build
echo "🏗️ Running build..."
NODE_ENV=production npm run build

echo "✅ Build validation completed successfully!"
echo "🚀 Ready for Vercel deployment"
