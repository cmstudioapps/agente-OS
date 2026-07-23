import { getCpuInfo } from './cpu.js';
import { getMemoryInfo } from './memory.js';
import { getDiskInfo } from './disk.js';
import { getNetworkInfo } from './network.js';
import { getProcesses } from './process.js';
import { getSystemInfo } from './system.js';

export async function getFullSystemStats() {
  const [cpuUsage, ramUsage, diskUsage, systemInfo, processes] = await Promise.all([
    getCpuInfo(),
    getMemoryInfo(),
    getDiskInfo(),
    getSystemInfo(),
    getProcesses()
  ]);

  return {
    cpu: cpuUsage,
    ram: ramUsage,
    disk: diskUsage,
    system: systemInfo.system,
    hostname: systemInfo.hostname,
    uptime: systemInfo.uptime,
    battery: systemInfo.battery,
    temperature: systemInfo.temperature,
    processes: processes
  };
}

export {
  getCpuInfo,
  getMemoryInfo,
  getDiskInfo,
  getNetworkInfo,
  getProcesses,
  getSystemInfo
};
