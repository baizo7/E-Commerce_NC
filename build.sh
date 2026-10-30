#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "🎨 Collecting Django static files..."
python backend/manage.py collectstatic --noinput

echo "🔄 Running database migrations..."
python backend/manage.py migrate --noinput

echo "🌱 Ensuring database has baseline seed data..."
python backend/seed_data.py || true

echo "✅ Modern Shop backend build completed successfully!"
