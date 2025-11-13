# Setup Production Database Script (PowerShell)
# This script sets up the production database with Prisma migrations and seed data

Write-Host "🚀 Setting up production database..." -ForegroundColor Cyan

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "❌ Error: DATABASE_URL environment variable is not set" -ForegroundColor Red
    Write-Host "Please set your production database URL:" -ForegroundColor Yellow
    Write-Host '$env:DATABASE_URL = "postgresql://..."' -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ DATABASE_URL is set" -ForegroundColor Green

# Run Prisma migrations
Write-Host "📦 Running Prisma migrations..." -ForegroundColor Cyan
npx prisma migrate deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Prisma migrations failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prisma migrations completed" -ForegroundColor Green

# Generate Prisma Client
Write-Host "🔧 Generating Prisma Client..." -ForegroundColor Cyan
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Prisma Client generation failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prisma Client generated" -ForegroundColor Green

# Run seed data (optional)
$response = Read-Host "Do you want to seed the database with initial data? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host "🌱 Seeding database..." -ForegroundColor Cyan
    npx prisma db seed
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Warning: Database seeding failed (this is optional)" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Database seeded successfully" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🎉 Production database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Redeploy your Vercel application"
Write-Host "2. Test the login functionality"
Write-Host "3. Verify all features are working"

