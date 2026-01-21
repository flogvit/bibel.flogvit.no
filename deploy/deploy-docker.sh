#!/bin/bash
# Deploy script for bibel.flogvit.com using Docker
# Builds locally and transfers image to server

set -e

SERVER="menneske"
REMOTE_PATH="/home/bibel/web"
IMAGE_NAME="bibel-flogvit"
IMAGE_FILE="/tmp/bibel-flogvit.tar"

echo "🔨 Building Docker image locally..."
docker build -t $IMAGE_NAME .

echo "💾 Saving image to file..."
docker save $IMAGE_NAME > $IMAGE_FILE

echo "📦 Transferring image to server (~200MB)..."
scp $IMAGE_FILE root@$SERVER:/tmp/

echo "📂 Syncing data folder..."
rsync -avz data/ root@$SERVER:$REMOTE_PATH/data/

echo "🐳 Loading and starting container on server..."
ssh root@$SERVER << 'ENDSSH'
    # Load the image
    docker load < /tmp/bibel-flogvit.tar
    rm /tmp/bibel-flogvit.tar

    # Stop existing container if running
    docker stop bibel 2>/dev/null || true
    docker rm bibel 2>/dev/null || true

    # Ensure data directory exists and has correct ownership
    mkdir -p /home/bibel/web/data
    chown -R bibel:bibel /home/bibel/web/data

    # Run container
    docker run -d \
        --name bibel \
        --restart unless-stopped \
        -p 3018:3018 \
        -v /home/bibel/web/data:/app/data:ro \
        bibel-flogvit

    echo "Container started!"
    docker ps | grep bibel
ENDSSH

# Cleanup local temp file
rm -f $IMAGE_FILE

echo "✅ Deploy complete!"
echo "🌐 https://bibel.flogvit.com"
