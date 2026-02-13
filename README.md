# Atlas Dashboard

A modern, self-hosted dashboard for monitoring and managing your entire infrastructure. Displays Docker containers, UniFi network devices, Synology storage, and Grafana dashboards in one beautiful interface.

## Features

✨ **Core Capabilities:**
- 🐳 **Docker Container Management** - Real-time container status grouped by category
- 🌐 **UniFi Network Monitoring** - Connected devices, clients, and status
- 💾 **Synology Storage** - Volume usage and capacity monitoring
- 📊 **Grafana Integration** - Embedded dashboard panels for detailed metrics
- 🔍 **Search & Filter** - Quickly find containers by name
- 🔄 **Auto-Refresh** - Updates every 10 seconds
- 📱 **Responsive Design** - Works on desktop and mobile
- 🎨 **Dark Theme** - Easy on the eyes

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Access to:
  - Docker daemon (API)
  - UniFi Controller
  - Synology NAS
  - Grafana instance

### Deploy in 5 Minutes

```bash
# 1. SSH into your Atlas server
ssh soadmin@100.104.196.38

# 2. Clone and configure
mkdir -p /opt/dashboard && cd /opt/dashboard
git clone https://github.com/mblanke/Dashboard.git .
cp .env.example .env.local
nano .env.local  # Edit with your credentials

# 3. Deploy
docker-compose build
docker-compose up -d

# 4. Access
# Open: http://100.104.196.38:3001
```

**For detailed instructions, see [QUICKSTART.md](QUICKSTART.md)**

## Configuration

Create `.env.local` with your environment variables:

```env
# Docker API
DOCKER_HOST=http://100.104.196.38:2375

# UniFi Controller
UNIFI_HOST=100.104.196.38
UNIFI_PORT=8443
UNIFI_USERNAME=admin
UNIFI_PASSWORD=your_password

# Synology NAS
SYNOLOGY_HOST=100.104.196.38
SYNOLOGY_PORT=5001
SYNOLOGY_USERNAME=admin
SYNOLOGY_PASSWORD=your_password

# Grafana
NEXT_PUBLIC_GRAFANA_HOST=http://100.104.196.38:3000
GRAFANA_API_KEY=your_api_key

# API
NEXT_PUBLIC_API_BASE_URL=http://100.104.196.38:3001
```

See [.env.example](.env.example) for all available options.

## Docker Deployment

### Using Docker Compose

```bash
docker-compose up -d
```

### Using Docker CLI

```bash
docker build -t atlas-dashboard .
docker run -d \
  --name atlas-dashboard \
  -p 3001:3000 \
  -e DOCKER_HOST=http://100.104.196.38:2375 \
  -e UNIFI_HOST=100.104.196.38 \
  -e UNIFI_USERNAME=admin \
  -e UNIFI_PASSWORD=your_password \
  -e SYNOLOGY_HOST=100.104.196.38 \
  -e SYNOLOGY_USERNAME=admin \
  -e SYNOLOGY_PASSWORD=your_password \
  atlas-dashboard
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── containers/    # Docker containers endpoint
│   │   ├── synology/      # Synology storage endpoint
│   │   └── unifi/         # UniFi devices endpoint
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main dashboard page
│   └── globals.css        # Global styles
├── components/
│   ├── ContainerGroup.tsx # Container display component
│   ├── GrafanaWidget.tsx  # Grafana panel embedding
│   ├── SearchBar.tsx      # Search functionality
│   ├── SynologyWidget.tsx # Storage display
│   └── UnifiWidget.tsx    # Network device display
└── types/
    └── index.ts           # TypeScript type definitions
```

## API Endpoints

| Endpoint | Purpose | Returns |
|----------|---------|---------|
| `GET /api/containers` | Docker containers | Array of running containers |
| `GET /api/unifi` | UniFi devices | Array of network devices |
| `GET /api/synology` | Synology storage | Array of volumes |

## Development

### Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

### Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **API**: Next.js API Routes, Axios
- **Icons**: Lucide React
- **Containerization**: Docker, Docker Compose
- **Runtime**: Node.js 20

## Documentation

- [QUICKSTART.md](QUICKSTART.md) - Get up and running in minutes
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide
- [CHECKLIST.md](CHECKLIST.md) - Pre-deployment verification checklist

## Troubleshooting

### Containers not loading?
```bash
curl http://100.104.196.38:2375/containers/json
```

### UniFi widget showing error?
- Verify credentials in `.env.local`
- Check UniFi Controller is accessible on port 8443

### Synology not connecting?
- Verify NAS is accessible
- Check credentials have proper permissions
- Note: Uses HTTPS with self-signed certificates

### View logs
```bash
docker-compose logs -f dashboard
```

## Security Notes

⚠️ **Important:**
- `.env.local` contains sensitive credentials - never commit to git
- UniFi and Synology credentials are transmitted in environment variables
- Ensure Docker API is only accessible from trusted networks
- Consider using reverse proxy with authentication in production

## License

MIT

## Support

For issues and questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review deployment logs: `docker-compose logs`
3. Verify all external services are accessible

## Contributing

Pull requests welcome! Please ensure code follows the existing style and all features work properly before submitting.
