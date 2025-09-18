#!/bin/bash
# 🚀 Development Environment Setup Script

set -e

echo "🎯 Setting up E-commerce Monolith Development Environment..."

# Check prerequisites
echo "🔍 Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed. Aborting." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }

echo "✅ Prerequisites check passed!"

# Setup environment file
if [ ! -f .env ]; then
    echo "📄 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please review and update it with your settings."
else
    echo "📄 .env file already exists."
fi

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm ci

# Setup git hooks
echo "🔧 Setting up git hooks..."
npx husky install || echo "⚠️ Husky installation failed, skipping git hooks setup"

# Build and start containers
echo "🐳 Building and starting Docker containers..."
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "🗄️ Running database migrations..."
npm run migration:run

# Seed database
echo "🌱 Seeding database with initial data..."
npm run seed

# Start the application
echo "🚀 Starting application in development mode..."
docker-compose up -d app

# Start additional tools if requested
read -p "🔧 Do you want to start pgAdmin? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose --profile tools up -d pgadmin
    echo "🔧 pgAdmin available at http://localhost:8080"
fi

read -p "📊 Do you want to start monitoring tools (Prometheus + Grafana)? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose --profile monitoring up -d prometheus grafana
    echo "📊 Prometheus available at http://localhost:9090"
    echo "📈 Grafana available at http://localhost:3001"
fi

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "📋 Services available:"
echo "   🚀 Application: http://localhost:3000"
echo "   📚 API Docs: http://localhost:3000/api/docs"
echo "   🔍 Health Check: http://localhost:3000/health"
echo ""
echo "📋 Database connection:"
echo "   🗄️ PostgreSQL: localhost:5433"
echo "   🔄 Redis: localhost:6379"
echo ""
echo "🛠️ Useful commands:"
echo "   📊 View logs: docker-compose logs -f app"
echo "   🔄 Restart app: docker-compose restart app"
echo "   🧪 Run tests: npm run test"
echo "   🎯 Run E2E tests: npm run test:e2e"
echo "   🛑 Stop all: docker-compose down"