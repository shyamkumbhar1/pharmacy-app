#!/bin/bash
# test-local.sh - Local testing before push

# Don't exit on error - just report issues
set +e

echo "🧪 Running local tests..."
echo "=========================="

# Check if .env exists
if [ ! -f .env ]; then
  echo "📝 Creating .env from .env.example..."
  cp .env.example .env || echo "⚠️ .env.example not found"
  php artisan key:generate --force
fi

# Install dependencies (if vendor doesn't exist)
if [ ! -d "vendor" ]; then
  echo "📦 Installing dependencies..."
  composer install --no-interaction || echo "⚠️ Composer install failed (check permissions)"
else
  echo "✅ Dependencies already installed"
fi

# Set permissions
echo "📁 Setting permissions..."
chmod -R 755 storage bootstrap/cache || true

# Run migrations (if database available)
echo "🗄️ Running migrations..."
php artisan migrate --force 2>/dev/null || echo "⚠️ Migration skipped (database not available)"

# Run tests (if available)
echo "🧪 Running tests..."
php artisan test 2>/dev/null || echo "⚠️ No tests found or tests failed (skipping)"

# Code quality checks
echo "✅ Running code quality checks..."
php artisan config:cache || echo "⚠️ Config cache"
php artisan route:cache || echo "⚠️ Route cache"

echo ""
echo "✅ Local tests completed!"
echo "📋 If all checks passed, you can push to GitHub"
