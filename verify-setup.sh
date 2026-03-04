#!/bin/bash

# AskMyNotes - Quick Start Script
# This script helps verify your setup

echo "🚀 AskMyNotes - Quick Verification"
echo "=================================="
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "  Node version: $NODE_VERSION"
else
    echo "  ❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check npm
echo "✓ Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "  npm version: $NPM_VERSION"
else
    echo "  ❌ npm not found"
    exit 1
fi

# Check PostgreSQL
echo "✓ Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    PG_VERSION=$(psql --version)
    echo "  $PG_VERSION"
else
    echo "  ⚠️  PostgreSQL not found (required for backend)"
fi

# Check if node_modules exist
echo ""
echo "✓ Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "  Frontend dependencies: ✅ Installed"
else
    echo "  Frontend dependencies: ❌ Not installed"
    echo "  Run: npm install"
fi

if [ -d "backend/node_modules" ]; then
    echo "  Backend dependencies: ✅ Installed"
else
    echo "  Backend dependencies: ❌ Not installed"
    echo "  Run: cd backend && npm install"
fi

# Check .env files
echo ""
echo "✓ Checking configuration..."
if [ -f ".env.local" ]; then
    echo "  Frontend .env.local: ✅ Exists"
else
    echo "  Frontend .env.local: ❌ Not found"
    echo "  Create: cp .env.local (template provided)"
fi

if [ -f "backend/.env" ]; then
    echo "  Backend .env: ✅ Exists"
else
    echo "  Backend .env: ❌ Not found"
    echo "  Create: cd backend && cp .env (template provided)"
fi

# Check database
echo ""
echo "✓ Checking database..."
if psql -l | grep -q askmynotes; then
    echo "  Database 'askmynotes': ✅ Exists"
else
    echo "  Database 'askmynotes': ❌ Not found"
    echo "  Create: createdb askmynotes"
fi

echo ""
echo "=================================="
echo "✅ Verification complete!"
echo ""
echo "📋 Next steps:"
echo "1. Install frontend: npm install"
echo "2. Install backend: cd backend && npm install && cd .."
echo "3. Create database: createdb askmynotes"
echo "4. Setup database: cd backend && npx prisma db push && npm run prisma:seed && cd .."
echo "5. Start backend: cd backend && npm run dev"
echo "6. Start frontend: npm run dev (in another terminal)"
echo "7. Open http://localhost:5173"
echo ""
echo "📚 Documentation:"
echo "- SETUP_GUIDE.md - Full installation guide"
echo "- API_DOCS.md - API endpoint reference"
echo "- IMPLEMENTATION_COMPLETE.md - What was done"
echo ""
