# Network Troubleshooting - Cannot Access GitHub

## Problem
```
fatal: unable to access 'https://github.com/mblanke/Dashboard.git/': Could not resolve host: github.com
```

This means the server cannot reach GitHub (no internet or DNS issue).

---

## Solutions (Try in order)

### Solution 1: Check DNS on the Server

SSH into the server and test:

```bash
# Test DNS resolution
nslookup github.com
# or
dig github.com

# Test internet connection
ping 8.8.8.8
ping google.com
```

**If these fail:** DNS or internet is down. Contact your network admin.

---

### Solution 2: Copy Code Manually (Recommended if no internet)

#### From your Windows computer:

```powershell
# Download the repository
git clone https://github.com/mblanke/Dashboard.git C:\Dashboard

# Upload to Atlas server
scp -r C:\Dashboard soadmin@100.104.196.38:/opt/dashboard

# Or use WinSCP for GUI
# https://winscp.net/
```

#### Then on Atlas server:

```bash
ssh soadmin@100.104.196.38

cd /opt/dashboard

# Verify files are there
ls -la

# Create .env.local
cp .env.example .env.local
nano .env.local

# Deploy
docker-compose build
docker-compose up -d
```

---

### Solution 3: Use SSH Git URL (if HTTPS blocked)

Try using SSH instead of HTTPS:

```bash
# Instead of:
git clone https://github.com/mblanke/Dashboard.git

# Use:
git clone git@github.com:mblanke/Dashboard.git
```

**Requires:** SSH key configured on GitHub account

---

### Solution 4: Use Local Mirror

If the server is air-gapped or offline:

```bash
# On your Windows machine, download the code
git clone https://github.com/mblanke/Dashboard.git

# Copy it to a USB drive or shared folder
# Then transfer to the server manually
```

---

## Recommended: Manual Copy (Fastest)

### On Windows:

```powershell
# 1. Create and enter directory
mkdir -p C:\Dashboard
cd C:\Dashboard

# 2. Clone the repo (you have internet on Windows)
git clone https://github.com/mblanke/Dashboard.git .

# 3. Copy to server
scp -r . soadmin@100.104.196.38:/opt/dashboard
```

### On Atlas server:

```bash
ssh soadmin@100.104.196.38

# 1. Enter directory
cd /opt/dashboard

# 2. Verify files
ls -la

# 3. Configure
cp .env.example .env.local
nano .env.local
# Add your credentials

# 4. Deploy
docker-compose build
docker-compose up -d
```

---

## Check if Server Has Internet

```bash
ssh soadmin@100.104.196.38

# Test internet
ping -c 4 8.8.8.8

# Check DNS
nslookup github.com

# Check routing
traceroute github.com

# Check gateway
route -n
```

If all these fail, the server has no internet access.

---

## If Internet IS Available

If the ping/nslookup tests work but git clone fails:

```bash
# Try HTTPS with verbose output
git clone --verbose https://github.com/mblanke/Dashboard.git

# Or try HTTP (less secure)
git clone http://github.com/mblanke/Dashboard.git

# Or try SSH (requires SSH key setup)
git clone git@github.com:mblanke/Dashboard.git
```

Check for firewall rules:

```bash
# Test port 443 (HTTPS)
curl -v https://github.com

# Test port 22 (SSH)
ssh -v git@github.com
```

---

## Recommendation

**Since you got this error, the server likely has no internet.** 

**Best option:** Use manual copy with `scp`:

```powershell
# Windows - Clone locally first
git clone https://github.com/mblanke/Dashboard.git C:\Dashboard
cd C:\Dashboard

# Copy to server
scp -r . soadmin@100.104.196.38:/opt/dashboard

# Or use WinSCP (GUI): https://winscp.net/
```

---

## Quick Checklist

- [ ] Check if Atlas server has internet: `ping 8.8.8.8`
- [ ] Check DNS: `nslookup github.com`
- [ ] If both fail → server is offline, use manual copy method
- [ ] If DNS works → might be firewall blocking GitHub HTTPS
- [ ] Try SSH git clone instead of HTTPS
- [ ] Last resort → copy files with SCP/WinSCP

---

**Let me know:**
1. Can you run `ping 8.8.8.8` on the server?
2. Do you have SCP or WinSCP available?
3. Want to use manual copy method?
