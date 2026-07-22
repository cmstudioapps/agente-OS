const btnStart = document.getElementById('btn-start');
const video = document.getElementById('video');
const status = document.getElementById('status');

let ws = null;
let localStream = null;
const peers = {}; // Mapa de ID do cliente -> RTCPeerConnection

// O host conecta com o token gerado.
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

const iceConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

function connectWebSocket() {
  ws = new WebSocket(`ws://${window.location.host}`);
  
  ws.onopen = () => {
    status.textContent = 'WebSocket conectado. Autenticando...';
    ws.send(JSON.stringify({ type: 'auth', token: token, role: 'host' }));
  };

  ws.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'auth_result' && data.success) {
      status.textContent = 'Conectado ao Servidor do Agente OS! Pronto para transmitir (P2P).';
    } 
    else if (data.type === 'watch_stream') {
      console.log('Solicitação de stream recebida do cliente ID:', data.targetId);
      if (!localStream) return;
      
      const peer = new RTCPeerConnection(iceConfiguration);
      peers[data.targetId] = peer;
      
      // Adiciona o track de vídeo ao PeerConnection
      localStream.getTracks().forEach(track => {
        peer.addTrack(track, localStream);
      });

      peer.onicecandidate = (e) => {
        if (e.candidate) {
          ws.send(JSON.stringify({ 
            type: 'webrtc_ice_candidate', 
            targetId: data.targetId, 
            candidate: e.candidate 
          }));
        }
      };

      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        ws.send(JSON.stringify({ 
          type: 'webrtc_offer', 
          targetId: data.targetId, 
          sdp: peer.localDescription 
        }));
      } catch (err) {
        console.error('Erro ao criar oferta:', err);
      }
    }
    else if (data.type === 'webrtc_answer') {
      const peer = peers[data.targetId];
      if (peer) {
        try {
          await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
        } catch (err) {
          console.error('Erro ao setar sdp remoto:', err);
        }
      }
    }
    else if (data.type === 'webrtc_ice_candidate') {
      const peer = peers[data.targetId];
      if (peer) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('Erro ao adicionar ICE:', err);
        }
      }
    }
    else if (data.type === 'peer_disconnected') {
      const peer = peers[data.targetId];
      if (peer) {
        peer.close();
        delete peers[data.targetId];
      }
    }
  };

  ws.onerror = () => {
    status.textContent = 'Erro no WebSocket.';
  };

  ws.onclose = () => {
    status.textContent = 'Desconectado. Tentando reconectar em 3s...';
    if (localStream) {
        setTimeout(connectWebSocket, 3000);
    }
  };
}

btnStart.addEventListener('click', async () => {
  if (!token) {
      alert("Token não fornecido na URL. O servidor deveria ter aberto com ?token=...");
      return;
  }

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 60 } },
      audio: false
    });
    
    localStream = stream;
    video.srcObject = stream;
    
    video.onloadedmetadata = () => {
      connectWebSocket();
      btnStart.style.display = 'none';
    };

    stream.getVideoTracks()[0].onended = () => {
      localStream = null;
      btnStart.style.display = 'block';
      status.textContent = 'Transmissão encerrada.';
      if (ws) ws.close();
      for (let id in peers) {
        peers[id].close();
      }
    };

  } catch (err) {
    status.textContent = 'Erro: ' + err.message;
  }
});
