let ws = null;
let currentToken = '';
let terminalUnlocked = false;
let currentPath = '';

// Inicia Ícones
lucide.createIcons();

// --- ELEMENTOS DE TELA ---
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const btnConnect = document.getElementById('btn-connect');
const btnDisconnect = document.getElementById('btn-disconnect');
const inputUrl = document.getElementById('tunnel-url');
const inputToken = document.getElementById('auth-token');
const loginError = document.getElementById('login-error');

// Navegação Inferior
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Dashboard
const valCpu = document.getElementById('val-cpu');
const valRam = document.getElementById('val-ram');
const valDisk = document.getElementById('val-disk');
const valNet = document.getElementById('val-net');
const hostName = document.getElementById('host-name');
const infoOs = document.getElementById('info-os');
const infoHostname = document.getElementById('info-hostname');
const infoArch = document.getElementById('info-arch');
const infoUptime = document.getElementById('info-uptime');
const infoTemp = document.getElementById('info-temp');
const infoBattery = document.getElementById('info-battery');

// Terminal
const termOutput = document.getElementById('terminal-output');
const termInput = document.getElementById('cmd-input');
const btnSendCmd = document.getElementById('btn-send-cmd');
const btnClearTerm = document.getElementById('btn-clear-term');

// Processos
const processTableBody = document.querySelector('#process-table tbody');
const btnKillProcess = document.getElementById('btn-kill-process');
let selectedPid = null;
let selectedProcessName = '';

// Arquivos
const fileList = document.getElementById('file-list');
const filePath = document.getElementById('file-path');

// --- CONTROLE DE MOUSE/TECLADO ---
const trackpadArea = document.getElementById('trackpad-area');
const btnClickLeft = document.getElementById('btn-click-left');
const btnClickRight = document.getElementById('btn-click-right');
const inputKeyboard = document.getElementById('keyboard-input');
const btnSendText = document.getElementById('btn-send-text');

let lastX = 0, lastY = 0;
let mouseFloatX = 0, mouseFloatY = 0;
let pendingDx = 0, pendingDy = 0;

let isPanMode = false;
let panOffsetX = 0;
let panOffsetY = 0;

const btnPanMode = document.getElementById('btn-pan-mode');
if (btnPanMode) {
  btnPanMode.addEventListener('click', () => {
    isPanMode = !isPanMode;
    if (isPanMode) {
      btnPanMode.style.color = '#3b82f6'; // Ativo
      appendToTerminal('Modo Mover Tela ativado.', 'sys');
    } else {
      btnPanMode.style.color = '';
      appendToTerminal('Modo Mover Tela desativado.', 'sys');
    }
  });
}

setInterval(() => {
  if (ws && (pendingDx !== 0 || pendingDy !== 0)) {
    ws.send(JSON.stringify({ type: 'mouse_move', dx: pendingDx, dy: pendingDy }));
    pendingDx = 0;
    pendingDy = 0;
  }
}, 33); // Envia coordenadas a ~30FPS para ser ultra suave e não congestionar a rede

if (trackpadArea) {
  trackpadArea.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    lastX = touch.clientX;
    lastY = touch.clientY;
    mouseFloatX = 0;
    mouseFloatY = 0;
  }, { passive: true });

  trackpadArea.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    
    if (isPanMode) {
      panOffsetX += (touch.clientX - lastX);
      panOffsetY += (touch.clientY - lastY);
      updateVideoTransform();
    } else {
      // Multiplicador 2.5x pra mais agilidade e uso de floats pra não perder movimentos finos
      mouseFloatX += (touch.clientX - lastX) * 2.5;
      mouseFloatY += (touch.clientY - lastY) * 2.5;
      
      const dx = Math.trunc(mouseFloatX);
      const dy = Math.trunc(mouseFloatY);
      
      if (dx !== 0 || dy !== 0) {
        pendingDx += dx;
        pendingDy += dy;
        mouseFloatX -= dx;
        mouseFloatY -= dy;
      }
    }
    
    lastX = touch.clientX;
    lastY = touch.clientY;
  }, { passive: false });
}

const btnScroll = document.getElementById('btn-scroll');
let lastScrollY = 0;
let scrollFloatY = 0;

let scrollAnimTimeout = null;

if (btnScroll) {
  btnScroll.addEventListener('touchstart', (e) => {
    e.preventDefault();
    lastScrollY = e.touches[0].clientY;
    scrollFloatY = 0;
  }, { passive: false });

  btnScroll.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    
    // Suaviza e diminui sensibilidade do scroll
    scrollFloatY += (touch.clientY - lastScrollY) * -0.15; // Invertido para Natural Scrolling
    const dy = Math.trunc(scrollFloatY);
    
    if (dy !== 0) {
      if (ws) ws.send(JSON.stringify({ type: 'mouse_scroll', dy }));
      scrollFloatY -= dy;
      
      // Animação visual da rodinha
      btnScroll.classList.remove('scrolling-up', 'scrolling-down');
      btnScroll.classList.add(dy < 0 ? 'scrolling-down' : 'scrolling-up');
      clearTimeout(scrollAnimTimeout);
      scrollAnimTimeout = setTimeout(() => {
        btnScroll.classList.remove('scrolling-up', 'scrolling-down');
      }, 150);
    }
    lastScrollY = touch.clientY;
  }, { passive: false });
}

// --- GRÁFICOS (Chart.js) ---
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = 'Inter';

const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: {
    x: { display: false },
    y: { display: false, min: 0, max: 100 }
  },
  elements: { point: { radius: 0 } },
  animation: false
};

const createChart = (id, color) => {
  const ctx = document.getElementById(id).getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array(20).fill(''),
      datasets: [{
        data: Array(20).fill(0),
        borderColor: color,
        borderWidth: 2,
        tension: 0.4
      }]
    },
    options: id === 'chart-net' ? { ...commonChartOptions, scales: { y: { display: false } } } : commonChartOptions
  });
};

const charts = {
  cpu: createChart('chart-cpu', '#3b82f6'),
  ram: createChart('chart-ram', '#10b981'),
  disk: createChart('chart-disk', '#8b5cf6'),
  net: createChart('chart-net', '#f59e0b')
};

function updateChart(chartObj, newValue) {
  const data = chartObj.data.datasets[0].data;
  data.shift();
  data.push(newValue);
  chartObj.update();
}

// --- NAVEGAÇÃO ---
navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(t => t.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById(btn.getAttribute('data-target')).classList.add('active');
    
    // Dispara pedidos específicos ao mudar de aba
    if (btn.getAttribute('data-target') === 'tab-arquivos' && ws) {
      requestFileList(currentPath);
    }
    
    // Controle do Stream de tela
    if (btn.getAttribute('data-target') === 'tab-mouse' && ws) {
      ws.send(JSON.stringify({ type: 'watch_stream' }));
    } else if (ws) {
      ws.send(JSON.stringify({ type: 'stop_stream' }));
    }
  });
});

let peerConnection = null;
const iceConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

function initWebRTC() {
  if (peerConnection) peerConnection.close();
  peerConnection = new RTCPeerConnection(iceConfiguration);
  
  peerConnection.onicecandidate = (e) => {
    if (e.candidate && ws) {
      ws.send(JSON.stringify({ type: 'webrtc_ice_candidate', targetId: 'host', candidate: e.candidate }));
    }
  };

  peerConnection.ontrack = (e) => {
    const streamVideo = document.getElementById('screen-stream');
    const btnSavePrint = document.getElementById('btn-save-print');
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const selectQuality = document.getElementById('select-quality');
    const btnStretchH = document.getElementById('btn-stretch-h');
    const btnStretchV = document.getElementById('btn-stretch-v');
    const hint = document.getElementById('trackpad-hint');
    
    if (streamVideo) {
      streamVideo.srcObject = e.streams[0];
      streamVideo.style.display = 'block';
      if (btnSavePrint) btnSavePrint.style.display = 'inline-flex';
      if (btnStretchH) btnStretchH.style.display = 'inline-flex';
      if (btnStretchV) btnStretchV.style.display = 'inline-flex';
      if (btnPanMode) btnPanMode.style.display = 'inline-flex';
      if (btnZoomIn) btnZoomIn.style.display = 'inline-flex';
      if (btnZoomOut) btnZoomOut.style.display = 'inline-flex';
      if (selectQuality) selectQuality.style.display = 'inline-block';
      if (hint) hint.style.display = 'none';
    }
  };
}

// --- UTILITÁRIOS ---
function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024, dm = decimals < 0 ? 0 : decimals, sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600*24));
  const h = Math.floor(seconds % (3600*24) / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  return `${d}d ${h}h ${m}m`;
}

function getTimestamp() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
}

function appendToTerminal(text, type = 'sys') {
  const div = document.createElement('div');
  const timeStr = `<span class="term-time">${getTimestamp()}</span>`;
  let content = text;
  
  if (type === 'cmd') content = `<span class="term-cmd">${text}</span>`;
  if (type === 'error') content = `<span class="term-err">${text}</span>`;
  if (type === 'sys') content = `<span class="term-sys">${text}</span>`;
  
  div.innerHTML = `${timeStr} ${content}`;
  termOutput.appendChild(div);
  termOutput.scrollTop = termOutput.scrollHeight;
}

btnClearTerm.addEventListener('click', () => termOutput.innerHTML = '');

// --- WEBSOCKET & LOGIN ---
const savedUrl = sessionStorage.getItem('agente_url');
const savedToken = sessionStorage.getItem('agente_token');
if (savedUrl) inputUrl.value = savedUrl;
if (savedToken) inputToken.value = savedToken;

async function connect(isAutoReconnect = false) {
  const url = inputUrl.value.trim();
  const token = inputToken.value.trim();

  if (!url || !token) {
    loginError.textContent = 'Preencha URL e Senha.';
    return;
  }

  // Segurança Nativa
  if (typeof solicitarBloqueio === 'function') {
    try {
      await solicitarBloqueio();
    } catch (e) {
      loginError.textContent = 'Autenticação cancelada/falhou.';
      return;
    }
  }

  let wsUrl = url.replace('http://', 'ws://').replace('https://', 'wss://');
  loginError.textContent = 'Conectando...';
  
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'auth', token: token }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'auth_result') {
      if (data.success) {
        currentToken = token;
        sessionStorage.setItem('agente_url', url);
        sessionStorage.setItem('agente_token', token);
        loginScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        loginError.textContent = '';
        appendToTerminal('Sessão iniciada e autenticada.', 'sys');
      } else {
        loginError.textContent = 'Senha inválida.';
        ws.close();
      }
    }

    if (data.type === 'monitor' && data.data) {
      // Atualiza Valores Textuais
      valCpu.textContent = `${data.data.cpu}%`;
      valRam.textContent = `${data.data.ram}%`;
      valDisk.textContent = `${data.data.disk}%`;
      
      const rx = (data.data.rx_sec || 0) / 1024;
      const tx = (data.data.tx_sec || 0) / 1024;
      valNet.textContent = `${(rx + tx).toFixed(1)} kb/s`;

      // Atualiza Gráficos
      updateChart(charts.cpu, data.data.cpu);
      updateChart(charts.ram, data.data.ram);
      updateChart(charts.disk, data.data.disk);
      updateChart(charts.net, rx + tx);

      // Info
      hostName.textContent = data.data.hostname;
      infoHostname.textContent = data.data.hostname;
      infoOs.textContent = data.data.system;
      infoArch.textContent = data.data.arch;
      infoUptime.textContent = formatUptime(data.data.uptime);
      
      if (data.data.temperature !== undefined && data.data.temperature !== null && data.data.temperature !== -1) {
        infoTemp.textContent = `${data.data.temperature.toFixed(1)} °C`;
      } else {
        infoTemp.textContent = 'Não suportado';
      }

      if (data.data.battery && data.data.battery.hasBattery) {
        const charging = data.data.battery.isCharging ? ' (Carregando)' : (data.data.battery.acConnected ? ' (Na Tomada)' : ' (Bateria)');
        infoBattery.textContent = `${data.data.battery.percent}%${charging}`;
      } else {
        infoBattery.textContent = 'Tomada (Desktop)';
      }

      // Processos
      renderProcesses(data.data.processes || []);
    }

    if (data.type === 'command_result' || data.type === 'action_result') {
      appendToTerminal(data.output || 'Executado.', data.success === false ? 'error' : 'sys');
    }

    if (data.type === 'files_result') {
      currentPath = data.path;
      renderFiles(data.files, data.currentPath);
    }

    if (data.type === 'kill_result') {
      if (data.success) {
        appendToTerminal(`Processo ${data.pid} encerrado com sucesso.`, 'sys');
        selectedPid = null;
        btnKillProcess.disabled = true;
      } else {
        appendToTerminal(`Falha ao encerrar PID ${data.pid}: ${data.output}`, 'error');
      }
    }

    if (data.type === 'error') {
      appendToTerminal(data.message, 'error');
    }

    if (data.type === 'webrtc_offer') {
      initWebRTC();
      peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(() => {
        return peerConnection.createAnswer();
      }).then((answer) => {
        return peerConnection.setLocalDescription(answer);
      }).then(() => {
        ws.send(JSON.stringify({ type: 'webrtc_answer', sdp: peerConnection.localDescription }));
      }).catch(err => console.error(err));
    }

    if (data.type === 'webrtc_ice_candidate' && peerConnection) {
      peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(err => console.error(err));
    }
  };

  ws.onerror = () => {
    loginError.textContent = 'Falha de conexão (verifique túnel e rede).';
  };

  ws.onclose = () => {
    loginScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
    loginError.textContent = 'Desconectado.';
    terminalUnlocked = false;
  };
}

btnConnect.addEventListener('click', () => connect(false));
btnDisconnect.addEventListener('click', () => { 
  sessionStorage.removeItem('agente_url');
  sessionStorage.removeItem('agente_token');
  if (ws) ws.close(); 
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && sessionStorage.getItem('agente_url') && sessionStorage.getItem('agente_token')) {
    if (!ws || ws.readyState === WebSocket.CLOSED) {
      loginError.textContent = 'Restaurando conexão...';
      connect(true);
    }
  }
});

// --- AÇÕES & TERMINAL ---
const actionBtns = document.querySelectorAll('.action-btn');
actionBtns.forEach(btn => {
  btn.addEventListener('click', async () => {
    const action = btn.getAttribute('data-action');
    if (!ws) return;

    if (action === 'reiniciar' || action === 'desligar') {
      if (typeof solicitarBloqueio === 'function') {
        try { await solicitarBloqueio(); } 
        catch(e) { appendToTerminal('Ação de energia cancelada.', 'error'); return; }
      }
    }
    
    appendToTerminal(`Executando atalho: ${action}`, 'cmd');
    ws.send(JSON.stringify({ type: 'action', action: action }));
  });
});

async function sendCommand() {
  const cmd = termInput.value.trim();
  if (!cmd || !ws) return;
  
  if (!terminalUnlocked && typeof solicitarBloqueio === 'function') {
    try { await solicitarBloqueio(); terminalUnlocked = true; } 
    catch(e) { appendToTerminal('Autenticação falhou. Terminal bloqueado.', 'error'); return; }
  }

  appendToTerminal(`$ ${cmd}`, 'cmd');
  ws.send(JSON.stringify({ type: 'command', command: cmd }));
  termInput.value = '';
}

btnSendCmd.addEventListener('click', sendCommand);
termInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendCommand(); });

// --- PROCESSOS ---
function renderProcesses(list) {
  processTableBody.innerHTML = '';

  list.forEach(p => {
    const tr = document.createElement('tr');
    if (selectedPid === p.pid) tr.classList.add('selected');
    
    const shieldIcon = p.isSystem ? '<i data-lucide="shield-alert" style="width:14px; height:14px; margin-left:6px; color:var(--text-muted); vertical-align:middle;"></i>' : '';

    tr.innerHTML = `
      <td>${p.name} ${shieldIcon}</td>
      <td>${p.pid}</td>
      <td>${p.cpu}%</td>
      <td>${formatBytes(p.mem * 1024 * 1024)}</td>
    `;
    
    tr.addEventListener('click', () => {
      document.querySelectorAll('#process-table tbody tr').forEach(row => row.classList.remove('selected'));
      tr.classList.add('selected');
      selectedPid = p.pid;
      selectedProcessName = p.name;
      btnKillProcess.disabled = false;
      btnKillProcess.dataset.isSystem = p.isSystem;
    });
    
    processTableBody.appendChild(tr);
  });
  
  lucide.createIcons();
}

btnKillProcess.addEventListener('click', async () => {
  if (!ws || !selectedPid) return;
  
  if (btnKillProcess.dataset.isSystem === 'true') {
    const confirmKill = confirm(`ATENÇÃO: O processo "${selectedProcessName}" (PID: ${selectedPid}) parece ser do sistema. Encerrá-lo pode causar instabilidade ou fechar o agente. Tem certeza?`);
    if (!confirmKill) return;
  }

  if (typeof solicitarBloqueio === 'function') {
    try { await solicitarBloqueio(); } 
    catch(e) { return; }
  }

  ws.send(JSON.stringify({ type: 'kill_process', pid: selectedPid, name: selectedProcessName }));
});

// --- ARQUIVOS ---
const fileUploadInput = document.getElementById('file-upload-input');
const btnUploadFile = document.getElementById('btn-upload-file');

if (btnUploadFile && fileUploadInput) {
  btnUploadFile.addEventListener('click', () => {
    if (!currentPath) {
      alert('Aguarde o carregamento do diretório antes de fazer upload.');
      return;
    }
    fileUploadInput.click();
  });

  fileUploadInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !currentPath || !currentToken) return;

    const formData = new FormData();
    formData.append('file', file);

    appendToTerminal(`Iniciando upload de ${file.name}...`, 'sys');
    
    try {
      const urlBase = inputUrl.value.trim().replace(/\/$/, '');
      const uploadUrl = `${urlBase}/api/upload?path=${encodeURIComponent(currentPath)}&token=${encodeURIComponent(currentToken)}`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      if (result.success) {
        appendToTerminal(`Upload de ${file.name} concluído.`, 'sys');
        requestFileList(currentPath); // Atualiza lista
      } else {
        appendToTerminal(`Falha no upload: ${result.error}`, 'error');
      }
    } catch (error) {
      appendToTerminal(`Erro no upload: ${error.message}`, 'error');
    }
    
    fileUploadInput.value = '';
  });
}

function requestFileList(pathStr = '') {
  if (!ws) return;
  ws.send(JSON.stringify({ type: 'list_files', path: pathStr }));
}

function renderFiles(files, absPath) {
  fileList.innerHTML = '';
  filePath.textContent = absPath;

  // Botão voltar
  if (absPath && absPath !== '/' && absPath !== 'C:\\') {
    const upPath = absPath.substring(0, Math.max(absPath.lastIndexOf('/'), absPath.lastIndexOf('\\'))) || '/';
    const div = document.createElement('div');
    div.className = 'file-item';
    div.innerHTML = `
      <div class="file-icon folder"><i data-lucide="corner-left-up"></i></div>
      <div class="file-details"><span class="file-name">.. (Voltar)</span></div>
    `;
    div.addEventListener('click', () => requestFileList(upPath));
    fileList.appendChild(div);
  }

  files.forEach(f => {
    const div = document.createElement('div');
    div.className = 'file-item';
    
    const icon = f.isDirectory ? 'folder' : 'file';
    const iconClass = f.isDirectory ? 'folder' : 'file';
    const sizeStr = f.isDirectory ? 'Pasta' : formatBytes(f.size);
    const dateStr = new Date(f.modifiedAt).toLocaleDateString();

    let downloadBtn = '';
    if (!f.isDirectory) {
      downloadBtn = `<button class="icon-btn download-btn" title="Baixar"><i data-lucide="download"></i></button>`;
    }

    div.innerHTML = `
      <div class="file-icon ${iconClass}"><i data-lucide="${icon}"></i></div>
      <div class="file-details" style="flex: 1;">
        <span class="file-name">${f.name}</span>
        <span class="file-meta">${sizeStr} • ${dateStr}</span>
      </div>
      ${downloadBtn}
    `;

    if (f.isDirectory) {
      div.addEventListener('click', () => {
        const separator = absPath.includes('\\') ? '\\' : '/';
        const newPath = absPath.endsWith(separator) ? absPath + f.name : absPath + separator + f.name;
        requestFileList(newPath);
      });
    } else {
      const dBtn = div.querySelector('.download-btn');
      if (dBtn) {
        dBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const separator = absPath.includes('\\') ? '\\' : '/';
          const filePath = absPath.endsWith(separator) ? absPath + f.name : absPath + separator + f.name;
          const urlBase = inputUrl.value.trim().replace(/\/$/, '');
          const downloadUrl = `${urlBase}/api/download?path=${encodeURIComponent(filePath)}&token=${encodeURIComponent(currentToken)}`;
          
          appendToTerminal(`Baixando ${f.name}...`, 'sys');
          window.open(downloadUrl, '_blank');
        });
      }
    }
    
    fileList.appendChild(div);
  });

  lucide.createIcons();
}

// Retorno Background
if (typeof aoEvento === 'function') {
  aoEvento('app:voltou', async () => {
    if (ws && currentToken) {
      try {
        if (typeof solicitarBloqueio === 'function') await solicitarBloqueio();
      } catch (e) {
        ws.close();
      }
    }
  });
}

// --- TRACKPAD LOGIC ---
if (trackpadArea) {
  let lastX = 0;
  let lastY = 0;

  trackpadArea.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    lastX = touch.clientX;
    lastY = touch.clientY;
  }, { passive: false });

  trackpadArea.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!ws) return;
    
    const touch = e.touches[0];
    const dx = touch.clientX - lastX;
    const dy = touch.clientY - lastY;
    
    // Multiplicador de sensibilidade (ajustável)
    const sensitivity = 1.5;
    
    ws.send(JSON.stringify({ 
      type: 'mouse_move', 
      dx: dx * sensitivity, 
      dy: dy * sensitivity 
    }));
    
    lastX = touch.clientX;
    lastY = touch.clientY;
  }, { passive: false });
}

const btnSavePrint = document.getElementById('btn-save-print');
if (btnSavePrint) {
  btnSavePrint.addEventListener('click', () => {
    const streamVideo = document.getElementById('screen-stream');
    if (streamVideo && streamVideo.srcObject) {
      const canvas = document.createElement('canvas');
      canvas.width = streamVideo.videoWidth;
      canvas.height = streamVideo.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(streamVideo, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `screenshot_${new Date().getTime()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      appendToTerminal('Screenshot (WebRTC) salvo na galeria.', 'sys');
    }
  });
}

// Zoom e Qualidade
let currentZoom = 1.0;
let stretchX = parseFloat(localStorage.getItem('stretchX')) || 1.0;
let stretchY = parseFloat(localStorage.getItem('stretchY')) || 1.0;

const streamVideo = document.getElementById('screen-stream');
const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');
const btnStretchH = document.getElementById('btn-stretch-h');
const btnStretchV = document.getElementById('btn-stretch-v');
const selectQuality = document.getElementById('select-quality');

function updateVideoTransform() {
  if (streamVideo) {
    streamVideo.style.transform = `translate(${panOffsetX}px, ${panOffsetY}px) scale(${currentZoom * stretchX}, ${currentZoom * stretchY})`;
  }
}

if (btnZoomIn && btnZoomOut && streamVideo) {
  // Aplica o transform inicial carregado do localStorage
  updateVideoTransform();

  btnZoomIn.addEventListener('click', () => {
    if (currentZoom < 3.0) {
      currentZoom += 0.5;
      updateVideoTransform();
    }
  });

  btnZoomOut.addEventListener('click', () => {
    if (currentZoom > 1.0) {
      currentZoom -= 0.5;
      updateVideoTransform();
    }
  });
}

if (btnStretchH && btnStretchV) {
  btnStretchH.addEventListener('click', () => {
    stretchX += 0.2;
    if (stretchX > 2.0) stretchX = 1.0; // Reset
    localStorage.setItem('stretchX', stretchX);
    updateVideoTransform();
    appendToTerminal(`Stretch Horizontal: ${stretchX.toFixed(1)}x`, 'sys');
  });

  btnStretchV.addEventListener('click', () => {
    stretchY += 0.2;
    if (stretchY > 2.0) stretchY = 1.0; // Reset
    localStorage.setItem('stretchY', stretchY);
    updateVideoTransform();
    appendToTerminal(`Stretch Vertical: ${stretchY.toFixed(1)}x`, 'sys');
  });
}

if (inputKeyboard) {
  inputKeyboard.addEventListener('input', (e) => {
    if (!ws) return;
    
    if (e.inputType === 'insertText' && e.data) {
      ws.send(JSON.stringify({ type: 'keyboard_type', text: e.data }));
      appendToTerminal(`Tecla enviada: ${e.data}`, 'sys');
    } 
    else if (e.inputType === 'insertLineBreak') {
      ws.send(JSON.stringify({ type: 'keyboard_key', key: 'enter' }));
      appendToTerminal(`Enter enviado`, 'sys');
    }
    else if (e.inputType === 'deleteContentBackward') {
      ws.send(JSON.stringify({ type: 'keyboard_key', key: 'backspace' }));
      appendToTerminal(`Backspace enviado`, 'sys');
    }
  });
}

if (selectQuality) {
  selectQuality.addEventListener('change', (e) => {
    if (ws) {
      ws.send(JSON.stringify({ type: 'set_quality', targetId: 'host', quality: e.target.value }));
      appendToTerminal(`Alterando qualidade de transmissão para: ${e.target.value}`, 'sys');
    }
  });
}

if (btnClickLeft) {
  btnClickLeft.addEventListener('click', () => {
    if (ws) ws.send(JSON.stringify({ type: 'mouse_click', button: 'left' }));
  });
}

if (btnClickRight) {
  btnClickRight.addEventListener('click', () => {
    if (ws) ws.send(JSON.stringify({ type: 'mouse_click', button: 'right' }));
  });
}

if (btnSendText && keyboardInput) {
  const sendKeyboardText = () => {
    const txt = keyboardInput.value;
    if (ws && txt) {
      ws.send(JSON.stringify({ type: 'keyboard_type', text: txt }));
      keyboardInput.value = '';
    }
  };

  btnSendText.addEventListener('click', sendKeyboardText);
  keyboardInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendKeyboardText();
  });
}
