#!/bin/bash

# Deployment script for Maintenance Tracker
echo "🚀 Preparing Maintenance Tracker for deployment..."

# Check if required files exist
echo "📋 Checking deployment requirements..."

if [ ! -f "package.json" ]; then
  echo "❌ package.json not found"
  exit 1
fi

if [ ! -f "next.config.ts" ]; then
  echo "❌ next.config.ts not found"
  exit 1
fi

if [ ! -f ".env.local" ]; then
  echo "⚠️  .env.local not found - make sure to set environment variables in Vercel"
fi

echo "✅ Required files found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Type check
echo "🔍 Running type check..."
npm run typecheck

if [ $? -ne 0 ]; then
  echo "❌ Type check failed"
  exit 1
fi

echo "✅ Type check passed"

# Lint check
echo "🧹 Running linter..."
npm run lint

if [ $? -ne 0 ]; then
  echo "❌ Linting failed"
  exit 1
fi

echo "✅ Linting passed"

# Build check
echo "🔨 Testing build..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

echo "✅ Build successful"

# Clean up build files
echo "🧽 Cleaning up..."
rm -rf .next

echo "🎉 Pre-deployment checks complete!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Connect your repository to Vercel"
echo "3. Set environment variables in Vercel dashboard"
echo "4. Deploy!"
echo ""
echo "Environment variables needed:"
echo "- NEXT_PUBLIC_SUPABASE_URL"
echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "- SUPABASE_URL"
echo "- SUPABASE_CONNECTION_STRING"
echo "- NEXT_PUBLIC_DEMO_MODE (optional)"
echo "- NEXT_PUBLIC_DEMO_EMAIL (optional)"
echo "- NEXT_PUBLIC_DEMO_PASSWORD (optional)"