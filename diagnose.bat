@echo off
REM Atlas Dashboard Deployment Script for Windows - SIMPLIFIED
REM This script helps debug deployment issues

setlocal enabledelayedexpansion

set ATLAS_HOST=100.104.196.38
set ATLAS_USER=soadmin

echo.
echo =========================================
echo   DEBUG: Atlas Dashboard Deploy
echo =========================================
echo.

echo Step 1: Check if SSH is available...
where ssh >nul 2>&1
if errorlevel 1 (
    echo ❌ SSH not found
    echo Solution: Install OpenSSH or Git Bash with SSH
    echo Get it from: https://git-scm.com/download/win
    exit /b 1
)
echo ✅ SSH found

echo.
echo Step 2: Check connection to Atlas server at %ATLAS_HOST%...
ping -n 1 %ATLAS_HOST% >nul 2>&1
if errorlevel 1 (
    echo ❌ Cannot reach %ATLAS_HOST%
    echo Check:
    echo   - Is the server running?
    echo   - Is network connected?
    echo   - Correct IP address?
    exit /b 1
)
echo ✅ Server is reachable

echo.
echo Step 3: Test SSH connection...
ssh %ATLAS_USER%@%ATLAS_HOST% "echo ✅ SSH connection successful"
if errorlevel 1 (
    echo ❌ SSH connection failed
    echo Check:
    echo   - Correct username: %ATLAS_USER%
    echo   - SSH key configured
    echo   - Firewall allows SSH
    exit /b 1
)

echo.
echo Step 4: Check if Docker is available on server...
ssh %ATLAS_USER%@%ATLAS_HOST% "docker --version"
if errorlevel 1 (
    echo ❌ Docker not found on server
    echo Install Docker on %ATLAS_HOST%
    exit /b 1
)

echo.
echo Step 5: Check if docker-compose is available...
ssh %ATLAS_USER%@%ATLAS_HOST% "docker-compose --version"
if errorlevel 1 (
    echo ❌ docker-compose not found on server
    echo Install docker-compose on %ATLAS_HOST%
    exit /b 1
)

echo.
echo ✅ All prerequisites met!
echo.
echo Ready to deploy. Next steps:
echo 1. Ensure you have created .env.local with your credentials
echo 2. Run: ssh %ATLAS_USER%@%ATLAS_HOST%
echo 3. Then:
echo    cd /opt/dashboard
echo    git clone https://github.com/mblanke/Dashboard.git .
echo    cp .env.example .env.local
echo    # Edit .env.local with your credentials
echo    docker-compose build
echo    docker-compose up -d
echo.
