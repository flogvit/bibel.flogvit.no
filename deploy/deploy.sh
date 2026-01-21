#!/bin/bash
# Deploy script for bibel.flogvit.com

set -e  # Exit on error

SERVER="menneske"
REMOTE_PATH="/home/bibel/web"
APP_NAME="bibel"

echo "🔨 Building..."
npm run build

echo "📦 Syncing files to $SERVER..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.next/cache' \
    --exclude '.env.local' \
    ./ root@$SERVER:$REMOTE_PATH/

echo "🔧 Setting up on server..."
ssh root@$SERVER << 'ENDSSH'
    # Change ownership
    chown -R bibel:bibel /home/bibel/web

    # Install dependencies and restart PM2 as bibel user
    su - bibel -c '
        cd /home/bibel/web
        npm install --production

        # Restart or start PM2 process
        if pm2 describe bibel > /dev/null 2>&1; then
            pm2 restart bibel
        else
            pm2 start npm --name bibel -- start
            pm2 save
        fi
    '
ENDSSH

echo "✅ Deploy complete!"
echo "🌐 https://bibel.flogvit.com"
