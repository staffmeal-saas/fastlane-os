#!/bin/bash
set -e

echo "🚀 Starting Nhost services (Postgres, Hasura, Auth, Storage)..."

# Copy init scripts to temp dir for Docker bind mount
mkdir -p /tmp/fastlane-initdb
cp initdb.d/*.sql /tmp/fastlane-initdb/

# Create email templates dir
mkdir -p /tmp/fastlane-nhost/emails

docker compose up -d

echo "⏳ Waiting for Hasura GraphQL Engine to be ready..."
until curl -s http://localhost:8080/healthz >/dev/null; do
  printf "."
  sleep 2
done
echo "✅ Hasura is ready!"

echo "📥 Importing Database Schema (handled automatically by initdb.d on first run)"

ADMIN_SECRET=$(grep GRAPHQL_ADMIN_SECRET .env | cut -d= -f2)

echo "🔐 Applying Hasura Metadata (Relationships & Permissions)..."
METADATA=$(cat hasura_metadata.json)
curl -s -X POST http://localhost:8080/v1/metadata \
  -H "X-Hasura-Admin-Secret: $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"replace_metadata\", \"args\":$METADATA}" > /dev/null

echo "✅ Hasura Metadata applied successfully!"

echo "📦 Installing Frontend Dependencies..."
cd frontend && npm install

echo "🎉 Setup complete! To start the frontend server:"
echo "cd frontend && npm run dev"
