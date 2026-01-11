# Quick Deployment with Your Password

Your password: `powers4w`

## Step-by-Step Manual Deploy

### Step 1: Open PowerShell or CMD and create archive

```powershell
cd d:\Projects\Dev\Dashboard

# Create compressed archive
tar -czf Dashboard.tar.gz `
  --exclude=.git `
  --exclude=node_modules `
  --exclude=.next `
  --exclude=.env.local `
  .

# Check size
ls -lh Dashboard.tar.gz
```

### Step 2: Upload to Atlas Server

```powershell
# When prompted for password, type: powers4w
scp Dashboard.tar.gz soadmin@100.104.196.38:/opt/dashboard.tar.gz
```

### Step 3: SSH into Atlas and extract

```powershell
ssh soadmin@100.104.196.38
# Password: powers4w
```

Once connected, run these commands:

```bash
cd /opt/dashboard

# Extract the archive
tar -xzf ../dashboard.tar.gz

# Verify files
ls -la Dockerfile docker-compose.yml .env.example

# Create environment file
cp .env.example .env.local

# Edit with your credentials
nano .env.local
```

**In nano, update these values:**
```env
DOCKER_HOST=http://100.104.196.38:2375

UNIFI_HOST=100.104.196.38
UNIFI_PORT=8443
UNIFI_USERNAME=admin
UNIFI_PASSWORD=your_password_here

SYNOLOGY_HOST=100.104.196.38
SYNOLOGY_PORT=5001
SYNOLOGY_USERNAME=admin
SYNOLOGY_PASSWORD=your_password_here

NEXT_PUBLIC_GRAFANA_HOST=http://100.104.196.38:3000
NEXT_PUBLIC_API_BASE_URL=http://100.104.196.38:3001
```

**Save:** `Ctrl+O` → `Enter` → `Ctrl+X`

### Step 4: Build and deploy

Still in SSH:

```bash
# Build Docker image (2-3 minutes)
docker-compose build

# Start container
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f dashboard
```

### Step 5: Access Dashboard

Open browser:
```
http://100.104.196.38:3001
```

---

## All Commands Combined (Copy & Paste)

### Windows PowerShell

```powershell
cd d:\Projects\Dev\Dashboard
tar -czf Dashboard.tar.gz --exclude=.git --exclude=node_modules --exclude=.next --exclude=.env.local .
scp Dashboard.tar.gz soadmin@100.104.196.38:/opt/dashboard.tar.gz
ssh soadmin@100.104.196.38
```

### On Atlas Server (after SSH login)

```bash
cd /opt/dashboard
tar -xzf ../dashboard.tar.gz
cp .env.example .env.local
nano .env.local
# Edit file, save and exit
docker-compose build
docker-compose up -d
docker-compose logs -f
```

---

**Your Password:** `powers4w`

**Server:** `soadmin@100.104.196.38`

**Dashboard URL:** `http://100.104.196.38:3001`
