import screenshot from 'screenshot-desktop';
import os from 'os';
import { exec, spawn } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = util.promisify(exec);
let streamProcess = null;
const tempStreamPath = path.join(os.tmpdir(), 'agent_screen.jpg');

export async function startLinuxStream(sudoPass) {
  if (os.platform() !== 'linux' || !sudoPass || sudoPass === 'none') return;
  if (streamProcess) return;

  const cmd = `ffmpeg -device /dev/dri/card0 -f kmsgrab -i - -vf 'hwmap=derive_device=vaapi,scale_vaapi=format=nv12,hwdownload,format=nv12' -r 15 -update 1 -y ${tempStreamPath}`;
  streamProcess = spawn('su', ['-c', cmd, 'root']);
  streamProcess.stdin.write(sudoPass + '\n');
  
  streamProcess.stderr.on('data', (d) => {
    // ffmpeg joga tudo no stderr
  });
}

export function stopLinuxStream() {
  if (streamProcess) {
    streamProcess.kill('SIGINT');
    streamProcess = null;
  }
}

export async function captureScreenBase64() {
  try {
    if (os.platform() === 'linux') {
      try {
        const imgBuffer = await fs.readFile(tempStreamPath);
        return imgBuffer.toString('base64');
      } catch(e) {
        // Fallback para screenshot normal se o ffmpeg ainda não gravou o frame
        const tempPath = path.join(os.tmpdir(), 'agent_screen_fallback.jpg');
        await execAsync(`gnome-screenshot -f ${tempPath}`);
        const imgBuffer = await fs.readFile(tempPath);
        return imgBuffer.toString('base64');
      }
    } else {
      const imgBuffer = await screenshot({ format: 'jpg' });
      return imgBuffer.toString('base64');
    }
  } catch (error) {
    console.error('[Screen Capture Error]', error.message);
    return null;
  }
}
