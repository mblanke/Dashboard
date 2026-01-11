# Quick Start Guide - Atlas Dashboard Deployment

## 🚀 5-Minute Deploy

### Step 1: Configure Environment (2 minutes)

Create `.env.local` on the Atlas server:

```bash
ssh soadmin@100.104.196.38

cat > /opt/dashboard/.env.local << 'EOF'
# Docker API
DOCKER_HOST=http://100.104.196.38:2375

# UniFi Controller
UNIFI_HOST=100.104.196.38
UNIFI_PORT=8443
UNIFI_USERNAME=admin
UNIFI_PASSWORD=YOUR_PASSWORD

# Synology NAS
SYNOLOGY_HOST=100.104.196.38
SYNOLOGY_PORT=5001
SYNOLOGY_USERNAME=admin
SYNOLOGY_PASSWORD=YOUR_PASSWORD

# Grafana
NEXT_PUBLIC_GRAFANA_HOST=http://100.104.196.38:3000
GRAFANA_API_KEY=your_api_key_here

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://100.104.196.38:3001
EOF
```

### Step 2: Deploy (2 minutes)

```bash
cd /opt/dashboard

# Clone if first time
git clone https://github.com/mblanke/Dashboard.git .
# or update existing
git pull origin main

# Deploy
docker-compose build
docker-compose up -d
```

### Step 3: Verify (1 minute)

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs dashboard

# Test access
curl http://localhost:3001
```

**Access dashboard**: `http://100.104.196.38:3001`

---

## 🔧 Automated Deploy Script

### Linux/Mac:

```bash
chmod +x deploy.sh
./deploy.sh
```

### Windows:

```cmd
deploy.bat
```

---

## 📊 What You'll See

Once deployed, the dashboard shows:

1. **Docker Containers** - Grouped by category (Media, Download, Infrastructure, Monitoring, Automation, etc.)
2. **UniFi Network** - Connected devices and client count
3. **Synology Storage** - Volume usage and capacity
4. **Grafana Panels** - Embedded monitoring dashboards

---

## 🆘 Troubleshooting

**Dashboard not accessible?**
```bash
ssh soadmin@100.104.196.38
docker-compose -C /opt/dashboard logs
```

**Container won't start?**
- Check `.env.local` has all required variables
- Verify Docker daemon is running: `docker ps`
- Check firewall allows port 3001

**Widgets show errors?**
- Verify credentials in `.env.local`
- Check external service is accessible from Atlas server
- View browser console for more details

---

## 🔄 Updates

Pull latest changes and redeploy:

```bash
cd /opt/dashboard
git pull origin main
docker-compose build
docker-compose up -d
```

---

## 📝 Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `DOCKER_HOST` | Docker daemon API | `http://100.104.196.38:2375` |
| `UNIFI_HOST` | UniFi Controller IP | `100.104.196.38` |
| `UNIFI_USERNAME` | UniFi login | `admin` |
| `UNIFI_PASSWORD` | UniFi password | `your_password` |
| `SYNOLOGY_HOST` | Synology NAS IP | `100.104.196.38` |
| `SYNOLOGY_USERNAME` | Synology login | `admin` |
| `SYNOLOGY_PASSWORD` | Synology password | `your_password` |
| `NEXT_PUBLIC_GRAFANA_HOST` | Grafana URL | `http://100.104.196.38:3000` |
| `NEXT_PUBLIC_API_BASE_URL` | Dashboard API URL | `http://100.104.196.38:3001` |

---

## 📦 Tech Stack

- **Next.js 14** - React framework
- **Docker** - Containerization
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Node 20** - Runtime
