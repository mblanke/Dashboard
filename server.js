const express = require('express');
const cors = require('cors');
const Docker = require('dockerode');
const axios = require('axios');
const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files in production
const frontendDistPath = path.join(__dirname, 'frontend', 'dist');
if (fs.existsSync(frontendDistPath)) {
  const frontendApp = express();
  frontendApp.use(express.static(frontendDistPath));
  frontendApp.get('/*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
  frontendApp.listen(FRONTEND_PORT, () => {
    console.log(`🎨 Frontend server running on http://localhost:${FRONTEND_PORT}`);
  });
}

// Initialize Docker connection
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Load config if exists
let config = {};
const configPath = path.join(__dirname, 'config.json');
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

// Docker endpoints
app.get('/api/docker/containers', async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    const detailedContainers = await Promise.all(
      containers.map(async (containerInfo) => {
        const container = docker.getContainer(containerInfo.Id);
        const stats = await container.stats({ stream: false }).catch(() => null);
        const inspect = await container.inspect().catch(() => null);
        
        return {
          id: containerInfo.Id,
          name: containerInfo.Names[0].replace('/', ''),
          image: containerInfo.Image,
          state: containerInfo.State,
          status: containerInfo.Status,
          ports: containerInfo.Ports,
          created: containerInfo.Created,
          cpuUsage: stats ? calculateCPUPercent(stats) : 0,
          memoryUsage: stats ? calculateMemoryUsage(stats) : { used: 0, limit: 0, percent: 0 },
          networkRx: stats ? stats.networks?.eth0?.rx_bytes || 0 : 0,
          networkTx: stats ? stats.networks?.eth0?.tx_bytes || 0 : 0,
          labels: inspect?.Config?.Labels || {},
        };
      })
    );
    
    res.json({ success: true, containers: detailedContainers });
  } catch (error) {
    console.error('Error fetching containers:', error.message);
    res.json({ success: false, containers: [], error: error.message });
  }
});

app.post('/api/docker/container/:id/:action', async (req, res) => {
  try {
    const { id, action } = req.params;
    const container = docker.getContainer(id);
    
    switch (action) {
      case 'start':
        await container.start();
        break;
      case 'stop':
        await container.stop();
        break;
      case 'restart':
        await container.restart();
        break;
      case 'pause':
        await container.pause();
        break;
      case 'unpause':
        await container.unpause();
        break;
      default:
        return res.json({ success: false, error: 'Invalid action' });
    }
    
    res.json({ success: true, message: `Container ${action}ed successfully` });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Synology endpoints
app.get('/api/synology/info', async (req, res) => {
  try {
    const { host, port = 5000, username, password } = config.synology || {};
    
    if (!host || !username || !password) {
      return res.json({ 
        success: false, 
        error: 'Synology not configured. Add config to config.json' 
      });
    }

    // Login to Synology
    const loginResponse = await axios.get(
      `http://${host}:${port}/webapi/auth.cgi`,
      {
        params: {
          api: 'SYNO.API.Auth',
          version: 3,
          method: 'login',
          account: username,
          passwd: password,
          session: 'FileStation',
          format: 'cookie'
        },
        timeout: 5000
      }
    ).catch(err => ({ data: { success: false } }));

    if (!loginResponse.data.success) {
      return res.json({ success: false, error: 'Failed to authenticate with Synology' });
    }

    const sid = loginResponse.data.data.sid;

    // Get system info
    const infoResponse = await axios.get(
      `http://${host}:${port}/webapi/entry.cgi`,
      {
        params: {
          api: 'SYNO.Core.System',
          version: 1,
          method: 'info',
          _sid: sid
        },
        timeout: 5000
      }
    ).catch(() => ({ data: { success: false } }));

    // Get storage info
    const storageResponse = await axios.get(
      `http://${host}:${port}/webapi/entry.cgi`,
      {
        params: {
          api: 'SYNO.Core.System.Utilization',
          version: 1,
          method: 'get',
          _sid: sid
        },
        timeout: 5000
      }
    ).catch(() => ({ data: { success: false } }));

    res.json({
      success: true,
      data: {
        system: infoResponse.data.data || {},
        utilization: storageResponse.data.data || {},
        host: host
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Unifi endpoints
app.get('/api/unifi/devices', async (req, res) => {
  try {
    const { host, username, password, port = 443 } = config.unifi || {};
    
    if (!host || !username || !password) {
      return res.json({ 
        success: false, 
        error: 'Unifi not configured. Add config to config.json' 
      });
    }

    // Create axios instance with cookie jar
    const api = axios.create({
      baseURL: `https://${host}:${port}`,
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
      timeout: 5000
    });

    // Login
    const loginResponse = await api.post('/api/auth/login', {
      username,
      password
    }).catch(err => ({ data: {} }));

    if (!loginResponse.data || loginResponse.status !== 200) {
      return res.json({ success: false, error: 'Failed to authenticate with Unifi' });
    }

    // Get devices
    const devicesResponse = await api.get('/proxy/network/api/s/default/stat/device')
      .catch(() => ({ data: {} }));

    // Get site stats
    const statsResponse = await api.get('/proxy/network/api/s/default/stat/health')
      .catch(() => ({ data: {} }));

    res.json({
      success: true,
      data: {
        devices: devicesResponse.data.data || [],
        health: statsResponse.data.data || [],
        host: host
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// System info endpoint
app.get('/api/system/info', async (req, res) => {
  try {
    const os = require('os');
    
    res.json({
      success: true,
      data: {
        hostname: os.hostname(),
        platform: os.platform(),
        uptime: os.uptime(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg()
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Config endpoint
app.get('/api/config', (req, res) => {
  // Return sanitized config (no passwords)
  const sanitized = {
    synology: config.synology ? { 
      host: config.synology.host, 
      port: config.synology.port,
      configured: true 
    } : { configured: false },
    unifi: config.unifi ? { 
      host: config.unifi.host, 
      port: config.unifi.port,
      configured: true 
    } : { configured: false }
  };
  
  res.json({ success: true, config: sanitized });
});

// Helper functions
function calculateCPUPercent(stats) {
  const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  const cpuPercent = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;
  return Math.round(cpuPercent * 100) / 100;
}

function calculateMemoryUsage(stats) {
  const used = stats.memory_stats.usage;
  const limit = stats.memory_stats.limit;
  const percent = (used / limit) * 100;
  return {
    used: Math.round(used / 1024 / 1024),
    limit: Math.round(limit / 1024 / 1024),
    percent: Math.round(percent * 100) / 100
  };
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Dashboard API server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}`);
});
