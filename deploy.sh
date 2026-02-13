#!/bin/bash

# Atlas Dashboard Deployment Script
# This script deploys the dashboard to the Atlas server

set -e

ATLAS_HOST="100.104.196.38"
ATLAS_USER="soadmin"
DEPLOY_PATH="/opt/dashboard"

echo "🚀 Starting Dashboard Deployment to Atlas Server..."

# 1. Check if we can reach the server
echo "📡 Checking connection to Atlas server..."
if ! ping -c 1 $ATLAS_HOST &gt; /dev/null; then
    echo "❌ Cannot reach Atlas server at $ATLAS_HOST"
    exit 1
fi
echo "✅ Atlas server is reachable"

# 2. SSH and deploy
echo "📦 Deploying to $ATLAS_HOST..."
ssh $ATLAS_USER@$ATLAS_HOST << 'EOF'
    set -e
    
    # Navigate to deploy path, create if doesn't exist
    mkdir -p /opt/dashboard
    cd /opt/dashboard
    
    # If this is the first deployment, clone the repo
    if [ ! -d .git ]; then
        echo "🔄 Cloning repository..."
        git clone https://github.com/mblanke/Dashboard.git .
    else
        echo "🔄 Updating repository..."
        git pull origin main
    fi
    
    # Build and start
    echo "🔨 Building Docker image..."
    docker-compose build --no-cache
    
    echo "🚀 Starting container..."
    docker-compose up -d
    
    # Wait for service to be ready
    echo "⏳ Waiting for service to start..."
    sleep 5
    
    # Check if service is running
    if docker-compose ps | grep -q "Up"; then
        echo "✅ Dashboard is running!"
        echo "📊 Access at: http://100.104.196.38:3001"
    else
        echo "❌ Failed to start dashboard"
        docker-compose logs dashboard
        exit 1
    fi
EOF

echo ""
echo "✅ Deployment Complete!"
echo "📊 Dashboard URL: http://100.104.196.38:3001"
echo ""
echo "📋 Next steps:"
echo "   1. Access the dashboard at http://100.104.196.38:3001"
echo "   2. Verify all widgets are loading correctly"
echo "   3. Check logs with: ssh $ATLAS_USER@$ATLAS_HOST 'docker-compose -C /opt/dashboard logs -f'"
