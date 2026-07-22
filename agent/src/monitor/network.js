import si from 'systeminformation';

export async function getNetworkInfo() {
  try {
    const defaultIf = await si.networkInterfaceDefault();
    const netStats = await si.networkStats(defaultIf);
    
    if (netStats && netStats.length > 0) {
      return {
        interface: netStats[0].iface,
        rx_sec: netStats[0].rx_sec,
        tx_sec: netStats[0].tx_sec
      };
    }
    return { interface: '', rx_sec: 0, tx_sec: 0 };
  } catch (error) {
    console.error('Error getting network info:', error);
    return { interface: '', rx_sec: 0, tx_sec: 0 };
  }
}
