#!/bin/bash

# Archer's Edge Development Server Startup Script
# This script handles common issues when starting the dev server

echo "🚀 Starting Archer's Edge Development Server..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Kill any existing dev servers
echo "🔄 Checking for existing dev servers..."
if pgrep -f "npm run dev" > /dev/null; then
    echo "⚠️  Found existing dev servers, killing them..."
    pkill -f "npm run dev"
    sleep 2
fi

# Check if port 3000 is in use
echo "🔍 Checking port 3000..."
if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 is in use, killing processes..."
    lsof -ti :3000 | xargs kill -9
    sleep 2
fi

# Get network IP
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

echo "✅ Starting dev server with network access..."
echo "📱 You can access from your phone at: http://$IP:3000"
echo "💻 Local access at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the dev server
npm run dev -- --host 