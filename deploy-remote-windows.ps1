# Dashboard Deployment Script - PowerShell Version
# Usage: .\deploy-remote-windows.ps1 -SSHPassword "powers4w"

param(
    [Parameter(Mandatory=$true)]
    [securestring]$SSHPassword,
    
    [string]$RemoteHost = "192.168.1.21",
    [string]$RemoteUser = "soadmin",
    [string]$DeployPath = "/opt/dashboard",
    [string]$ProjectName = "atlas-dashboard"
)

$ErrorActionPreference = "Stop"

Write-Host "=========================================`n" -ForegroundColor Cyan
Write-Host "Dashboard Deployment to Ubuntu Server`n" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan
Write-Host "Remote: $RemoteUser@$RemoteHost"
Write-Host "Path: $DeployPath`n"

# Check if SSH is available
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: SSH not found. Please install Git for Windows which includes OpenSSH.`n" -ForegroundColor Red
    exit 1
}

# Helper function to run SSH commands
function Invoke-RemoteSSH {
    param(
        [string]$Command,
        [securestring]$Password
    )
    
    # Convert secure string to plain text temporarily for SSH
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
    $plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    
    # Using sshpass for password-based authentication
    $sshpassPath = "C:\Program Files\Git\usr\bin\sshpass.exe"
    
    if (-not (Test-Path $sshpassPath)) {
        Write-Host "WARNING: sshpass not found. Trying direct SSH (you may be prompted for password)..." -ForegroundColor Yellow
        ssh -o StrictHostKeyChecking=no "${RemoteUser}@${RemoteHost}" $Command
    } else {
        & $sshpassPath -p $plainPassword ssh -o StrictHostKeyChecking=no "${RemoteUser}@${RemoteHost}" $Command
    }
}

try {
    # Step 1: Create deployment directory
    Write-Host "[1/6] Creating deployment directory on remote server..." -ForegroundColor Cyan
    Invoke-RemoteSSH -Command "sudo mkdir -p $DeployPath && sudo chown $RemoteUser:$RemoteUser $DeployPath" -Password $SSHPassword
    Write-Host " Deployment directory ready`n" -ForegroundColor Green

    # Step 2: Copy project files
    Write-Host "[2/6] Copying project files to remote server..." -ForegroundColor Cyan
    Write-Host "This may take a few minutes..." -ForegroundColor Yellow
    
    $sourceDir = "D:\Dev\Dashboard"
    & scp -o StrictHostKeyChecking=no -r "$sourceDir\*" "${RemoteUser}@${RemoteHost}:${DeployPath}/"
    Write-Host " Files copied successfully`n" -ForegroundColor Green

    # Step 3: Create .env file
    Write-Host "[3/6] Creating .env configuration on remote server..." -ForegroundColor Cyan
    $envContent = @"
# Docker API - using local Docker socket
DOCKER_HOST=unix:///var/run/docker.sock

# UniFi Controller (update with your actual IPs)
UNIFI_HOST=192.168.1.50
UNIFI_PORT=8443
UNIFI_USERNAME=admin
UNIFI_PASSWORD=your_unifi_password

# Synology NAS
SYNOLOGY_HOST=192.168.1.30
SYNOLOGY_PORT=5001
SYNOLOGY_USERNAME=admin
SYNOLOGY_PASSWORD=your_synology_password

# Grafana
NEXT_PUBLIC_GRAFANA_HOST=http://192.168.1.21:3000
GRAFANA_API_KEY=your_grafana_api_key

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://192.168.1.21:3001
"@

    $envCommand = "cat > $DeployPath/.env << 'EOF'`n$envContent`nEOF"
    Invoke-RemoteSSH -Command $envCommand -Password $SSHPassword
    Write-Host " .env file created`n" -ForegroundColor Green
    Write-Host "  IMPORTANT: Update .env file with your actual credentials!" -ForegroundColor Yellow
    Write-Host "   Run: ssh $RemoteUser@$RemoteHost 'nano $DeployPath/.env'`n" -ForegroundColor Yellow

    # Step 4: Build Docker image
    Write-Host "[4/6] Building Docker image on remote server..." -ForegroundColor Cyan
    Write-Host "This may take 5-10 minutes..." -ForegroundColor Yellow
    Invoke-RemoteSSH -Command "cd $DeployPath && sudo docker build -t $ProjectName:latest ." -Password $SSHPassword
    Write-Host " Docker image built successfully`n" -ForegroundColor Green

    # Step 5: Stop existing container
    Write-Host "[5/6] Stopping existing container (if running)..." -ForegroundColor Cyan
    Invoke-RemoteSSH -Command "sudo docker stop $ProjectName 2>/dev/null || true; sudo docker rm $ProjectName 2>/dev/null || true" -Password $SSHPassword
    Write-Host " Old container removed`n" -ForegroundColor Green

    # Step 6: Start new container
    Write-Host "[6/6] Starting new container..." -ForegroundColor Cyan
    Invoke-RemoteSSH -Command "cd $DeployPath && sudo docker-compose up -d && sleep 3 && sudo docker ps -a | grep $ProjectName" -Password $SSHPassword
    Write-Host " Container started successfully`n" -ForegroundColor Green

    Write-Host "=========================================`n" -ForegroundColor Green
    Write-Host "Deployment Complete!`n" -ForegroundColor Green
    Write-Host "=========================================`n" -ForegroundColor Green
    Write-Host "Dashboard accessible at: http://192.168.1.21:3000`n" -ForegroundColor Cyan
    Write-Host "Check logs: ssh soadmin@192.168.1.21 'sudo docker logs -f atlas-dashboard'`n" -ForegroundColor Yellow

} catch {
    Write-Host "ERROR: Deployment failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
