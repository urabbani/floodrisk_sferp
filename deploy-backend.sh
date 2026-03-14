#!/bin/bash

# Flood Risk Impact Backend Deployment Script
# This script deploys the backend API to the production server

set -e

SERVER="umair@10.0.0.205"
SERVER_PATH="/mnt/d/Scenario_results/floodrisk_sferp/api"
PASSWORD=""  # Set your password or use sshpass

echo "🚀 Starting backend deployment..."

# Create api directory on server if it doesn't exist
echo "📁 Creating api directory on server..."
sshpass -p "$PASSWORD" ssh $SERVER "mkdir -p $SERVER_PATH"

# Upload API files
echo "📤 Uploading API files..."
sshpass -p "$PASSWORD" scp api/impact-summary.mjs $SERVER:$SERVER_PATH/
sshpass -p "$PASSWORD" scp api/package.json $SERVER:$SERVER_PATH/
sshpass -p "$PASSWORD" scp api/ecosystem.config.cjs $SERVER:$SERVER_PATH/
sshpass -p "$PASSWORD" scp api/floodrisk-impact-api.service $SERVER:$SERVER_PATH/

# Install dependencies on server
echo "📦 Installing dependencies on server..."
sshpass -p "$PASSWORD" ssh $SERVER "cd $SERVER_PATH && npm install --production"

# Setup systemd service
echo "🔧 Setting up systemd service..."
sshpass -p "$PASSWORD" ssh $SERVER "sudo cp $SERVER_PATH/floodrisk-impact-api.service /etc/systemd/system/"
sshpass -p "$PASSWORD" ssh $SERVER "sudo systemctl daemon-reload"
sshpass -p "$PASSWORD" ssh $SERVER "sudo systemctl enable floodrisk-impact-api"
sshpass -p "$PASSWORD" ssh $SERVER "sudo systemctl restart floodrisk-impact-api"

# Check service status
echo "✅ Checking service status..."
sshpass -p "$PASSWORD" ssh $SERVER "sudo systemctl status floodrisk-impact-api --no-pager"

echo "🎉 Backend deployment complete!"
echo "📡 API is running at: http://10.0.0.205:3001/api/impact-summary"
