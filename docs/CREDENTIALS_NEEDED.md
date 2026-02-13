# ✅ Files Uploaded to Atlas Server

## Status: READY TO CONFIGURE

All Dashboard source code, Docker configuration, and documentation has been uploaded to:
```
/opt/dashboard
```

### Files Transferred ✅
- ✅ Dockerfile (production image)
- ✅ docker-compose.yml (orchestration)
- ✅ package.json (dependencies)
- ✅ Next.js config files
- ✅ All source code (src/ directory)
- ✅ All components
- ✅ All API routes
- ✅ All documentation

### Current .env.local Location
```
/opt/dashboard/.env.local
```

### Current Configuration
```env
DOCKER_HOST=http://100.104.196.38:2375
UNIFI_HOST=100.104.196.38
UNIFI_PORT=8443
UNIFI_USERNAME=admin
UNIFI_PASSWORD=CHANGE_ME  ← YOU NEED TO UPDATE

SYNOLOGY_HOST=100.104.196.38
SYNOLOGY_PORT=5001
SYNOLOGY_USERNAME=admin
SYNOLOGY_PASSWORD=CHANGE_ME  ← YOU NEED TO UPDATE

NEXT_PUBLIC_GRAFANA_HOST=http://100.104.196.38:3000
GRAFANA_API_KEY=optional

NEXT_PUBLIC_API_BASE_URL=http://100.104.196.38:3001
```

---

## 🔧 Next Step: Add Your Credentials

SSH into the server and edit the file:

```bash
ssh soadmin@100.104.196.38

# Edit the credentials file
nano /opt/dashboard/.env.local
```

### Update These Values:

1. **UNIFI_PASSWORD** - Your UniFi admin password
2. **SYNOLOGY_PASSWORD** - Your Synology admin password

Replace `CHANGE_ME` with your actual passwords.

**To save in nano:**
- Press `Ctrl+O` then `Enter` to save
- Press `Ctrl+X` to exit

---

## 🚀 After Updating Credentials

```bash
# Build Docker image (2-3 minutes)
docker-compose build

# Start the container
docker-compose up -d

# Check if it's running
docker-compose ps

# View logs
docker-compose logs -f dashboard
```

Then access: **http://100.104.196.38:3001**

---

## 📝 Provide These When Ready:

1. **UniFi Admin Password:**
2. **Synology Admin Password:**

I can update the .env.local file directly once you provide them!
