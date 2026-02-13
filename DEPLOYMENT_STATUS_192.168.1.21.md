# Dashboard Deployment to 192.168.1.21

## Deployment Status: IN PROGRESS

### Server Information
- **Host**: 192.168.1.21
- **User**: soadmin
- **Password**: powers4w
- **Deployment Path**: /opt/dashboard
- **Container Name**: atlas-dashboard
- **Dashboard URL**: http://192.168.1.21:3000

### What Has Been Done
1.  Project files copied via SCP to /opt/dashboard
2.  .env configuration file created and transferred
3.  Project structure verified on remote server

### What Needs to be Done
1. SSH into the server and verify files arrived
2. Install docker-compose if needed
3. Build the Docker image
4. Start the container

### Manual Deployment Commands

Run these commands in sequence on the remote server:

\\\ash
# 1. Login to server
ssh soadmin@192.168.1.21

# 2. Navigate to project directory
cd /opt/dashboard

# 3. Install docker-compose if needed
if ! command -v docker-compose &> /dev/null; then
  sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-\-\ -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
fi

# 4. Verify .env exists and update if needed
cat .env
nano .env  # Edit to add real passwords for UniFi, Synology, Grafana

# 5. Build Docker image (takes 5-15 minutes)
sudo docker-compose build

# 6. Start the container
sudo docker-compose up -d

# 7. Check status
sudo docker ps -a | grep atlas-dashboard
sudo docker logs atlas-dashboard  # View logs

# 8. Test the dashboard
curl http://localhost:3000
\\\

### Troubleshooting

**If docker-compose command not found:**
\\\ash
sudo apt-get update
sudo apt-get install -y docker-compose
# OR
sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-\-\ -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
\\\

**If Docker build fails:**
\\\ash
cd /opt/dashboard
sudo docker-compose build --no-cache
\\\

**To stop and remove old container:**
\\\ash
sudo docker stop atlas-dashboard
sudo docker rm atlas-dashboard
\\\

**To view container logs:**
\\\ash
sudo docker logs -f atlas-dashboard
\\\

### Important Notes

1. **Update .env credentials**: The .env file has placeholder values. You MUST update it with:
   - UNIFI_PASSWORD: Your UniFi controller password
   - SYNOLOGY_PASSWORD: Your Synology NAS password
   - GRAFANA_API_KEY: Your Grafana API key

2. **Docker socket access**: The application accesses Docker via unix:///var/run/docker.sock. Make sure the soadmin user is in the docker group:
   \\\ash
   sudo usermod -aG docker soadmin
   \\\

3. **Firewall**: Ensure port 3000 is accessible on your network

4. **Container restart policy**: The container is set to restart unless stopped

### Files Structure on Remote Server
\\\
/opt/dashboard/
 Dockerfile
 docker-compose.yml
 .env (created)
 package.json
 tsconfig.json
 next.config.js
 src/
 components/
 app/
 ... (all other project files)
\\\

---
**Generated**: 2026-01-11 18:47:18
