import si from 'systeminformation';

export async function getMemoryInfo() {
  try {
    const mem = await si.mem();
    const usedPercent = (mem.active / mem.total) * 100;
    return Math.round(usedPercent);
  } catch (error) {
    console.error('Error getting memory info:', error);
    return 0;
  }
}
