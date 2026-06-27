#!/bin/sh
set -e
echo "Running DB migrations..."
npx tsx lib/db/migrate.ts
echo "Starting server..."
exec node server.js
