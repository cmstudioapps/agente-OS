import si from 'systeminformation';

export async function getProcesses() {
  try {
    const processes = await si.processes();
    
    // Mapeia processos e define a flag isSystem ao invés de ignorá-los
    const mappedList = processes.list.map(p => {
      const user = (p.user || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      let isSystem = false;
      
      // Identifica processos de sistema baseados em heurísticas
      if (user === 'root' || user === 'system' || user.includes('service')) {
        isSystem = true;
      }
      
      const protectedNames = ['system idle process', 'system', 'smss.exe', 'csrss.exe', 'wininit.exe', 'services.exe', 'lsass.exe', 'svchost.exe', 'explorer.exe', 'systemd', 'init', 'kthreadd', 'conhost.exe', 'daemon'];
      if (protectedNames.some(pn => name.includes(pn))) {
        isSystem = true;
      }
      
      return {
        pid: p.pid,
        name: p.name,
        cpu: Math.round(p.cpu),
        mem: Math.round(p.mem),
        isSystem: isSystem
      };
    });

    // Ordena pelo maior uso de CPU e retorna os 100 primeiros
    return mappedList.sort((a, b) => b.cpu - a.cpu).slice(0, 100);
  } catch (error) {
    console.error('Error getting processes:', error);
    return [];
  }
}
