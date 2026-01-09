# Dashboard

A fun and flashy replacement dashboard for Heimdall and Homarr. Monitor all your Docker containers, Synology NAS, and Unifi network devices in one beautiful interface.

![Dashboard Screenshot](https://via.placeholder.com/800x400/1a1a2e/9d4edd?text=Dashboard+Screenshot)

## ✨ Features

- 🐳 **Docker Container Monitoring** - Real-time monitoring of all containers with CPU, memory, and network stats
- 💾 **Synology NAS Integration** - Monitor your Synology NAS health and storage
- 📡 **Unifi Network Integration** - Track all your Unifi network devices and clients
- 🎨 **Beautiful UI** - Modern, animated interface with gradient backgrounds and smooth transitions
- ⚡ **Real-time Updates** - Auto-refresh every 5 seconds to keep data current
- 🎮 **Container Controls** - Start, stop, restart, pause containers with one click
- 📊 **System Monitoring** - View host system resources and stats

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Docker (with socket access)
- Optional: Synology NAS, Unifi Controller

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mblanke/Dashboard.git
   cd Dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

3. **Configure integrations** (optional)
   ```bash
   cp config.example.json config.json
   # Edit config.json with your credentials
   ```

4. **Build the frontend**
   ```bash
   npm run build:frontend
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Access the dashboard**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001

## 🐳 Docker Deployment

The easiest way to run the dashboard is with Docker Compose:

```bash
# Create config file
cp config.example.json config.json
# Edit with your credentials

# Start with Docker Compose
docker-compose up -d
```

Access at http://localhost:3000

## ⚙️ Configuration

Create a `config.json` file in the root directory:

```json
{
  "synology": {
    "host": "192.168.1.100",
    "port": 5000,
    "username": "your-username",
    "password": "your-password"
  },
  "unifi": {
    "host": "192.168.1.1",
    "port": 443,
    "username": "your-username",
    "password": "your-password"
  }
}
```

**Note:** Both Synology and Unifi are optional. The dashboard will work with just Docker if you don't configure them.

## 🎨 Features in Detail

### Docker Container Monitoring

- View all containers (running, stopped, paused)
- Real-time CPU and memory usage with animated progress bars
- Network traffic monitoring (RX/TX)
- Container controls: Start, Stop, Restart, Pause, Unpause
- Port mappings and status information
- Beautiful state indicators with glowing effects

### Synology NAS Integration

- System information (model, firmware)
- CPU and memory utilization
- Storage capacity and usage
- Real-time health monitoring

### Unifi Network Integration

- All network devices overview
- Device status and uptime
- Connected clients count
- Network health status
- IP addresses and device models

## 🛠️ Development

### Development Mode

Run the frontend and backend separately for development:

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend dev server
npm run dev:frontend
```

The frontend dev server runs on http://localhost:5173 with hot reload.

### Tech Stack

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- Framer Motion (animations)
- Lucide React (icons)
- Axios

**Backend:**
- Node.js
- Express
- Dockerode (Docker API)
- Axios (HTTP client)

## 📋 API Endpoints

### Docker
- `GET /api/docker/containers` - List all containers with stats
- `POST /api/docker/container/:id/:action` - Control container (start/stop/restart/pause/unpause)

### Synology
- `GET /api/synology/info` - Get NAS information and stats

### Unifi
- `GET /api/unifi/devices` - Get network devices and health status

### System
- `GET /api/system/info` - Get host system information
- `GET /api/config` - Get configuration status

## 🔒 Security Notes

- The dashboard requires access to the Docker socket (`/var/run/docker.sock`)
- Store credentials in `config.json` (never commit this file)
- For production use, consider:
  - Using environment variables for credentials
  - Running behind a reverse proxy with authentication
  - Using HTTPS for Synology and Unifi connections
  - Limiting Docker socket permissions

## 🎯 Roadmap

- [ ] Custom service bookmarks
- [ ] Dashboard themes
- [ ] Webhook notifications
- [ ] Multiple server support
- [ ] Mobile responsive improvements
- [ ] Search and filter containers
- [ ] Container logs viewer
- [ ] System notifications

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

Created as a replacement for Heimdall and Homarr with a focus on:
- Beautiful, modern UI
- Easy setup and configuration
- Comprehensive monitoring capabilities
- Fun and flashy design

---

**Built with ❤️ for the self-hosted community**

