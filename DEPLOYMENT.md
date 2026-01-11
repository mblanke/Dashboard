# Dashboard Deployment Guide

## Prerequisites

- Docker and Docker Compose installed on the Atlas server
- SSH access to `100.104.196.38` as `soadmin`
- UniFi Controller running and accessible
- Synology NAS running and accessible
- Grafana instance with dashboards set up
- Docker API exposed at `http://100.104.196.38:2375`

## Deployment Steps

### 1. SSH into Atlas Server

```bash
ssh soadmin@100.104.196.38
```

### 2. Clone or Update Repository

```bash
cd /opt/dashboard  # or your preferred directory
git clone https://github.com/mblanke/Dashboard.git .
# or if already cloned:
git pull origin main
```

### 3. Configure Environment Variables

Create `.env.local` file with your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual credentials:

```bash
nano .env.local
```

**Required variables:**
- `DOCKER_HOST` - Should remain `http://100.104.196.38:2375`
- `UNIFI_HOST` - IP address of UniFi Controller
- `UNIFI_USERNAME` - UniFi login username
- `UNIFI_PASSWORD` - UniFi login password
- `SYNOLOGY_HOST` - IP address of Synology NAS
- `SYNOLOGY_USERNAME` - Synology login username
- `SYNOLOGY_PASSWORD` - Synology login password
- `NEXT_PUBLIC_GRAFANA_HOST` - Grafana URL
- `GRAFANA_API_KEY` - Grafana API key (optional, for dashboard management)

### 4. Build and Deploy with Docker Compose

```bash
# Navigate to project directory
cd /path/to/Dashboard

# Build the Docker image
docker-compose build

# Start the container
docker-compose up -d

# View logs
docker-compose logs -f dashboard
```

### 5. Verify Deployment

Access the dashboard at: `http://100.104.196.38:3001`

Check that all widgets are loading:
- Docker containers list
- UniFi network devices
- Synology storage status
- Grafana panels

### 6. Configure Traefik (Optional)

If using Traefik reverse proxy, update the docker-compose labels:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.dashboard.rule=Host(`dashboard.yourdomain.com`)"
  - "traefik.http.routers.dashboard.entrypoints=https"
  - "traefik.http.services.dashboard.loadbalancer.server.port=3000"
```

### 7. Auto-Updates (Optional)

Create a systemd service or cron job to automatically pull and rebuild:

```bash
# Create update script
sudo nano /usr/local/bin/update-dashboard.sh
```

```bash
#!/bin/bash
cd /path/to/Dashboard
git pull origin main
docker-compose build
docker-compose up -d
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/update-dashboard.sh

# Add to cron (daily at 2 AM)
0 2 * * * /usr/local/bin/update-dashboard.sh
```

## Troubleshooting

### Containers not loading
- Check Docker API is accessible: `curl http://100.104.196.38:2375/containers/json`
- Verify `DOCKER_HOST` environment variable is set correctly

### UniFi widget shows error
- Verify UniFi Controller is running and accessible
- Check credentials in `.env.local`
- Confirm firewall allows access to port 8443

### Synology storage not loading
- Verify Synology NAS is accessible and running
- Check credentials have proper permissions
- Ensure SSH certificate trust (HTTPS with self-signed cert)

### Grafana panels not embedding
- Verify Grafana is accessible at configured URL
- Check CORS settings in Grafana if needed
- Confirm dashboard IDs and panel IDs are correct

## Logs and Monitoring

View container logs:

```bash
docker-compose logs -f dashboard
```

Check container status:

```bash
docker-compose ps
```

Stop the container:

```bash
docker-compose down
```

## Updating the Dashboard

```bash
cd /path/to/Dashboard
git pull origin main
docker-compose build
docker-compose up -d
```

## Port Mappings

| Service | Port | Purpose |
|---------|------|---------|
| Dashboard | 3001 | Web UI |
| Docker API | 2375 | Container management |
| UniFi Controller | 8443 | Network management |
| Synology NAS | 5001 | Storage management |
| Grafana | 3000 | Monitoring dashboards |
