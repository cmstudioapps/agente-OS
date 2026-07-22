import { app, BrowserWindow, ipcMain, desktopCapturer } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import * as storage from '../database/storage.js';
import { startServer } from '../core/server.js';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, '../../icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true,
    title: 'Agente OS',
    backgroundColor: '#0f172a'
  });

  mainWindow.loadFile(path.join(__dirname, '../../desktop/index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC do Renderer
ipcMain.handle('check-setup', async () => {
  const sudoPass = await storage.get('sudo_pass');
  const wppNumber = await storage.get('whatsapp_number');
  return { 
    sudoPass: sudoPass === 'none' ? '' : (sudoPass || ''),
    wppNumber: wppNumber === 'none' ? '' : (wppNumber || ''),
    isLinux: os.platform() === 'linux'
  };
});

ipcMain.handle('start-server', async (event, { sudoPass, wppNumber }) => {
  if (sudoPass) {
    await storage.set('sudo_pass', sudoPass);
  } else if (os.platform() === 'linux') {
    const existingSudo = await storage.get('sudo_pass');
    if (!existingSudo) await storage.set('sudo_pass', 'none');
  }

  if (wppNumber) {
    await storage.set('whatsapp_number', wppNumber);
  } else {
    const existingWpp = await storage.get('whatsapp_number');
    if (!existingWpp) await storage.set('whatsapp_number', 'none');
  }

  // Inicia o servidor Node
  const result = await startServer();
  return result; // Deve retornar { url, token }
});

// WebRTC Screen Capture handler para o Renderer
ipcMain.handle('get-desktop-sources', async () => {
  const sources = await desktopCapturer.getSources({ types: ['screen'] });
  return sources.map(s => ({ id: s.id, name: s.name }));
});
