# Manual Deployment Guide (Copy & Paste Commands)

## What went wrong?

The automated `deploy.bat` script needs:
1. SSH installed on Windows (Git Bash or OpenSSH)
2. Network connection to 100.104.196.38
3. Proper SSH key setup

## Solution: Deploy Manually (Easier)

### Step 1: Open Command Prompt or PowerShell

```powershell
# Or use Command Prompt (cmd.exe)
powershell
```

### Step 2: SSH into the Atlas server

```bash
ssh soadmin@100.104.196.38
```

**If this fails:**
- **"ssh command not found"** → Install Git Bash: https://git-scm.com/download/win
- **"Permission denied"** → Your SSH key isn't set up or password is wrong
- **"Connection refused"** → Server isn't accessible or wrong IP

### Step 3: Once logged in, run these commands

```bash
# Create directory
mkdir -p /opt/dashboard
cd /opt/dashboard

# Clone the repository (first time only)
git clone https://github.com/mblanke/Dashboard.git .

# If already cloned, update instead:
# git pull origin main
```

### Step 4: Create .env.local with your credentials

```bash
# Copy the template
cp .env.example .env.local

# Edit with your actual credentials
nano .env.local
```

Replace these values:
```env
UNIFI_HOST=100.104.196.38         # Or your UniFi IP
UNIFI_USERNAME=admin              # Your UniFi username
UNIFI_PASSWORD=your_password      # Your UniFi password

SYNOLOGY_HOST=100.104.196.38      # Or your Synology IP
SYNOLOGY_USERNAME=admin           # Your Synology username
SYNOLOGY_PASSWORD=your_password   # Your Synology password

NEXT_PUBLIC_GRAFANA_HOST=http://100.104.196.38:3000  # Your Grafana URL
```

**To edit in nano:**
- Type the new values
- Press Ctrl+O then Enter to save
- Press Ctrl+X to exit

### Step 5: Build and deploy

```bash
# Build the Docker image
docker-compose build

# Start the container
docker-compose up -d
```

### Step 6: Verify it's running

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f dashboard
```

Should show:
- Container: "Up" (green)
- Port: 3001:3000
- Status: "healthy" or "starting"

### Step 7: Access the dashboard

Open browser and go to:
```
http://100.104.196.38:3001
```

---

## 🆘 If Something Goes Wrong

### Docker not found
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### docker-compose not found
```bash
# Install docker-compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Permission denied errors
```bash
# Add current user to docker group
sudo usermod -aG docker $USER
# Then logout and login again
exit
ssh soadmin@100.104.196.38
```

### Port 3001 already in use
```bash
# Find what's using port 3001
sudo lsof -i :3001

# Either kill it or use a different port
# To use different port, edit docker-compose.yml:
# Change "3001:3000" to "3002:3000" (for port 3002)
```

### Container won't start
```bash
# Check logs for errors
docker-compose logs dashboard

# Common issues:
# 1. Missing .env.local
# 2. Invalid credentials
# 3. Out of disk space
# 4. Invalid environment variables
```

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Can SSH into 100.104.196.38 as soadmin
- [ ] Repository cloned to /opt/dashboard
- [ ] .env.local created with your credentials
- [ ] `docker-compose ps` shows container "Up"
- [ ] `docker-compose logs` shows no errors
- [ ] Can access http://100.104.196.38:3001 in browser
- [ ] Docker containers widget displays containers
- [ ] Search functionality works
- [ ] No error messages in console

---

## 📝 Quick Reference

```bash
# View current logs
docker-compose logs -f

# Stop container
docker-compose down

# Restart container
docker-compose restart

# Rebuild and restart
docker-compose build --no-cache && docker-compose up -d

# Update from git
git pull origin main && docker-compose build && docker-compose up -d

# Check disk space
df -h

# Check docker stats
docker stats
```

---

## 🆘 Need More Help?

1. Check QUICKSTART.md for overview
2. Check DEPLOYMENT.md for detailed setup
3. Check MONITORING.md for troubleshooting
4. Check docker-compose logs for errors: `docker-compose logs dashboard`

---

**Still stuck?** Make sure:
- ✅ SSH works: `ssh soadmin@100.104.196.38 "docker --version"`
- ✅ Docker works: `ssh soadmin@100.104.196.38 "docker-compose --version"`
- ✅ Directory exists: `ssh soadmin@100.104.196.38 "ls -la /opt/dashboard"`
- ✅ .env.local exists: `ssh soadmin@100.104.196.38 "cat /opt/dashboard/.env.local | head -5"`
