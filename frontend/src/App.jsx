import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Server, 
  HardDrive, 
  Wifi, 
  Play, 
  Square, 
  RotateCw,
  Pause,
  Container,
  Network,
  Cpu,
  MemoryStick,
  Database,
  Router,
  AlertCircle
} from 'lucide-react';
import './App.css';

const API_URL = 'http://localhost:3001/api';

function App() {
  const [containers, setContainers] = useState([]);
  const [synologyInfo, setSynologyInfo] = useState(null);
  const [unifiInfo, setUnifiInfo] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('docker');

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      const [dockerRes, synologyRes, unifiRes, systemRes] = await Promise.all([
        fetch(`${API_URL}/docker/containers`).then(r => r.json()).catch(() => ({ success: false })),
        fetch(`${API_URL}/synology/info`).then(r => r.json()).catch(() => ({ success: false })),
        fetch(`${API_URL}/unifi/devices`).then(r => r.json()).catch(() => ({ success: false })),
        fetch(`${API_URL}/system/info`).then(r => r.json()).catch(() => ({ success: false }))
      ]);

      if (dockerRes.success) setContainers(dockerRes.containers);
      if (synologyRes.success) setSynologyInfo(synologyRes.data);
      if (unifiRes.success) setUnifiInfo(unifiRes.data);
      if (systemRes.success) setSystemInfo(systemRes.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleContainerAction = async (containerId, action) => {
    try {
      const response = await fetch(`${API_URL}/docker/container/${containerId}/${action}`, {
        method: 'POST'
      });
      const result = await response.json();
      if (result.success) {
        setTimeout(fetchAllData, 1000);
      }
    } catch (error) {
      console.error('Error performing action:', error);
    }
  };

  const getStateColor = (state) => {
    switch (state) {
      case 'running': return 'bg-green-500';
      case 'exited': return 'bg-red-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStateGlow = (state) => {
    switch (state) {
      case 'running': return 'shadow-green-500/50';
      case 'exited': return 'shadow-red-500/50';
      case 'paused': return 'shadow-yellow-500/50';
      default: return 'shadow-gray-500/50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-purple-400"
        >
          <Activity size={64} />
        </motion.div>
      </div>
    );
  }

  const runningContainers = containers.filter(c => c.state === 'running').length;
  const totalContainers = containers.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-purple-400"
            >
              <Activity size={48} />
            </motion.div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-400">Container & Infrastructure Monitor</p>
            </div>
          </div>
          
          {systemInfo && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20"
            >
              <div className="text-sm text-gray-400">System</div>
              <div className="text-2xl font-bold">{systemInfo.hostname}</div>
              <div className="text-xs text-gray-500">
                CPU: {systemInfo.cpus} cores | 
                RAM: {Math.round((systemInfo.totalMemory - systemInfo.freeMemory) / 1024 / 1024 / 1024)}GB / 
                {Math.round(systemInfo.totalMemory / 1024 / 1024 / 1024)}GB
              </div>
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 shadow-xl shadow-purple-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Docker Containers</p>
              <p className="text-3xl font-bold">{runningContainers}/{totalContainers}</p>
              <p className="text-green-400 text-sm">Running</p>
            </div>
            <Container size={48} className="text-purple-400" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 shadow-xl shadow-blue-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Synology NAS</p>
              <p className="text-3xl font-bold">{synologyInfo ? '✓' : '✗'}</p>
              <p className={`${synologyInfo ? 'text-green-400' : 'text-red-400'} text-sm`}>
                {synologyInfo ? 'Connected' : 'Not Configured'}
              </p>
            </div>
            <Database size={48} className="text-blue-400" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-cyan-600/20 to-cyan-900/20 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/30 shadow-xl shadow-cyan-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Unifi Network</p>
              <p className="text-3xl font-bold">{unifiInfo?.data?.devices?.length || 0}</p>
              <p className={`${unifiInfo ? 'text-green-400' : 'text-red-400'} text-sm`}>
                {unifiInfo ? 'Devices' : 'Not Configured'}
              </p>
            </div>
            <Router size={48} className="text-cyan-400" />
          </div>
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['docker', 'synology', 'unifi'].map((tab) => (
          <motion.button
            key={tab}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === tab
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'docker' && (
          <motion.div
            key="docker"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {containers.map((container, index) => (
              <motion.div
                key={container.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-2xl ${getStateGlow(container.state)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <motion.div
                        animate={container.state === 'running' ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`w-3 h-3 rounded-full ${getStateColor(container.state)}`}
                      />
                      <h3 className="font-bold text-lg">{container.name}</h3>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{container.image}</p>
                    <p className="text-xs text-gray-500">{container.status}</p>
                  </div>
                </div>

                {container.state === 'running' && (
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Cpu size={16} className="text-purple-400" />
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(container.cpuUsage, 100)}%` }}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                        />
                      </div>
                      <span className="text-xs text-gray-400">{container.cpuUsage.toFixed(1)}%</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <MemoryStick size={16} className="text-blue-400" />
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(container.memoryUsage.percent, 100)}%` }}
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                        />
                      </div>
                      <span className="text-xs text-gray-400">
                        {container.memoryUsage.used}MB
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Network size={14} className="text-green-400" />
                      <span>↓ {(container.networkRx / 1024 / 1024).toFixed(2)}MB</span>
                      <span>↑ {(container.networkTx / 1024 / 1024).toFixed(2)}MB</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {container.state === 'running' ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleContainerAction(container.id, 'pause')}
                        className="flex-1 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/50 text-yellow-400 rounded-lg py-2 px-3 flex items-center justify-center gap-2 transition-all"
                      >
                        <Pause size={16} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleContainerAction(container.id, 'restart')}
                        className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/50 text-blue-400 rounded-lg py-2 px-3 flex items-center justify-center gap-2 transition-all"
                      >
                        <RotateCw size={16} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleContainerAction(container.id, 'stop')}
                        className="flex-1 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 rounded-lg py-2 px-3 flex items-center justify-center gap-2 transition-all"
                      >
                        <Square size={16} />
                      </motion.button>
                    </>
                  ) : container.state === 'paused' ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleContainerAction(container.id, 'unpause')}
                      className="w-full bg-green-600/20 hover:bg-green-600/30 border border-green-600/50 text-green-400 rounded-lg py-2 px-3 flex items-center justify-center gap-2 transition-all"
                    >
                      <Play size={16} />
                      Unpause
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleContainerAction(container.id, 'start')}
                      className="w-full bg-green-600/20 hover:bg-green-600/30 border border-green-600/50 text-green-400 rounded-lg py-2 px-3 flex items-center justify-center gap-2 transition-all"
                    >
                      <Play size={16} />
                      Start
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'synology' && (
          <motion.div
            key="synology"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {synologyInfo ? (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-blue-500/30 shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <Database size={48} className="text-blue-400" />
                  <div>
                    <h2 className="text-2xl font-bold">Synology NAS</h2>
                    <p className="text-gray-400">{synologyInfo.host}</p>
                  </div>
                </div>
                
                {synologyInfo.system && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Model</p>
                      <p className="text-xl font-bold">{synologyInfo.system.model || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Firmware</p>
                      <p className="text-xl font-bold">{synologyInfo.system.firmware_ver || 'N/A'}</p>
                    </div>
                  </div>
                )}
                
                {synologyInfo.utilization && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">System Utilization</h3>
                    <div className="space-y-3">
                      {synologyInfo.utilization.cpu && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>CPU Usage</span>
                            <span>{synologyInfo.utilization.cpu.user_load || 0}%</span>
                          </div>
                          <div className="bg-gray-700 rounded-full h-3">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${synologyInfo.utilization.cpu.user_load || 0}%` }}
                              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full"
                            />
                          </div>
                        </div>
                      )}
                      
                      {synologyInfo.utilization.memory && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Memory Usage</span>
                            <span>{Math.round((synologyInfo.utilization.memory.real_usage || 0))}%</span>
                          </div>
                          <div className="bg-gray-700 rounded-full h-3">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${synologyInfo.utilization.memory.real_usage || 0}%` }}
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-12 border border-yellow-500/30 text-center"
              >
                <AlertCircle size={64} className="text-yellow-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Synology Not Configured</h3>
                <p className="text-gray-400 mb-4">
                  Add your Synology NAS credentials to config.json to enable monitoring
                </p>
                <pre className="bg-gray-900/50 rounded-lg p-4 text-left text-sm text-gray-300 overflow-x-auto">
{`{
  "synology": {
    "host": "192.168.1.100",
    "port": 5000,
    "username": "your-username",
    "password": "your-password"
  }
}`}
                </pre>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'unifi' && (
          <motion.div
            key="unifi"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {unifiInfo ? (
              <div>
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-cyan-500/30 shadow-2xl mb-6">
                  <div className="flex items-center gap-4 mb-6">
                    <Router size={48} className="text-cyan-400" />
                    <div>
                      <h2 className="text-2xl font-bold">Unifi Network</h2>
                      <p className="text-gray-400">{unifiInfo.host}</p>
                    </div>
                  </div>
                  
                  {unifiInfo.data?.health && unifiInfo.data.health.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {unifiInfo.data.health.map((health, idx) => (
                        <div key={idx} className="bg-gray-700/30 rounded-lg p-4">
                          <p className="text-gray-400 text-sm capitalize">{health.subsystem}</p>
                          <p className={`text-xl font-bold ${health.status === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
                            {health.status?.toUpperCase()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {unifiInfo.data?.devices && unifiInfo.data.devices.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {unifiInfo.data.devices.map((device, index) => (
                      <motion.div
                        key={device._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-xl"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <motion.div
                            animate={device.state === 1 ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 2, repeat: Infinity }}
                            className={`w-3 h-3 rounded-full ${device.state === 1 ? 'bg-green-500' : 'bg-red-500'}`}
                          />
                          <div className="flex-1">
                            <h3 className="font-bold">{device.name || device.model}</h3>
                            <p className="text-xs text-gray-400">{device.model}</p>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">IP Address</span>
                            <span className="font-mono">{device.ip}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Uptime</span>
                            <span>{Math.floor((device.uptime || 0) / 86400)}d {Math.floor(((device.uptime || 0) % 86400) / 3600)}h</span>
                          </div>
                          {device.num_sta !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Clients</span>
                              <span className="text-cyan-400 font-bold">{device.num_sta}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-12 border border-yellow-500/30 text-center"
              >
                <AlertCircle size={64} className="text-yellow-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Unifi Not Configured</h3>
                <p className="text-gray-400 mb-4">
                  Add your Unifi Controller credentials to config.json to enable monitoring
                </p>
                <pre className="bg-gray-900/50 rounded-lg p-4 text-left text-sm text-gray-300 overflow-x-auto">
{`{
  "unifi": {
    "host": "192.168.1.1",
    "port": 443,
    "username": "your-username",
    "password": "your-password"
  }
}`}
                </pre>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
