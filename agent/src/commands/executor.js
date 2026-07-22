import { runWindowsCommand, handleWindowsAction } from './windows.js';
import { runLinuxCommand, handleLinuxAction } from './linux.js';
import { killProcess } from './process_kill.js';
import { listDirectory } from './files.js';
import { moveMouse, clickMouse, typeText, scrollMouse, pressKey } from './mouse_keyboard.js';

const isWindows = process.platform === 'win32';

export async function executeCommand(command) {
  if (isWindows) {
    return await runWindowsCommand(command);
  } else {
    return await runLinuxCommand(command);
  }
}

export async function executeAction(action) {
  if (isWindows) {
    return await handleWindowsAction(action);
  } else {
    return await handleLinuxAction(action);
  }
}

export {
  killProcess,
  listDirectory,
  moveMouse,
  clickMouse,
  typeText,
  scrollMouse,
  pressKey
};
