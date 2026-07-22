import si from 'systeminformation';

export async function getCpuInfo() {
  try {
    const load = await si.currentLoad();
    return Math.round(load.currentLoad);
  } catch (error) {
    console.error('Error getting CPU info:', error);
    return 0;
  }
}
