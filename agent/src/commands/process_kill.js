import { runWindowsCommand } from './windows.js';
import { runLinuxCommand } from './linux.js';

const isWindows = process.platform === 'win32';

// Processos críticos de sistema que não devem ser encerrados
const PROTECTED_PROCESSES = [
  'system idle process', 'system', 'smss.exe', 'csrss.exe', 
  'wininit.exe', 'services.exe', 'lsass.exe', 'svchost.exe', 
  'explorer.exe', 'systemd', 'init', 'kthreadd'
];

export async function killProcess(pid, name = '') {
  try {
    const parsedPid = parseInt(pid);
    if (!parsedPid || isNaN(parsedPid)) {
      return { success: false, output: 'PID inválido' };
    }

    // Proteção: Não matar o próprio agente
    if (parsedPid === process.pid) {
      return { success: false, output: 'Ação bloqueada: Não é permitido encerrar o próprio Agente.' };
    }

    // Proteção: Processos críticos pelo nome
    if (name && PROTECTED_PROCESSES.includes(name.toLowerCase())) {
      return { success: false, output: `Ação bloqueada: O processo '${name}' é protegido.` };
    }

    if (isWindows) {
      return await runWindowsCommand(`Stop-Process -Id ${parsedPid} -Force`);
    } else {
      return await runLinuxCommand(`kill -9 ${parsedPid}`);
    }
  } catch (error) {
    return { success: false, output: error.message };
  }
}
