#!/bin/bash

# 🔐 Generate Secure Secrets for GitHub Actions
# Usage: ./scripts/generate-secrets.sh

echo "╔══════════════════════════════════════╗"
echo "║      🔐 Secret Generator             ║"
echo "║   Enterprise Grade Credentials      ║"
echo "╚══════════════════════════════════════╝"
echo ""

echo "📋 Copy these secrets to GitHub:"
echo "Settings → Secrets and variables → Actions → New repository secret"
echo ""

echo "🔑 JWT_SECRET:"
JWT_SECRET=$(openssl rand -base64 32)
echo "$JWT_SECRET"
echo ""

echo "🔑 JWT_REFRESH_SECRET:"
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
echo "$JWT_REFRESH_SECRET"
echo ""

echo "🔑 DB_PASSWORD:"
DB_PASSWORD=$(openssl rand -base64 24)
echo "$DB_PASSWORD"
echo ""

echo "🔑 REDIS_PASSWORD:"
REDIS_PASSWORD=$(openssl rand -base64 16)
echo "$REDIS_PASSWORD"
echo ""

echo "🔑 STAGING_DB_PASSWORD:"
STAGING_DB_PASSWORD=$(openssl rand -base64 24)
echo "$STAGING_DB_PASSWORD"
echo ""

echo "🔑 PROD_DB_PASSWORD:"
PROD_DB_PASSWORD=$(openssl rand -base64 24)
echo "$PROD_DB_PASSWORD"
echo ""

echo "📝 Save to file for reference:"
cat > secrets_backup.txt << EOF
# Generated secrets - $(date)
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
DB_PASSWORD=$DB_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD
STAGING_DB_PASSWORD=$STAGING_DB_PASSWORD
PROD_DB_PASSWORD=$PROD_DB_PASSWORD

# Basic configuration (customize these)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce_catalog
DB_USER=postgres
REDIS_HOST=localhost
REDIS_PORT=6379
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200
EOF

echo "✅ Secrets saved to 'secrets_backup.txt'"
echo ""
echo "🚀 Next steps:"
echo "1. Go to: https://github.com/ArielDRighi/ecommerce-monolith-foundation/settings/secrets/actions"
echo "2. Click 'New repository secret'"
echo "3. Add each secret with Name and Value from above"
echo "4. Create GitHub environments (staging, production)"
echo ""