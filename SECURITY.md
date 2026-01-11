# Security & Best Practices

## Credential Management

### ⚠️ Critical Security Rules

1. **Never commit `.env.local`** to Git
   - It contains passwords and API keys
   - Use `.env.example` for template only
   - Add to `.gitignore` (already configured)

2. **Rotate credentials regularly**
   - Change Synology password every 90 days
   - Rotate UniFi credentials quarterly
   - Update Grafana API keys if compromised

3. **Use strong passwords**
   - Minimum 16 characters
   - Mix of uppercase, lowercase, numbers, special characters
   - Unique per service

### Credential Storage

**Best Practice:** Use a secrets manager

#### Option 1: HashiCorp Vault
```bash
# Store credentials in Vault
vault kv put secret/dashboard/atlas \
  unifi_password="..." \
  synology_password="..."

# Load in container startup script
export UNIFI_PASSWORD=$(vault kv get -field=unifi_password secret/dashboard/atlas)
```

#### Option 2: AWS Secrets Manager
```bash
# Store and retrieve
aws secretsmanager get-secret-value --secret-id dashboard/credentials
```

#### Option 3: GitHub Actions Secrets (for automation)
```yaml
env:
  UNIFI_PASSWORD: ${{ secrets.UNIFI_PASSWORD }}
```

## Network Security

### Docker API Security

⚠️ **Current Setup**: Docker API exposed to internal network only

```bash
# Verify Docker API is not publicly exposed
curl http://100.104.196.38:2375/containers/json

# Should NOT be accessible from external networks
# If it is, restrict with firewall:
sudo ufw allow from 100.104.196.0/24 to any port 2375
sudo ufw deny from any to any port 2375
```

### HTTPS/SSL Configuration

**Recommended:** Use reverse proxy with SSL

```nginx
# Nginx example
server {
    listen 443 ssl http2;
    server_name dashboard.yourdomain.com;
    
    ssl_certificate /etc/ssl/certs/your_cert.crt;
    ssl_certificate_key /etc/ssl/private/your_key.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### VPN/Network Access

**Recommended Setup:**
1. Dashboard accessible only via VPN
2. Or restrict to specific IP ranges:

```bash
# UFW firewall rules
sudo ufw allow from 100.104.196.0/24 to any port 3001
sudo ufw deny from any to any port 3001
```

## Authentication & Authorization

### Basic Auth (Simple)

Add basic authentication with Nginx/Traefik:

```yaml
# Traefik example
labels:
  - "traefik.http.middlewares.auth.basicauth.users=admin:your_hashed_password"
  - "traefik.http.routers.dashboard.middlewares=auth"
```

Generate hashed password:
```bash
echo $(htpasswd -nB admin) | sed -r 's/:.*//'
# Use output in Traefik config
```

### OAuth2 (Advanced)

Using Oauth2-proxy:

```docker
# docker-compose.yml addition
oauth2-proxy:
  image: quay.io/oauth2-proxy/oauth2-proxy:v7.4.0
  environment:
    OAUTH2_PROXY_PROVIDER: github
    OAUTH2_PROXY_CLIENT_ID: your_client_id
    OAUTH2_PROXY_CLIENT_SECRET: your_client_secret
    OAUTH2_PROXY_COOKIE_SECRET: your_secret
  ports:
    - "4180:4180"
```

## API Security

### Rate Limiting

Add rate limiting to API endpoints:

```typescript
// src/app/api/containers/route.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});

export const GET = limiter(async (req) => {
  // ... existing code
});
```

### Input Validation

Always validate external inputs:

```typescript
// Validate environment variables
function validateEnv() {
  const required = ['DOCKER_HOST', 'UNIFI_HOST', 'SYNOLOGY_HOST'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }
}
```

### API Key Rotation

For Grafana API key:

```bash
# Generate new key in Grafana UI
# Update in .env.local
# Revoke old key in Grafana

# Script to automate
#!/bin/bash
NEW_KEY=$(curl -X POST https://grafana/api/auth/keys \
  -H "Authorization: Bearer $OLD_KEY" \
  -d '{"name": "dashboard", "role": "Viewer"}')

# Update .env.local
sed -i "s/GRAFANA_API_KEY=.*/GRAFANA_API_KEY=$NEW_KEY/" /opt/dashboard/.env.local
```

## Logging & Monitoring

### Enable Audit Logging

```bash
# Docker daemon audit log
echo '{"log-driver": "json-file"}' | sudo tee /etc/docker/daemon.json
sudo systemctl restart docker
```

### Monitor Access Logs

```bash
# View nginx/reverse proxy logs
tail -f /var/log/nginx/access.log | grep dashboard

# Monitor failed authentication attempts
grep "401\|403" /var/log/nginx/access.log
```

### Alert on Anomalies

```bash
# Example: Alert on excessive API errors
docker logs atlas-dashboard | grep -c "error" | awk '{if ($1 > 10) print "ALERT: High error rate"}'
```

## Vulnerability Management

### Scan for CVEs

```bash
# Scan Docker image
trivy image atlas-dashboard:latest

# Scan dependencies
npm audit

# Fix vulnerabilities
npm audit fix
```

### Keep Images Updated

```bash
# Update base image
docker-compose build --pull

# Update Node.js version regularly
# Edit Dockerfile to latest LTS version
```

### Monitor for Vulnerabilities

```bash
# GitHub Dependabot - enabled by default
# Review and merge dependabot PRs regularly

# Manual check
npm outdated
```

## Data Privacy

### GDPR/Data Protection

The dashboard:
- ✅ Does NOT store personal data
- ✅ Does NOT use cookies or tracking
- ✅ Does NOT collect user information
- ⚠️ Logs contain IP addresses

To anonymize logs:

```bash
# Redact IPs from logs
docker logs atlas-dashboard | sed 's/\([0-9]\{1,3\}\.\)\{3\}[0-9]\{1,3\}/[REDACTED]/g'
```

## Compliance Checklist

- [ ] All credentials use strong passwords
- [ ] .env.local is NOT committed to Git
- [ ] Docker API is not publicly exposed
- [ ] HTTPS/SSL configured for production
- [ ] Authentication layer in place
- [ ] Audit logs are enabled
- [ ] Dependencies are up-to-date
- [ ] Security scanning (trivy) runs regularly
- [ ] Access is restricted by firewall/VPN
- [ ] Backup strategy is documented
- [ ] Incident response plan is prepared
- [ ] Regular security reviews scheduled

## Incident Response

### If Credentials Are Compromised

1. **Immediately change passwords:**
   ```bash
   # Synology
   # UniFi
   # Any API keys
   ```

2. **Update in .env.local:**
   ```bash
   ssh soadmin@100.104.196.38
   nano /opt/dashboard/.env.local
   ```

3. **Restart container:**
   ```bash
   docker-compose restart dashboard
   ```

4. **Check logs for unauthorized access:**
   ```bash
   docker logs atlas-dashboard | grep error
   ```

5. **Review API call history** in Synology/UniFi

### If Container Is Compromised

1. **Isolate the container:**
   ```bash
   docker-compose down
   ```

2. **Rebuild from source:**
   ```bash
   cd /opt/dashboard
   git fetch origin
   git reset --hard origin/main
   docker-compose build --no-cache
   ```

3. **Verify integrity:**
   ```bash
   git log -1
   docker images atlas-dashboard
   ```

4. **Redeploy:**
   ```bash
   docker-compose up -d
   ```

### If Server Is Compromised

1. **Migrate to new server** (see MONITORING.md - Disaster Recovery)
2. **Rotate ALL credentials**
3. **Conduct security audit** of infrastructure
4. **Review access logs** from before incident

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)
