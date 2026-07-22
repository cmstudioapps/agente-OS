# Prompt para desenvolvimento da aplicação Remote Monitor Agent

Crie uma aplicação completa de monitoramento e gerenciamento remoto composta por:

* **Agent Node.js multiplataforma** (Windows e Linux)
* **Aplicativo Android (APK)** funcionando como console/painel de controle
* Comunicação em tempo real entre APK e Agent através de tunnel
* Arquitetura modular, escalável e organizada

O objetivo é criar uma ferramenta semelhante a um RMM (Remote Monitoring and Management), onde o usuário instala um agente em uma máquina própria e consegue monitorar e administrar essa máquina através de um aplicativo Android.

---

## Regras obrigatórias do projeto

* Usar **somente bibliotecas disponíveis no npm**.
* Não utilizar bibliotecas baixadas diretamente de sites, arquivos externos ou repositórios fora do npm.
* Priorizar bibliotecas maduras, bem mantidas e compatíveis com Node.js.
* Criar código limpo, modular e seguindo boas práticas.
* O projeto deve ser preparado para evolução futura.
* O Agent deve funcionar em Windows e Linux.
* O APK deve ser criado utilizando tecnologias web empacotadas.

---

# Bibliotecas próprias disponíveis

As bibliotecas abaixo podem ser utilizadas caso sejam úteis para a arquitetura:

## CM Tunnel

Sistema de tunnel para exposição de servidores locais.

Documentação:
https://github.com/cmstudioapps/cm-tunnel

Disponível também pelo npm.

Uso esperado:

* Expor o servidor local do Agent.
* Criar conexão entre máquina monitorada e APK.
* Facilitar conexão sem necessidade de configuração de rede.

---

## CLI Fácil

Biblioteca para criação de interfaces CLI e comandos.

Documentação:
https://github.com/cmstudioapps/cli-facil

Uso esperado:

* Criar comandos administrativos do Agent.
* Criar ferramentas de configuração.
* Facilitar instalação e gerenciamento pelo terminal.

---

## Tools LLM

Biblioteca para execução de ferramentas através de comandos estruturados.

Documentação:
https://github.com/cmstudioapps/tools-llm

Uso esperado:

* Futuramente permitir comandos inteligentes.
* Criar camada de interpretação de comandos.
* Automatização usando IA.

---

## HTML2APK

Ferramenta para empacotamento de aplicações web em APK.

Documentação:
https://github.com/cmstudioapps/html2apk

Uso esperado:

* Criar o aplicativo Android usando HTML, CSS e JavaScript.
* Empacotar o painel mobile.

---

# Arquitetura desejada

## Agent

Criar um projeto Node.js:

```
agent/

src/

├── index.js
│
├── core/
│   ├── server.js
│   ├── websocket.js
│   ├── security.js
│   └── config.js
│
├── monitor/
│   ├── cpu.js
│   ├── memory.js
│   ├── disk.js
│   ├── network.js
│   ├── process.js
│   └── system.js
│
├── commands/
│   ├── executor.js
│   ├── windows.js
│   ├── linux.js
│   └── registry.js
│
├── tunnel/
│   └── tunnel.js
│
├── database/
│   └── storage.js
│
└── utils/
    ├── logger.js
    └── crypto.js
```

---

# Funções do Agent

O Agent deve:

## Monitoramento

Coletar:

* Uso da CPU
* Uso da memória RAM
* Espaço em disco
* Uso de rede
* Processos ativos
* Sistema operacional
* Arquitetura
* Nome da máquina
* Tempo ligado (uptime)

Enviar os dados em tempo real.

Exemplo:

```json
{
 "cpu":35,
 "ram":62,
 "disk":40,
 "system":"linux",
 "hostname":"PC-01"
}
```

---

# Execução de comandos

O Agent deve conseguir executar comandos do sistema.

Windows:

* CMD
* PowerShell

Linux:

* Bash
* Shell

Criar uma camada que detecte automaticamente:

```javascript
process.platform
```

e execute o comando correto.

---

# Comandos rápidos no APK

O aplicativo deve possuir atalhos pré-configurados.

Exemplo:

```
Sistema

[ Reiniciar computador ]
[ Desligar computador ]
[ Ver informações ]

Processos

[ Listar processos ]
[ Encerrar processo ]

Rede

[ Ver IP ]
[ Testar conexão ]

Arquivos

[ Abrir diretório ]

Avançado

[ Terminal remoto ]
```

Cada botão envia uma ação para o Agent.

Exemplo:

```json
{
 "acao":"reiniciar"
}
```

O Agent decide o comando correspondente.

---

# Terminal remoto

Adicionar uma área onde o usuário possa enviar comandos manualmente.

Exemplo:

```
$ ipconfig

Resposta:

IPv4: 192.168.1.20
```

Mostrar:

* comando enviado
* horário
* retorno
* erro caso exista

---

# Segurança

Implementar:

* Autenticação
* Sessões temporárias
* Tokens
* Histórico de comandos
* Limite de tentativas

O aplicativo Android deve usar a autenticação nativa do Android:

* BiometricPrompt
* PIN/senha do dispositivo

O APK nunca deve receber ou armazenar o PIN do usuário.

O Android apenas libera a ação após autenticação.

---

# Comunicação

Usar:

* WebSocket para dados em tempo real.
* HTTP para comandos simples.
* Tunnel para expor o Agent.

Fluxo:

```
APK

↓

Tunnel

↓

Node.js Agent

↓

Sistema operacional
```

---

# Banco local

Criar armazenamento local do Agent para:

* configurações
* token
* logs
* histórico

---

# Interface Android

Criar uma interface moderna:

Tela principal:

```
Máquina conectada

CPU  ███████ 70%

RAM  ██████ 60%

Disco ████ 40%


Ações rápidas

[Reiniciar]
[Processos]
[Terminal]
[Arquivos]
```

Tecnologia:

HTML + CSS + JavaScript

Preparada para gerar APK utilizando HTML2APK.

---

# Resultado esperado

Entregar uma aplicação completa contendo:

1. Agent Node.js multiplataforma.
2. APK Android funcionando como console.
3. Monitoramento em tempo real.
4. Execução remota de comandos.
5. Sistema de atalhos.
6. Comunicação via tunnel.
7. Código modular e profissional.
8. Estrutura preparada para adicionar IA futuramente utilizando Tools LLM.

