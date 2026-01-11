# Pre-Deployment Checklist

## Server & Infrastructure
- [ ] Atlas server (100.104.196.38) is running and accessible
- [ ] SSH access verified (`ssh soadmin@100.104.196.38`)
- [ ] Docker and Docker Compose are installed on Atlas server
- [ ] Port 3001 is available on Atlas server

## Dependencies & External Services
- [ ] Docker daemon is running and accessible at `http://100.104.196.38:2375`
  - Test: `curl http://100.104.196.38:2375/containers/json`
- [ ] UniFi Controller is running and accessible
  - [ ] Hostname/IP address known
  - [ ] SSH port known (default: 8443)
  - [ ] Admin credentials available
- [ ] Synology NAS is running and accessible
  - [ ] Hostname/IP address known
  - [ ] HTTPS port known (default: 5001)
  - [ ] Admin credentials available
- [ ] Grafana instance is running
  - [ ] Accessible at known URL
  - [ ] Dashboards created with known IDs
  - [ ] API key generated (if needed)

## Code & Configuration
- [ ] Git repository is cloned and up-to-date
- [ ] `.env.local` file created with all required variables
  - [ ] `DOCKER_HOST` configured
  - [ ] `UNIFI_HOST`, `UNIFI_USERNAME`, `UNIFI_PASSWORD` set
  - [ ] `SYNOLOGY_HOST`, `SYNOLOGY_USERNAME`, `SYNOLOGY_PASSWORD` set
  - [ ] `NEXT_PUBLIC_GRAFANA_HOST` configured
  - [ ] `NEXT_PUBLIC_API_BASE_URL` set to `http://100.104.196.38:3001`
- [ ] Docker image builds successfully locally (`docker build .`)
- [ ] All environment variables are marked as required or have defaults

## Deployment Process
- [ ] Deployment script has execute permissions: `chmod +x deploy.sh`
- [ ] SSH key is configured (if not using password auth)
- [ ] Deploy directory exists or will be created: `/opt/dashboard`

## Post-Deployment Verification
- [ ] Container starts successfully: `docker-compose up -d`
- [ ] Container is healthy: `docker-compose ps` shows "Up"
- [ ] Dashboard is accessible at `http://100.104.196.38:3001`
- [ ] Docker containers widget loads and displays containers
- [ ] UniFi widget loads and shows devices (or displays error if not configured)
- [ ] Synology widget loads and shows storage (or displays error if not configured)
- [ ] Grafana panels embed correctly
- [ ] Search functionality works
- [ ] Auto-refresh happens every 10 seconds

## Optional Enhancements
- [ ] Traefik is configured and running (if using reverse proxy)
- [ ] HTTPS/SSL certificate is configured
- [ ] Automatic logs rotation is set up
- [ ] Monitoring/alerting is configured
- [ ] Backup strategy is planned

## Troubleshooting
- [ ] Have access to Docker logs: `docker-compose logs -f`
- [ ] Know how to SSH into the server
- [ ] Have credentials for all external services
- [ ] Network connectivity is verified
