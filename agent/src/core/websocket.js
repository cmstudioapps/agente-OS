import WebSocket, { WebSocketServer } from 'ws';
import * as monitor from '../monitor/index.js';
import * as executor from '../commands/executor.js';
import * as security from './security.js';
import * as storage from '../database/storage.js';
import { captureScreenBase64, startLinuxStream, stopLinuxStream } from '../commands/screen.js';

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server });

  let clientIdCounter = 1;

  wss.on('connection', (ws) => {
    ws.id = clientIdCounter++;
    let isAuthenticated = false;
    let monitorInterval = null;
    let streamInterval = null;
    ws.role = 'mobile'; // mobile ou host

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);

        // Autenticação
        if (data.type === 'auth') {
          console.log('[WebSocket] Tentativa de autenticação...');
          isAuthenticated = await security.verifyToken(data.token);
          
          if (data.role === 'host') ws.role = 'host';

          ws.send(JSON.stringify({ type: 'auth_result', success: isAuthenticated }));
          
          if (isAuthenticated && ws.role !== 'host') {
            console.log(`[WebSocket] Mobile (ID: ${ws.id}) autenticado!`);
            monitorInterval = setInterval(async () => {
              try {
                const stats = await monitor.getFullSystemStats();
                ws.send(JSON.stringify({ type: 'monitor', data: stats }));
              } catch (err) {
                console.error('[Monitor Erro]', err.message);
              }
            }, 2000);
          } else if (isAuthenticated && ws.role === 'host') {
            console.log(`[WebSocket] Host autenticado com sucesso!`);
          } else {
            console.log('[WebSocket] Falha na autenticação.');
          }
          return;
        }

        if (!isAuthenticated) return;

        // Comandos normais
        if (data.type === 'action') {
          console.log(`[Ação] Comando recebido: ${data.action}`);
          const result = await executor.executeAction(data.action);
          ws.send(JSON.stringify({ type: 'action_result', action: data.action, ...result }));
        } else if (data.type === 'terminal_cmd') {
          const output = await executor.runTerminal(data.cmd);
          ws.send(JSON.stringify({ type: 'terminal_output', output }));
        } else if (data.type === 'list_processes') {
          const procs = await executor.listProcesses();
          ws.send(JSON.stringify({ type: 'process_list', processes: procs }));
        } else if (data.type === 'kill_process') {
          const result = await executor.killProcess(data.pid, data.name || '');
          ws.send(JSON.stringify({ type: 'kill_result', pid: data.pid, ...result }));
        } else if (data.type === 'mouse_move') {
          executor.moveMouse(data.dx, data.dy);
        } else if (data.type === 'mouse_click') {
          executor.clickMouse(data.button);
        } else if (data.type === 'mouse_scroll') {
          executor.scrollMouse(data.dy);
        } else if (data.type === 'keyboard_type') {
          console.log(`[Teclado] Digitado: ${data.text}`);
          executor.typeText(data.text);
        } else if (data.type === 'keyboard_key') {
          console.log(`[Teclado] Pressionado: ${data.key}`);
          executor.pressKey(data.key);
        }
        
        // --- SINALIZAÇÃO WEBRTC ---
        else if (data.type === 'watch_stream') {
          // O celular pede para assistir
          console.log(`[WebRTC] Celular (ID: ${ws.id}) solicitou assistir a tela.`);
          wss.clients.forEach(c => {
            if (c.readyState === 1 && c.role === 'host') {
              c.send(JSON.stringify({ type: 'watch_stream', targetId: ws.id }));
            }
          });
        }
        else if (data.type === 'webrtc_offer') {
          // O host envia a oferta para um celular específico
          wss.clients.forEach(c => {
            if (c.readyState === 1 && c.id === data.targetId) {
              c.send(JSON.stringify(data));
            }
          });
        }
        else if (data.type === 'webrtc_answer') {
          // O celular envia a resposta para o host
          wss.clients.forEach(c => {
            if (c.readyState === 1 && c.role === 'host') {
              c.send(JSON.stringify({ type: 'webrtc_answer', targetId: ws.id, sdp: data.sdp }));
            }
          });
        }
        else if (data.type === 'webrtc_ice_candidate') {
          // Repassa o candidato ICE entre peers
          // Se for do mobile, vai pro host. Se for do host, vai pro mobile específico.
          wss.clients.forEach(c => {
            if (c.readyState === 1) {
              if (ws.role === 'host' && c.id === data.targetId) {
                c.send(JSON.stringify(data));
              } else if (ws.role !== 'host' && c.role === 'host') {
                c.send(JSON.stringify({ type: 'webrtc_ice_candidate', targetId: ws.id, candidate: data.candidate }));
              }
            }
          });
        }
        else if (data.type === 'set_quality') {
          wss.clients.forEach(c => {
            if (c.readyState === 1 && c.role === 'host') {
              c.send(JSON.stringify({ type: 'set_quality', targetId: ws.id, quality: data.quality }));
            }
          });
        }
        // Fallback antigo caso WebRTC falhe
        else if (data.type === 'start_stream') {
          // Ignorado - agora usaremos WebRTC via watch_stream
        } else if (data.type === 'stop_stream') {
          if (streamInterval) clearInterval(streamInterval);
          stopLinuxStream();
        }
      } catch (err) {
        console.error('[WebSocket] Erro ao processar mensagem:', err.message);
      }
    });

    ws.on('close', () => {
      if (monitorInterval) clearInterval(monitorInterval);
      if (streamInterval) clearInterval(streamInterval);
      if (ws.role !== 'host') {
          // Avisa o host que o celular desconectou
          wss.clients.forEach(c => {
            if (c.readyState === 1 && c.role === 'host') {
              c.send(JSON.stringify({ type: 'peer_disconnected', targetId: ws.id }));
            }
          });
      }
    });
  });

  return wss;
}
