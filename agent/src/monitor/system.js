import si from 'systeminformation';
import os from 'os';

export async function getSystemInfo() {
  try {
    const osInfo = await si.osInfo();
    const uptime = os.uptime();
    const battery = await si.battery();
    const temp = await si.cpuTemperature();
    
    return {
      system: osInfo.platform,
      arch: osInfo.arch,
      hostname: osInfo.hostname,
      uptime: uptime,
      battery: {
        hasBattery: battery.hasBattery,
        percent: battery.percent,
        isCharging: battery.isCharging,
        acConnected: battery.acConnected
      },
      temperature: temp.main
    };
  } catch (error) {
    console.error('Error getting system info:', error);
    return {};
  }
}
