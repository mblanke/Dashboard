@echo off
REM Atlas Dashboard Deployment Script for Windows
REM This script deploys the dashboard to the Atlas server

setlocal enabledelayedexpansion

set ATLAS_HOST=100.104.196.38
set ATLAS_USER=soadmin

echo.
echo =========================================
echo 🚀 Atlas Dashboard Deployment
echo =========================================
echo.

echo 📡 Checking connection to Atlas server...
ping -n 1 %ATLAS_HOST% >nul 2>&1
if errorlevel 1 (
    echo ❌ Cannot reach Atlas server at %ATLAS_HOST%
    exit /b 1
)
echo ✅ Atlas server is reachable

echo.
echo 📦 Deploying to %ATLAS_HOST%...
echo.

REM Using PuTTY plink or ssh if available
where ssh >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ SSH not found. Please ensure SSH is installed and in PATH
    exit /b 1
)

echo 🔄 Pulling latest code...
ssh %ATLAS_USER%@%ATLAS_HOST% "mkdir -p /opt/dashboard && cd /opt/dashboard && if [ ! -d .git ]; then git clone https://github.com/mblanke/Dashboard.git . ; else git pull origin main; fi"

if errorlevel 1 (
    echo ❌ Failed to pull code
    exit /b 1
)

echo ✅ Code updated

echo.
echo 🔨 Building and starting container...
ssh %ATLAS_USER%@%ATLAS_HOST% "cd /opt/dashboard && docker-compose build --no-cache && docker-compose up -d"

if errorlevel 1 (
    echo ❌ Failed to build/start container
    exit /b 1
)

echo.
echo ✅ Deployment Complete!
echo 📊 Dashboard URL: http://100.104.196.38:3001
echo.
echo 📋 To view logs:
echo    ssh %ATLAS_USER%@%ATLAS_HOST% "docker-compose -C /opt/dashboard logs -f"
echo.
