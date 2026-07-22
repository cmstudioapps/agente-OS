import robot from '@jitsi/robotjs';
import os from 'os';
import { spawn } from 'child_process';
import path from 'path';

let waylandMouse = null;
const isLinux = os.platform() === 'linux';

export function initLinuxMouse(sudoPassword) {
  if (isLinux && !waylandMouse) {
    const scriptPath = path.join(process.cwd(), 'src', 'commands', 'wayland_mouse.py');
    waylandMouse = spawn('su', ['-c', `python3 "${scriptPath}"`, 'root']);
    
    // Envia a senha para o su
    waylandMouse.stdin.write(sudoPassword + '\n');
    
    waylandMouse.stdout.on('data', (data) => {
      console.log(`[Wayland Mouse] ${data}`);
    });
    waylandMouse.stderr.on('data', (data) => {
      console.error(`[Wayland Mouse Err] ${data}`);
    });
  }
}

robot.setMouseDelay(2);

export function moveMouse(dx, dy) {
  try {
    if (isLinux && waylandMouse) {
      waylandMouse.stdin.write(`MOVE ${Math.round(dx)} ${Math.round(dy)}\n`);
      return { success: true };
    } else {
      const mousePos = robot.getMousePos();
      robot.moveMouse(Math.round(mousePos.x + dx), Math.round(mousePos.y + dy));
      return { success: true };
    }
  } catch (err) {
    console.error('[Mouse Error]', err);
    return { success: false, error: err.message };
  }
}

export function clickMouse(button = 'left') {
  try {
    if (isLinux && waylandMouse) {
      waylandMouse.stdin.write(`CLICK ${button}\n`);
      return { success: true };
    } else {
      robot.mouseClick(button);
      return { success: true };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function typeText(text) {
  try {
    if (isLinux && waylandMouse) {
      waylandMouse.stdin.write(`TYPE ${text}\n`);
      return { success: true };
    } else {
      robot.typeString(text);
      return { success: true };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function scrollMouse(dy) {
  try {
    if (isLinux && waylandMouse) {
      waylandMouse.stdin.write(`SCROLL ${Math.round(dy)}\n`);
      return { success: true };
    } else {
      robot.scrollMouse(0, Math.round(dy));
      return { success: true };
    }
  } catch (err) {
    console.error('[Mouse Scroll Error]', err);
    return { success: false, error: err.message };
  }
}

export function pressKey(key) {
  try {
    if (isLinux && waylandMouse) {
      waylandMouse.stdin.write(`KEY ${key}\n`);
      return { success: true };
    } else {
      robot.keyTap(key);
      return { success: true };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}
