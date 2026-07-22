import express from 'express';
import http from 'http';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import os from 'os';
import * as config from './config.js';
import * as websocket from './websocket.js';
import * as tunnel from '../tunnel/tunnel.js';
import * as storage from '../database/storage.js';
import * as security from './security.js';
import * as whatsapp from './whatsapp.js';
import { initLinuxMouse } from '../commands/mouse_keyboard.js';

const app = express();
app.use(express.json());

// Serve os arquivos do hospedeiro webRTC
app.use('/public', express.static(path.join(process.cwd(), 'public')));

const server = http.createServer(app);

// Configuração do WebSocket
websocket.setupWebSocket(server);

// Rotas básicas HTTP (opcional para comandos simples)
app.post('/api/auth', async (req, res) => {
  const { token } = req.body;
  const isValid = await security.verifyToken(token);
  if (isValid) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

app.get('/api/download', async (req, res) => {
  const { path: filePath, token } = req.query;
  const isValid = await security.verifyToken(token);
  if (!isValid) return res.status(401).send('Unauthorized');
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }
  res.download(filePath, (err) => {
    if (err) {
      console.error(`[Download Erro] Não foi possível baixar ${filePath}:`, err.message);
      if (!res.headersSent) {
        res.status(500).send('Erro ao baixar arquivo');
      }
    }
  });
});

const storageConfig = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = req.query.path || process.cwd();
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storageConfig });

app.post('/api/upload', async (req, res, next) => {
  const token = req.query.token;
  const isValid = await security.verifyToken(token);
  if (!isValid) return res.status(401).json({ success: false, error: 'Unauthorized' });
  next();
}, upload.single('file'), (req, res) => {
  res.json({ success: true, message: 'File uploaded successfully' });
});

export async function startServer() {
  // Configuração inicial da senha se não existir ou se for o token longo antigo
  let token = await storage.get('auth_token');
  if (!token || token.length > 6) {
    token = security.generateToken();
    await storage.set('auth_token', token);
    console.log('--- NOVA SENHA DE ACESSO GERADA ---');
  } else {
    console.log('--- SENHA DE ACESSO ---');
  }
  console.log(`Senha: ${token}`);
  console.log('-----------------------------------');

  let wppNumber = await storage.get('whatsapp_number');
  if (wppNumber && wppNumber !== 'none') {
    whatsapp.initWhatsApp();
  }

  // Linux Sudo (Mouse Virtual)
  if (os.platform() === 'linux') {
    let sudoPass = await storage.get('sudo_pass');
    if (sudoPass && sudoPass !== 'none') {
      initLinuxMouse(sudoPass);
    }
  }

  return new Promise((resolve) => {
    server.listen(config.PORT, async () => {
      console.log(`Agent local rodando na porta ${config.PORT}`);
      let url = `http://localhost:${config.PORT}`;
      
      if (config.TUNNEL_ENABLED) {
        try {
          const t = await tunnel.createTunnel(config.PORT);
          url = t.url;
          if (wppNumber && wppNumber !== 'none') {
            whatsapp.enviarCredenciais(wppNumber, t.url, token);
          }
        } catch (err) {
          console.error('[Tunnel Erro]', err.message);
        }
      }
      
      resolve({ url, token });
    });
  });
}
