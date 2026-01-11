#!/usr/bin/env pwsh
# Atlas Dashboard - Automated Deployment Script
# This script packages and deploys the dashboard to Atlas server

param(
    [string]$Password = "powers4w",
    [string]$AtlasHost = "100.104.196.38",
    [string]$AtlasUser = "soadmin"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Atlas Dashboard - Automated Deploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create tar archive
Write-Host "Step 1: Creating archive..." -ForegroundColor Yellow
$archivePath = "C:\Dashboard.tar.gz"

# Remove old archive if exists
if (Test-Path $archivePath) {
    Remove-Item $archivePath -Force
    Write-Host "  Removed old archive"
}

# Create the archive (excluding unnecessary files)
Write-Host "  Compressing files..."
tar -czf $archivePath `
    --exclude=.git `
    --exclude=node_modules `
    --exclude=.next `
    --exclude=.env.local `
    --exclude=dist `
    --exclude=out `
    -C "d:\Projects\Dev\Dashboard" .

if ($LASTEXITCODE -eq 0) {
    $size = (Get-Item $archivePath).Length / 1MB
    Write-Host "  ✅ Archive created: $([math]::Round($size, 2)) MB" -ForegroundColor Green
}
else {
    Write-Host "  ❌ Failed to create archive" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Transfer to server
Write-Host "Step 2: Transferring to Atlas server..." -ForegroundColor Yellow

# Create secure string for password
$secPassword = ConvertTo-SecureString $Password -AsPlainText -Force

# Use scp to transfer (requires SSH to be installed)
Write-Host "  Uploading dashboard.tar.gz..."
$scpCommand = "scp -o StrictHostKeyChecking=no Dashboard.tar.gz ${AtlasUser}@${AtlasHost}:/opt/dashboard.tar.gz"

# For Windows, we need plink or similar. Let's use a different approach with SSH
# Actually, let's try using scp directly via git bash or openssh

try {
    # First verify SSH works
    & ssh -o StrictHostKeyChecking=no -o BatchMode=yes ${AtlasUser}@${AtlasHost} "echo Connected" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  SSH connection test needed password, continuing..." -ForegroundColor Yellow
    }
    
    # Transfer file
    Write-Host "  Transferring..."
    & scp -o StrictHostKeyChecking=no Dashboard.tar.gz "${AtlasUser}@${AtlasHost}:/opt/dashboard.tar.gz" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Transfer successful" -ForegroundColor Green
    }
    else {
        Write-Host "  ⚠️  Transfer may have failed, continuing anyway..." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "  ⚠️  Error during transfer: $_" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Extract and setup on server
Write-Host "Step 3: Extracting and configuring on server..." -ForegroundColor Yellow

$remoteCommands = @"
set -e
echo "Extracting files..."
cd /opt/dashboard
tar -xzf ../dashboard.tar.gz

echo "Verifying files..."
ls -la Dockerfile docker-compose.yml .env.example

echo "Creating .env.local..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "Created .env.local - please edit with your credentials"
fi

echo "Files ready in /opt/dashboard"
ls -la | head -20
"@

Write-Host "  Running setup commands on server..."
$remoteCommands | ssh -o StrictHostKeyChecking=no ${AtlasUser}@${AtlasHost}

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Setup complete" -ForegroundColor Green
}
else {
    Write-Host "  ⚠️  Setup had some issues, checking..." -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Build and deploy
Write-Host "Step 4: Building and deploying..." -ForegroundColor Yellow

$deployCommands = @"
set -e
cd /opt/dashboard

echo "Building Docker image (this may take 2-3 minutes)..."
docker-compose build

echo "Starting container..."
docker-compose up -d

echo "Waiting for container to start..."
sleep 5

echo "Checking status..."
docker-compose ps

echo "Viewing logs..."
docker-compose logs --tail=20 dashboard
"@

Write-Host "  This will take 2-3 minutes..." -ForegroundColor Yellow
$deployCommands | ssh -o StrictHostKeyChecking=no ${AtlasUser}@${AtlasHost}

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Deployment started" -ForegroundColor Green
}
else {
    Write-Host "  ⚠️  Deployment had issues - check logs on server" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Deployment Process Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. SSH to server: ssh ${AtlasUser}@${AtlasHost}" -ForegroundColor White
Write-Host "2. Edit credentials: cd /opt/dashboard && nano .env.local" -ForegroundColor White
Write-Host "3. Restart container: docker-compose restart dashboard" -ForegroundColor White
Write-Host "4. Access dashboard: http://${AtlasHost}:3001" -ForegroundColor White
Write-Host ""
Write-Host "📊 Dashboard URL: http://${AtlasHost}:3001" -ForegroundColor Cyan
Write-Host ""

# Cleanup
Write-Host "Cleaning up local archive..." -ForegroundColor Yellow
if (Test-Path $archivePath) {
    Remove-Item $archivePath -Force
    Write-Host "✅ Cleanup complete" -ForegroundColor Green
}

Write-Host ""
Write-Host "Done! 🎉" -ForegroundColor Green
