#!/bin/bash
set -e

echo "Pulling latest code..."
cd /opt/convol
git fetch origin
git reset --hard origin/main

echo "Rebuilding Docker image..."
cd /opt/docker
docker compose build --no-cache convol
docker compose up -d convol

echo "Done! ConVol deployed."
