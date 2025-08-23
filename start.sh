#!/bin/bash

# USPTO Crawler MCP - Quick Start Script
# Author: Yobie Benjamin
# Version: 0.2
# Date: July 28, 2025

echo "🚀 Starting USPTO Crawler MCP Server..."
echo "======================================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Check if frontend node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Check if Crawl4AI is installed
python3 -c "import crawl4ai" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "🐍 Installing Crawl4AI..."
    pip install crawl4ai
    playwright install chromium
fi

echo ""
echo "✅ All dependencies installed!"
echo ""
echo "Starting services..."
echo "-------------------"
echo "📡 Backend API: http://localhost:3001"
echo "🌐 Frontend UI: http://localhost:3000"
echo "🔌 MCP Server: Available via stdio"
echo ""

# Start the development server
npm run dev