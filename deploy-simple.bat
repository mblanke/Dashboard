@echo off
REM Atlas Dashboard - Simple Deployment
REM Password: powers4w

cd /d d:\Projects\Dev\Dashboard

echo ========================================
echo   Atlas Dashboard - Deploy
echo ========================================
echo.

echo Step 1: Creating archive...
tar -czf Dashboard.tar.gz ^
    --exclude=.git ^
    --exclude=node_modules ^
    --exclude=.next ^
    --exclude=.env.local ^
    .

if errorlevel 1 (
    echo Error creating archive
    exit /b 1
)

echo Successfully created Dashboard.tar.gz
echo.

echo Step 2: Transferring to server...
echo (When prompted for password, type: powers4w)
echo.

scp Dashboard.tar.gz soadmin@100.104.196.38:/opt/dashboard.tar.gz

if errorlevel 1 (
    echo Warning: Transfer may have failed
)

echo.
echo Step 3: Extract on server (run these commands manually on SSH)
echo.
echo Commands to run on Atlas server:
echo.
echo   cd /opt/dashboard
echo   tar -xzf ../dashboard.tar.gz
echo   cp .env.example .env.local
echo   nano .env.local
echo   (edit with your UniFi, Synology, Grafana credentials)
echo.
echo   docker-compose build
echo   docker-compose up -d
echo   docker-compose logs -f
echo.

echo.
echo ========================================
echo Archive created: Dashboard.tar.gz
echo Upload to: soadmin@100.104.196.38
echo Deploy directory: /opt/dashboard
echo ========================================
