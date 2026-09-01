# ⚡ ZYNK // Tactical AI Assistant (PWA)

Assistente Pessoal Web App (PWA) com arquitetura **100% Custo Zero**, executado inteiramente no navegador com deploy otimizado para a **Vercel**.

O **Zynk** combina a inteligência tática da **Google Gemini API** (camada gratuita) com as **Web Speech APIs nativas** (reconhecimento de voz contínuo com ativação pela palavra-chave *"Ok Zynk"* e sintetizador de fala) e uma interface HUD futurista em **HTML5 Canvas**.

---

## ✨ Principais Funcionalidades

- **🎙️ Ativação por Palavra-Chave ("Ok Zynk")**: O aplicativo monitora o microfone de forma contínua em segundo plano utilizando `webkitSpeechRecognition` nativo. Ao ouvir *"Ok Zynk"* (ou variações fonéticas como *"Ok Zinc"*, *"Hey Zynk"*), emite um chime sci-fi sintetizado via Web Audio API e captura seu comando de voz.
- **🔇 Alternador de Modo Reunião (Silent vs Voice)**:
  - **Modo Padrão**: Zynk fala a resposta em áudio e atualiza a telemetria do HUD.
  - **Modo Reunião**: Respostas silenciosas diretamente em cartões de texto com badge dedicado.
- **🧠 IA com Google Gemini (Free Tier)**: System prompt tático, leal, direto e conciso, evitando prolixidade e otimizado para voz. A API Key é armazenada com segurança no `localStorage` do seu navegador.
- **🌐 HUD Futurista (Zyntek HUD)**: Visualizador de áudio circular em Canvas de alta performance (60 FPS) que pulsa e reage harmonicamente aos níveis de áudio de fala e escuta.
- **📱 PWA Nativo**: Instalável diretamente no Desktop (Chrome/Edge) e Mobile (Android/iOS) como um aplicativo nativo independente.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior.
- Navegador baseado em Chromium (Google Chrome, Microsoft Edge, Brave) ou Safari com permissão de microfone habilitada.

### Passo a Passo
1. **Clone ou acerte o diretório do projeto**:
   ```bash
   cd zynk-pwa
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

4. **Acesse no navegador**:
   Abra `http://localhost:5173`

---

## 🔑 Como Obter a Gemini API Key Gratuita

1. Acesse o [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Faça login com sua conta Google.
3. Clique em **"Create API Key"** (Criar Chave de API).
4. Copie a chave gerada.
5. No Zynk, clique no ícone de **Configurações (⚙️)** no canto superior direito e cole sua chave no campo **Google Gemini API Key**.
6. Clique em **"SALVAR PREFERÊNCIAS"**. Sua chave ficará salva localmente no navegador!

---

## ☁️ Como Fazer Deploy Gratuito na Vercel

O projeto já inclui o arquivo [`vercel.json`](file:///C:/Users/levya/.gemini/antigravity/scratch/zynk-pwa/vercel.json) pré-configurado para roteamento SPA e permissões de microfone PWA.

### Opção 1: Deploy via Vercel CLI
```bash
npm install -g vercel
vercel
```

### Opção 2: Deploy via GitHub + Vercel Dashboard
1. Crie um repositório no seu GitHub e suba o código do Zynk:
   ```bash
   git init
   git add .
   git commit -m "feat: Zynk Tactical AI PWA inicial"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/zynk-pwa.git
   git push -u origin main
   ```
2. Acesse [vercel.com](https://vercel.com) e faça login.
3. Clique em **"Add New Project"** e importe o repositório do Zynk.
4. Framework Preset: **Vite**.
5. Clique em **"Deploy"**. Seu assistente estará online em segundos com certificado SSL/HTTPS (obrigatório para microfone no navegador)!

---

## 📂 Estrutura de Arquivos

```
zynk-pwa/
├── public/
│   ├── favicon.svg          # Logotipo vetorial neon do Zynk
│   └── manifest.json        # Configuração PWA para instalação no celular/desktop
├── src/
│   ├── components/
│   │   ├── ChatFeed.tsx     # Lista de mensagens com suporte ao Modo Reunião
│   │   ├── SettingsModal.tsx# Configurações de API Key, vozes e parâmetros
│   │   └── ZynkHud.tsx      # Canvas reativo com radar e ondas sonoras sci-fi
│   ├── hooks/
│   │   └── useZynkSpeech.ts # Hook com SpeechRecognition e SpeechSynthesis nativos
│   ├── services/
│   │   └── geminiService.ts # Integração com Gemini API REST e System Prompt do Zynk
│   ├── types/
│   │   └── zynk.ts          # Interfaces TypeScript do assistente e Web Speech
│   ├── utils/
│   │   └── audioEffects.ts  # Sintetizador de áudio Web Audio API (chimes HUD)
│   ├── ZynkApp.tsx          # Componente mestre da aplicação
│   ├── index.css            # Estilos Tailwind, glassmorphism e cores neon
│   └── main.tsx             # Ponto de entrada do React
├── index.html               # Documento raiz com fontes sci-fi e metadados PWA
├── package.json             # Dependências
├── tailwind.config.js       # Paleta futurista e animações sci-fi
├── tsconfig.json            # Configurações TypeScript
├── vercel.json              # Configuração de rotas SPA e headers para Vercel
├── vite.config.ts           # Configuração de build do Vite
└── README.md                # Este manual
```

---

## 🛠️ Tecnologias Utilizadas

- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS** (Tema Escuro Futurista, Glassmorphism, Neon Glow)
- **Web Speech API** (`SpeechRecognition` + `SpeechSynthesis`)
- **Web Audio API** (Sintetizador acústico de chimes cibernéticos em tempo real)
- **Google Gemini API** (`gemini-1.5-flash` na camada gratuita)
- **Lucide React** (Ícones táteis)

---

## 🛡️ Privacidade e Segurança

- 🔒 **Zero Telemetria de Servidor**: Nenhuma conversa passa por servidores intermediários proprietários.
- 🔑 **API Key no Navegador**: Sua chave é guardada unicamente no `localStorage` do seu próprio dispositivo.
- ⚡ **Áudio 100% Processado no Dispositivo**: O reconhecimento contínuo da palavra *"Ok Zynk"* e a síntese de voz utilizam os mecanismos nativos do próprio browser.
