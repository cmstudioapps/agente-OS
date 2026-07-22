# Agente OS - Remote Monitor & Control

Agente OS é uma aplicação Desktop (Electron) e Web (Mobile) que permite transmitir a tela do seu PC para o seu celular em tempo real com baixíssima latência (WebRTC), além de permitir o controle remoto completo do mouse e teclado do computador diretamente pelo navegador do smartphone.

## 🚀 Funcionalidades

- **Streaming de Tela:** Transmissão de vídeo em tempo real do Desktop para o Mobile via WebRTC.
- **Controle Premium de Mouse:** Interface mobile moderna simulando um trackpad físico com suporte a scroll animado e redimensionamento dinâmico.
- **Teclado em Tempo Real:** Digitação instantânea enviada do celular para o PC (suporta Backspace e Enter nativamente).
- **Notificação via WhatsApp:** Opcionalmente, envie a URL de acesso remoto e o PIN de segurança para o seu WhatsApp automaticamente ao iniciar o servidor.
- **Túnel Seguro:** Utiliza localtunnel para gerar uma URL pública sem necessidade de abrir portas no roteador.
- **Suporte a Linux (Wayland):** Controle de input em baixo nível no Linux utilizando `evdev` com privilégios de superusuário, contornando limitações do Wayland.
- **Modo Zoom & Stretch:** Controle avançado de visualização de vídeo pelo celular para monitores grandes.

## 🛠️ Tecnologias Utilizadas

- **Backend/Desktop:** Electron, Node.js, WebSockets, localtunnel, RobotJS
- **Frontend (Mobile):** HTML, CSS (Glassmorphism), Vanilla JavaScript, Lucide Icons
- **Linux Input:** Python 3 (`evdev`)
- **Integração:** `whatsapp-web.js` (Puppeteer)

## 📦 Pré-requisitos

- **Node.js** (Versão 18 ou 20+)
- **No Linux (Wayland):**
  - **Python 3** (Necessário para controle de input nativo)
  - É necessário ter o pacote `evdev` instalado no Python:
    ```bash
    sudo apt install python3-evdev
    # ou
    pip3 install evdev
    ```
- **No Windows:**
  - O projeto utiliza a biblioteca nativa `robotjs`. Para a primeira instalação (`npm install`), você precisará ter o pacote de build do Windows instalado. Caso dê erro, rode no PowerShell como Administrador: `npm install --global windows-build-tools` ou certifique-se de ter o Visual Studio Build Tools instalado.

## ⚙️ Instalação

1. Clone o repositório:
   ```bash
   git clone git@github.com:cmstudioapps/agente-OS.git
   cd "agente-OS/agent"
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

## 🎮 Como Usar

1. Inicie a aplicação no computador host:
   ```bash
   npm start
   ```

2. **Configuração Inicial:**
   - O aplicativo detecta automaticamente o seu sistema operacional.
   - **No Linux (Wayland):** Na janela do Electron que se abrirá, insira sua senha de ROOT/SUDO (obrigatório para controlar o mouse em baixo nível).
   - **No Windows:** O campo de Senha Sudo será ocultado automaticamente e o motor de controle mudará sozinho para o modo Windows.
   - Marque a opção de **Habilitar WhatsApp** e informe o seu número (Ex: `5511999999999`) caso queira receber o link de acesso diretamente no celular.
   - Clique em **Ligar Servidor**.

3. **Acessando pelo Celular:**
   - O aplicativo gerará um PIN de 4 dígitos e uma URL pública (ex: `https://meu-agente-xxx.loca.lt`).
   - Abra a URL no seu celular.
   - Digite o PIN fornecido.
   - Use as abas inferiores para alternar entre visualizar informações do PC, assistir a tela ou controlar o Trackpad virtual!

## 🔐 Segurança e Privacidade

- **WebRTC Peer-to-Peer:** O vídeo é transmitido diretamente entre seu PC e o seu celular após a sinalização inicial, garantindo velocidade e privacidade.
- **Autenticação Simples:** Todo acesso remoto exige o PIN gerado no momento da inicialização.
- **Otimização de RAM:** O client do WhatsApp é automaticamente encerrado após o envio da mensagem para economizar recursos do sistema.

## 📄 Estrutura do Projeto

- `/agent` - Código fonte do servidor Node.js e App Electron.
- `/agent/src` - Lógica de sinalização, comandos do SO (linux/windows) e monitoramento.
- `/agent/desktop` - Frontend da janela do Electron.
- `/mobile` - Frontend da interface responsiva acessada pelo celular.

---
*Criado com ❤️ para simplificar o acesso remoto.*
