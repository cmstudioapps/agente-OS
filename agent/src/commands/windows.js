import { exec } from 'child_process';

export function runWindowsCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { shell: 'powershell.exe' }, (error, stdout, stderr) => {
      if (error) {
        return resolve({ success: false, output: stderr || error.message });
      }
      resolve({ success: true, output: stdout });
    });
  });
}

export function handleWindowsAction(action) {
  switch (action) {
    case 'reiniciar':
      return runWindowsCommand('Restart-Computer -Force');
    case 'desligar':
      return runWindowsCommand('Stop-Computer -Force');
    case 'listar_processos':
      return runWindowsCommand('Get-Process | Select-Object -Property Id, ProcessName, CPU | ConvertTo-Json');
    case 'ver_ip':
      return runWindowsCommand('ipconfig');
    case 'testar_conexao':
      return runWindowsCommand('ping 8.8.8.8');
    default:
      return { success: false, output: 'Ação não reconhecida no Windows' };
  }
}
