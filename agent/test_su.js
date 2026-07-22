import { spawn } from 'child_process';

const child = spawn('su', ['-c', 'python3 -c "import sys; print(\'PYTHON READY\'); sys.stdout.flush(); print(\'ECHO:\', sys.stdin.read())"', 'root']);

child.stdout.on('data', d => console.log('OUT:', d.toString()));
child.stderr.on('data', d => console.log('ERR:', d.toString()));

child.stdin.write('caio8990\n');
setTimeout(() => {
  child.stdin.write('HELLO PYTHON\n');
  child.stdin.end();
}, 1000);
