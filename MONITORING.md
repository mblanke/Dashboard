# Monitoring & Maintenance Guide

## Container Health Monitoring

### Check Container Status

```bash
# SSH into Atlas server
ssh soadmin@100.104.196.38

# Check if running
docker-compose -C /opt/dashboard ps

# View live logs
docker-compose -C /opt/dashboard logs -f

# Check resource usage
docker stats atlas-dashboard
```

### Health Check

The container includes a health check that runs every 30 seconds:

```bash
# Check health status
docker inspect atlas-dashboard | grep -A 5 Health
```

## Performance Monitoring

### Memory & CPU Usage

```bash
# Monitor in real-time
docker stats atlas-dashboard

# View historical stats
docker stats atlas-dashboard --no-stream
```

**Recommended limits:**
- CPU: 1 core
- Memory: 512MB
- The container typically uses 200-300MB at runtime

### Log Analysis

```bash
# View recent errors
docker-compose -C /opt/dashboard logs --tail=50 | grep -i error

# Follow logs in real-time
docker-compose -C /opt/dashboard logs -f
```

## Backup & Recovery

### Database Backups

Since this dashboard doesn't use a persistent database (it's stateless), no database backups are needed.

### Configuration Backup

```bash
# Backup .env.local
ssh soadmin@100.104.196.38 "cp /opt/dashboard/.env.local /opt/dashboard/.env.local.backup"

# Backup compose file
ssh soadmin@100.104.196.38 "cp /opt/dashboard/docker-compose.yml /opt/dashboard/docker-compose.yml.backup"
```

### Container Image Backup

```bash
# Save Docker image locally
ssh soadmin@100.104.196.38 "docker save atlas-dashboard:latest | gzip > atlas-dashboard-backup.tar.gz"

# Download backup
scp soadmin@100.104.196.38:/home/soadmin/atlas-dashboard-backup.tar.gz .
```

## Maintenance Tasks

### Weekly Tasks

- [ ] Check container logs for errors
- [ ] Verify all widgets are loading correctly
- [ ] Monitor memory/CPU usage
- [ ] Test external service connectivity

### Monthly Tasks

- [ ] Update base Docker image: `docker-compose build --pull`
- [ ] Check for upstream code updates: `git fetch && git log --oneline -5 origin/main`
- [ ] Review and test backup procedures

### Quarterly Tasks

- [ ] Update Node.js base image version
- [ ] Review and update dependencies
- [ ] Security audit of credentials/config
- [ ] Performance review and optimization

## Updating the Dashboard

### Automated Updates (GitHub Actions)

Pushes to `main` branch automatically deploy to Atlas server if GitHub Actions secrets are configured:

1. Set up GitHub Actions secrets:
   - `ATLAS_HOST` - `100.104.196.38`
   - `ATLAS_USER` - `soadmin`
   - `ATLAS_SSH_KEY` - SSH private key for automated access

2. Push to main:
   ```bash
   git push origin main
   ```

### Manual Updates

```bash
ssh soadmin@100.104.196.38

cd /opt/dashboard

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose build
docker-compose up -d

# Verify
docker-compose ps
```

## Scaling Considerations

The dashboard is designed as a single-instance application. For high-availability setups:

### Load Balancing

Add a reverse proxy (Traefik, Nginx):

```nginx
upstream dashboard {
    server 100.104.196.38:3001;
}

server {
    listen 80;
    server_name dashboard.yourdomain.com;
    
    location / {
        proxy_pass http://dashboard;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Multiple Instances

To run multiple instances:

```bash
docker-compose -p dashboard-1 up -d
docker-compose -p dashboard-2 up -d

# Use different ports
# Modify docker-compose.yml to use different port mappings
```

## Disaster Recovery

### Complete Loss Scenario

If the container is completely lost:

```bash
# 1. SSH into server
ssh soadmin@100.104.196.38

# 2. Restore from backup
cd /opt/dashboard
git clone https://github.com/mblanke/Dashboard.git .
cp /opt/dashboard/.env.local.backup .env.local

# 3. Redeploy
docker-compose build
docker-compose up -d

# 4. Verify
docker-compose ps
curl http://localhost:3001
```

### Server Loss Scenario

To migrate to a new server:

```bash
# 1. On new server
ssh soadmin@NEW_IP

# 2. Set up (same as initial deployment)
mkdir -p /opt/dashboard
cd /opt/dashboard
git clone https://github.com/mblanke/Dashboard.git .
cp .env.local.backup .env.local  # Use backed up config

# 3. Deploy
docker-compose build
docker-compose up -d

# 4. Update DNS or references to point to new IP
```

## Troubleshooting Common Issues

### Container keeps restarting

```bash
# Check logs for errors
docker-compose logs dashboard

# Common causes:
# - Missing .env.local file
# - Invalid environment variables
# - Port 3001 already in use
# - Out of disk space
```

### Memory leaks

```bash
# Monitor memory over time
while true; do
  echo "$(date): $(docker stats atlas-dashboard --no-stream | tail -1)"
  sleep 60
done

# If memory usage keeps growing, restart container
docker-compose restart dashboard
```

### API connection failures

```bash
# Check Docker API
curl http://100.104.196.38:2375/containers/json

# Check UniFi
curl -k https://UNIFI_IP:8443/api/login -X POST \
  -d '{"username":"admin","password":"password"}'

# Check Synology
curl -k https://SYNOLOGY_IP:5001/webapi/auth.cgi
```

## Performance Optimization

### Caching

The dashboard auto-refreshes every 10 seconds. To optimize:

```bash
# Increase refresh interval in src/app/page.tsx
const interval = setInterval(fetchContainers, 30000); // 30 seconds
```

### Database Queries

External API calls are read-only and lightweight. No optimization needed unless:
- API responses are very large (>5MB)
- Network latency is high (>1000ms)

Then consider adding response caching in API routes:

```typescript
// Add to route handlers
res.setHeader('Cache-Control', 'max-age=10, s-maxage=60');
```

## Support & Debugging

### Collecting Debug Information

For troubleshooting, gather:

```bash
# System info
docker --version
docker-compose --version
uname -a

# Container info
docker inspect atlas-dashboard

# Recent logs (last 100 lines)
docker-compose logs --tail=100

# Resource usage
docker stats atlas-dashboard --no-stream

# Network connectivity
curl -v http://100.104.196.38:2375/containers/json
```

### Getting Help

When reporting issues, include:
1. Output from above debug commands
2. Exact error messages from logs
3. Steps to reproduce
4. Environment configuration (without passwords)
5. Timeline of when issue started
