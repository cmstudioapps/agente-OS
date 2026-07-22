const { ipcRenderer } = require('electron');

// Elementos
const setupScreen = document.getElementById('setup-screen');
const activeScreen = document.getElementById('active-screen');
const inputSudo = document.getElementById('input-sudo');
const inputWpp = document.getElementById('input-wpp');
const btnStart = document.getElementById('btn-start-server');
const textStatus = document.getElementById('status-text');
const dotStatus = document.getElementById('status-dot');

const labelUrl = document.getElementById('tunnel-url');
const labelToken = document.getElementById('auth-token');

// Configuração WebRTC
const iceConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

let ws = null;
let localStream = null;
const peers = {};

async function startStream(token) {
  try {
    const sources = await ipcRenderer.invoke('get-desktop-sources');
    // Pega a tela principal
    const source = sources.find(s => s.name === 'Entire Screen' || s.name === 'Screen 1') || sources[0];
    
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: source.id,
          minFrameRate: 30,
          maxFrameRate: 60
        }
      }
    });

    connectWebSocket(token);
  } catch (e) {
    console.error('Erro ao capturar tela:', e);
  }
}

function connectWebSocket(token) {
  // O Electron se conecta a si mesmo (ao server Node que roda no backend)
  ws = new WebSocket('ws://localhost:3000');
  
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'auth', token: token, role: 'host' }));
  };

  ws.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'auth_result' && data.success) {
      console.log('Host interno conectado ao WebSockets.');
    } 
    else if (data.type === 'watch_stream') {
      if (!localStream) return;
      
      const peer = new RTCPeerConnection(iceConfiguration);
      peers[data.targetId] = peer;
      
      localStream.getTracks().forEach(track => {
        peer.addTrack(track, localStream);
      });

      peer.onicecandidate = (e) => {
        if (e.candidate) {
          ws.send(JSON.stringify({ type: 'webrtc_ice_candidate', targetId: data.targetId, candidate: e.candidate }));
        }
      };

      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        ws.send(JSON.stringify({ type: 'webrtc_offer', targetId: data.targetId, sdp: peer.localDescription }));
      } catch (err) {}
    }
    else if (data.type === 'webrtc_answer') {
      const peer = peers[data.targetId];
      if (peer) await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
    }
    else if (data.type === 'webrtc_ice_candidate') {
      const peer = peers[data.targetId];
      if (peer) await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
    else if (data.type === 'peer_disconnected') {
      const peer = peers[data.targetId];
      if (peer) {
        peer.close();
        delete peers[data.targetId];
      }
    }
    else if (data.type === 'set_quality') {
      if (localStream) {
        const track = localStream.getVideoTracks()[0];
        if (track) {
          let constraints = {};
          if (data.quality === 'high') constraints = { frameRate: { max: 60 }, width: 1920, height: 1080 };
          else if (data.quality === 'medium') constraints = { frameRate: { max: 30 }, width: 1280, height: 720 };
          else if (data.quality === 'low') constraints = { frameRate: { max: 15 }, width: 854, height: 480 };
          
          try {
            await track.applyConstraints(constraints);
            console.log('Qualidade do WebRTC alterada para:', data.quality);
          } catch (e) {
            console.error('Erro ao alterar qualidade:', e);
          }
        }
      }
    }
  };
}

async function init() {
  const setup = await ipcRenderer.invoke('check-setup');
  
  const toggleWpp = document.getElementById('toggle-wpp');

  if (!setup.isLinux) {
    inputSudo.parentElement.style.display = 'none';
  } else {
    inputSudo.value = setup.sudoPass;
  }
  
  if (setup.wppNumber) {
    inputWpp.value = setup.wppNumber;
    toggleWpp.checked = true;
  } else {
    toggleWpp.checked = false;
    inputWpp.style.display = 'none';
  }

  toggleWpp.addEventListener('change', (e) => {
    inputWpp.style.display = e.target.checked ? 'block' : 'none';
  });

  textStatus.textContent = 'Aguardando inicialização...';
}

async function startBackend() {
  textStatus.textContent = 'Ligando túnel e servidor...';
  btnStart.disabled = true;

  const wantsWpp = document.getElementById('toggle-wpp').checked;
  const wppVal = wantsWpp ? (inputWpp.value || 'none') : 'none';

  try {
    const result = await ipcRenderer.invoke('start-server', {
      sudoPass: inputSudo.value || 'none',
      wppNumber: wppVal
    });
    
    // Sucesso! Mostra a tela de monitoramento
    setupScreen.classList.add('hidden');
    activeScreen.classList.remove('hidden');
    
    labelUrl.textContent = result.url;
    labelToken.textContent = result.token;
    
    textStatus.textContent = 'Servidor Online';
    dotStatus.classList.add('online');

    // Inicia captura local invisivel
    startStream(result.token);

  } catch (e) {
    textStatus.textContent = 'Erro ao iniciar servidor.';
    btnStart.disabled = false;
  }
}

btnStart.addEventListener('click', startBackend);

// Copy buttons
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = document.getElementById(btn.getAttribute('data-copy')).textContent;
    navigator.clipboard.writeText(text);
  });
});

init();
