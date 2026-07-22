import { exec } from 'child_process';

export function runLinuxCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { shell: '/bin/bash' }, (error, stdout, stderr) => {
      if (error) {
        return resolve({ success: false, output: stderr || error.message });
      }
      resolve({ success: true, output: stdout });
    });
  });
}

export function handleLinuxAction(action) {
  switch (action) {
    case 'reiniciar':
      return runLinuxCommand('sudo reboot');
    case 'desligar':
      return runLinuxCommand('sudo shutdown -h now');
    case 'listar_processos':
      return runLinuxCommand('ps aux --sort=-%cpu | head -n 20');
    case 'ver_ip':
      return runLinuxCommand('ip a');
    case 'testar_conexao':
      return runLinuxCommand('ping -c 4 8.8.8.8');
    default:
      return { success: false, output: 'Ação não reconhecida no Linux' };
  }
}
