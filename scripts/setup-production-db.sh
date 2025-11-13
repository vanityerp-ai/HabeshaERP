#!/bin/bash

# Setup Production Database Script
# This script sets up the production database with Prisma migrations and seed data

echo "🚀 Setting up production database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set"
  echo "Please set your production database URL:"
  echo "export DATABASE_URL='postgresql://...'"
  exit 1
fi

echo "✅ DATABASE_URL is set"

# Run Prisma migrations
echo "📦 Running Prisma migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
  echo "❌ Error: Prisma migrations failed"
  exit 1
fi

echo "✅ Prisma migrations completed"

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

if [ $? -ne 0 ]; then
  echo "❌ Error: Prisma Client generation failed"
  exit 1
fi

echo "✅ Prisma Client generated"

# Run seed data (optional)
read -p "Do you want to seed the database with initial data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🌱 Seeding database..."
  npx prisma db seed
  
  if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Database seeding failed (this is optional)"
  else
    echo "✅ Database seeded successfully"
  fi
fi

echo ""
echo "🎉 Production database setup complete!"
echo ""
echo "Next steps:"
echo "1. Redeploy your Vercel application"
echo "2. Test the login functionality"
echo "3. Verify all features are working"

