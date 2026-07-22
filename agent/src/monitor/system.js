import si from 'systeminformation';
import os from 'os';

export async function getSystemInfo() {
  try {
    const osInfo = await si.osInfo();
    const uptime = os.uptime();
    
    return {
      system: osInfo.platform,
      arch: osInfo.arch,
      hostname: osInfo.hostname,
      uptime: uptime
    };
  } catch (error) {
    console.error('Error getting system info:', error);
    return {};
  }
}
