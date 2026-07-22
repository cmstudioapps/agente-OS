import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

let client;
let isReady = false;
let pendingMessage = null;

export function initWhatsApp() {
  console.log('[WhatsApp] Iniciando cliente (pode demorar na primeira vez para baixar o Chromium)...');

  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // Necessário em alguns ambientes Linux
    }
  });

  client.on('qr', (qr) => {
    console.log('\n=============================================');
    console.log('   QR CODE DO WHATSAPP GERADO');
    console.log('=============================================');
    console.log('Escaneie o QR Code abaixo com o aplicativo WhatsApp no seu celular.');
    qrcode.generate(qr, { small: true });
    console.log('=============================================\n');
  });

  client.on('ready', () => {
    console.log('[WhatsApp] Cliente autenticado e pronto para enviar mensagens!');
    isReady = true;
    if (pendingMessage) {
      enviarCredenciais(pendingMessage.numero, pendingMessage.url, pendingMessage.token);
      pendingMessage = null;
    }
  });

  client.on('authenticated', () => {
    console.log('[WhatsApp] Sessão salva/recuperada.');
  });

  client.on('auth_failure', msg => {
    console.error('[WhatsApp] Falha na autenticação:', msg);
  });

  client.initialize().catch(err => {
    console.error('[WhatsApp] Erro fatal ao iniciar:', err);
  });
}

export async function enviarCredenciais(numero, url, token) {
  if (!client) {
    console.log('[WhatsApp] Cliente não iniciado.');
    return;
  }

  if (!isReady) {
    console.log('[WhatsApp] Cliente ainda não está pronto. A mensagem será enviada logo após a autenticação.');
    pendingMessage = { numero, url, token };
    return;
  }

  if (!numero) {
    console.log('[WhatsApp] Nenhum número configurado para enviar as credenciais.');
    return;
  }

  try {
    const chatId = `${numero}@c.us`;
    const mensagem = `🤖 *Remote Monitor Agent*\n\nSeu agente foi iniciado!\n\n🌐 *URL do App:* ${url}\n🔑 *PIN:* ${token}`;
    
    await client.sendMessage(chatId, mensagem);
    console.log(`[WhatsApp] Mensagem enviada com sucesso para ${numero}.`);
    
    console.log(`[WhatsApp] Desligando cliente (Puppeteer) para poupar memória RAM...`);
    setTimeout(() => {
      if (client) {
        client.destroy();
        client = null;
        isReady = false;
        console.log(`[WhatsApp] Encerrado com sucesso.`);
      }
    }, 3000); // pequeno delay de segurança
  } catch (error) {
    console.error('[WhatsApp] Erro ao enviar mensagem:', error);
  }
}
