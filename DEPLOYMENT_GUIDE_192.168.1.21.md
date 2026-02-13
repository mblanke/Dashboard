# DASHBOARD DEPLOYMENT GUIDE
# Remote Server: 192.168.1.21
# User: soadmin (password: powers4w)
# Deploy Path: /opt/dashboard

## OPTION 1: Manual Deployment (Step-by-step via SSH)

### 1. SSH into the server
ssh soadmin@192.168.1.21

### 2. Create and navigate to deployment directory
sudo mkdir -p /opt/dashboard
sudo chown soadmin:soadmin /opt/dashboard
cd /opt/dashboard

### 3. Clone or copy the project
# Option A: Clone from Git (if repository is accessible)
git clone <your-repo-url> .

# Option B: If you have the files, copy them via SCP from your Windows machine
# Run this from Windows PowerShell:
scp -r "D:\Dev\Dashboard\*" soadmin@192.168.1.21:/opt/dashboard/

### 4. Create .env file with your configuration
nano .env

# Add the following configuration:
# Docker API - using local Docker socket
DOCKER_HOST=unix:///var/run/docker.sock

# UniFi Controller
UNIFI_HOST=192.168.1.50
UNIFI_PORT=8443
UNIFI_USERNAME=admin
UNIFI_PASSWORD=your_password

# Synology NAS
SYNOLOGY_HOST=192.168.1.30
SYNOLOGY_PORT=5001
SYNOLOGY_USERNAME=admin
SYNOLOGY_PASSWORD=your_password

# Grafana
NEXT_PUBLIC_GRAFANA_HOST=http://192.168.1.21:3000
GRAFANA_API_KEY=your_api_key

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://192.168.1.21:3001

### 5. Build and run with Docker Compose
sudo docker-compose build
sudo docker-compose up -d

### 6. Verify deployment
sudo docker ps -a | grep atlas-dashboard
sudo docker logs -f atlas-dashboard

---

## OPTION 2: Automated Deployment (Using provided scripts)

### Windows PowerShell:
# Make sure you have SSH installed (comes with Git for Windows)
# Run this in PowerShell from d:\Dev\Dashboard:

.\deploy-remote-windows.ps1 -SSHPassword (ConvertTo-SecureString 'powers4w' -AsPlainText -Force)

### Linux/Mac/Git Bash:
bash deploy-remote.sh

---

## VERIFY DEPLOYMENT

1. Check if container is running:
   ssh soadmin@192.168.1.21 'sudo docker ps -a'

2. Check logs:
   ssh soadmin@192.168.1.21 'sudo docker logs -f atlas-dashboard'

3. Access the dashboard:
   http://192.168.1.21:3000

---

## TROUBLESHOOTING

### Port already in use:
sudo docker ps -a
sudo docker stop atlas-dashboard
sudo docker rm atlas-dashboard

### Need to update .env:
ssh soadmin@192.168.1.21 'nano /opt/dashboard/.env'
ssh soadmin@192.168.1.21 'sudo docker-compose -f /opt/dashboard/docker-compose.yml restart'

### View container logs:
ssh soadmin@192.168.1.21 'sudo docker logs --tail 100 atlas-dashboard'

### Rebuild image:
ssh soadmin@192.168.1.21 'cd /opt/dashboard && sudo docker-compose up -d --build'

