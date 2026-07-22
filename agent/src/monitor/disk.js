import si from 'systeminformation';

export async function getDiskInfo() {
  try {
    const fsSize = await si.fsSize();
    if (fsSize.length > 0) {
      return Math.round(fsSize[0].use);
    }
    return 0;
  } catch (error) {
    console.error('Error getting disk info:', error);
    return 0;
  }
}
