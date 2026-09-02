/**
 * ZynkApp - Componente Principal da Aplicação Zynk AI
 * Orquestra a interface HUD, comandos de voz, Gemini API e modos de operação.
 */

import React, { useState, useCallback } from 'react';
import { ZynkHud } from './components/ZynkHud';
import { ChatFeed } from './components/ChatFeed';
import { SettingsModal } from './components/SettingsModal';
import { useZynkSpeech } from './hooks/useZynkSpeech';
import {
  sendQueryToGemini,
  getStoredApiKey,
  setStoredApiKey,
  getStoredProvider,
  setStoredProvider
} from './services/geminiService';
import { ChatMessage, ZynkSettings } from './types/zynk';
import { zynkAudio } from './utils/audioEffects';
import {
  Mic,
  Send,
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  Radio,
  AlertTriangle
} from 'lucide-react';

const DEFAULT_SETTINGS: ZynkSettings = {
  provider: 'groq',
  apiKey: '',
  voiceName: '',
  rate: 1.05,
  pitch: 1.0,
  continuousListening: true,
  meetingMode: false,
  hotwordSensitivity: 8
};

export const ZynkApp: React.FC = () => {
  // Configurações persistidas
  const [settings, setSettings] = useState<ZynkSettings>(() => {
    const storedKey = getStoredApiKey();
    const storedProvider = getStoredProvider();
    const storedSettings = localStorage.getItem('zynk_user_settings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        return { ...DEFAULT_SETTINGS, ...parsed, apiKey: storedKey, provider: parsed.provider || storedProvider };
      } catch (e) {}
    }
    return { ...DEFAULT_SETTINGS, apiKey: storedKey, provider: storedProvider };
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Executa query no Gemini e sintetiza resposta
  const handleExecuteCommand = useCallback(
    async (commandText: string) => {
      const cleanPrompt = commandText.trim();
      if (!cleanPrompt) return;

      const userMsgId = Date.now().toString();
      const userMessage: ChatMessage = {
        id: userMsgId,
        role: 'user',
        text: cleanPrompt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, userMessage]);
      setErrorMessage(null);

      try {
        const reply = await sendQueryToGemini(cleanPrompt, messages, settings.apiKey);

        const botMsgId = (Date.now() + 1).toString();
        const botMessage: ChatMessage = {
          id: botMsgId,
          role: 'assistant',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMeetingMode: settings.meetingMode
        };

        setMessages((prev) => [...prev, botMessage]);

        // Síntese de Voz (se não estiver em Modo Reunião)
        speechEngine.speak(reply);
      } catch (err: any) {
        console.error('[Zynk Execution Error]:', err);
        zynkAudio.playErrorTone();
        speechEngine.resetState();

        const errMsg = err.message || 'Erro inesperado ao consultar o assistente.';
        setErrorMessage(errMsg);

        const errorMsgObj: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: 'system',
          text: `⚠️ ${errMsg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, errorMsgObj]);

        if (errMsg.includes('CHAVE_API_AUSENTE')) {
          setIsSettingsOpen(true);
        }
      }
    },
    [messages, settings]
  );

  // Hook nativo de voz e SpeechRecognition
  const speechEngine = useZynkSpeech({
    continuousListening: settings.continuousListening,
    meetingMode: settings.meetingMode,
    voiceName: settings.voiceName,
    rate: settings.rate,
    pitch: settings.pitch,
    onCommandCaptured: handleExecuteCommand
  });

  // Salva preferências
  const handleSaveSettings = (newSettings: ZynkSettings) => {
    setSettings(newSettings);
    setStoredApiKey(newSettings.apiKey);
    localStorage.setItem('zynk_user_settings', JSON.stringify(newSettings));
  };

  // Alternador Rápido de Modo Reunião
  const toggleMeetingMode = () => {
    zynkAudio.playUiClick();
    const updated = !settings.meetingMode;
    if (updated) {
      speechEngine.cancelSpeech();
    }
    const newSettings = { ...settings, meetingMode: updated };
    handleSaveSettings(newSettings);
  };

  // Alternador de Escuta Contínua da Palavra-Chave "Ok Zynk"
  const toggleContinuousListening = () => {
    zynkAudio.playUiClick();
    const updated = !settings.continuousListening;
    const newSettings = { ...settings, continuousListening: updated };
    handleSaveSettings(newSettings);

    if (updated) {
      speechEngine.startListeningBackground();
    } else {
      speechEngine.stopListening();
    }
  };

  // Clique no Núcleo do HUD
  const handleHudCoreClick = () => {
    zynkAudio.playUiClick();
    if (speechEngine.state === 'speaking') {
      speechEngine.cancelSpeech();
    } else if (speechEngine.state === 'listening_command') {
      speechEngine.stopListening();
    } else {
      speechEngine.startListeningCommand();
    }
  };

  // Envio manual por texto
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || speechEngine.state === 'processing') return;
    const query = textInput;
    setTextInput('');
    handleExecuteCommand(query);
  };

  return (
    <div className="relative flex flex-col h-screen w-full bg-zynk-bg bg-radial-gradient text-zynk-textBright overflow-hidden font-sans">
      {/* Grade Futurista de Fundo e Scanline */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff08_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-zynk-cyan to-transparent opacity-70 animate-scanline pointer-events-none" />

      {/* NAVBAR SUPERIOR */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-zynk-border/40 bg-zynk-bg/80 backdrop-blur-xl">
        {/* Logotipo Zynk */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-zynk-cyan/20 to-blue-600/20 border border-zynk-cyan/50 shadow-neon-cyan">
            <span className="font-orbitron font-black text-lg text-zynk-cyan tracking-tighter">Z</span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-zynk-cyan animate-ping" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-orbitron font-bold text-base sm:text-lg tracking-wider bg-gradient-to-r from-white via-zynk-cyan to-blue-400 bg-clip-text text-transparent">
                ZYNK
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zynk-cyan/10 border border-zynk-cyan/30 text-zynk-cyan">
                v1.0 PWA
              </span>
            </div>
            <p className="text-[10px] font-mono text-zynk-textMuted tracking-tight hidden sm:block">
              TACTICAL AI // NATIVE WEB SPEECH
            </p>
          </div>
        </div>

        {/* Controles da Navbar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botão de Modo Reunião (Silent vs Voice) */}
          <button
            onClick={toggleMeetingMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all duration-300 border ${
              settings.meetingMode
                ? 'bg-amber-500/15 border-amber-500/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-black/40 border-white/10 text-zynk-textMuted hover:border-zynk-cyan/50 hover:text-white'
            }`}
            title="Alternar Modo Reunião (Respostas silenciosas em texto)"
          >
            {settings.meetingMode ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">MODO REUNIÃO</span>
                <span className="sm:hidden">REUNIÃO</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-zynk-cyan" />
                <span className="hidden sm:inline">MODO PADRÃO (VOZ)</span>
                <span className="sm:hidden">VOZ</span>
              </>
            )}
          </button>

          {/* Toggle Wake Word Daemon ("Ok Zynk") */}
          <button
            onClick={toggleContinuousListening}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all duration-300 border ${
              settings.continuousListening
                ? 'bg-zynk-cyan/15 border-zynk-cyan/60 text-zynk-cyan shadow-neon-cyan'
                : 'bg-black/40 border-white/10 text-slate-500 hover:text-slate-300'
            }`}
            title='Ativar/Desativar escuta contínua por "Ok Zynk"'
          >
            <Radio className={`w-3.5 h-3.5 ${settings.continuousListening ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">"OK ZYNK"</span>
          </button>

          {/* Botão de Configurações */}
          <button
            onClick={() => {
              zynkAudio.playUiClick();
              setIsSettingsOpen(true);
            }}
            className="p-2 rounded-xl bg-black/40 hover:bg-zynk-cyan/20 border border-white/10 hover:border-zynk-cyan/60 text-zynk-textMuted hover:text-zynk-cyan transition-all"
            title="Configurações e Chave Gemini"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* AVISO DE CHAVE OU ERRO */}
      {(!settings.apiKey || errorMessage || speechEngine.errorMessage) && (
        <div className="relative z-20 px-4 py-2 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-b border-amber-500/40 backdrop-blur-md flex items-center justify-between text-xs font-mono text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>
              {errorMessage ||
                speechEngine.errorMessage ||
                'Nenhuma Gemini API Key configurada. Insira sua chave gratuita para ativar a IA.'}
            </span>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-2.5 py-1 rounded bg-amber-500 text-black font-bold font-orbitron hover:bg-amber-400 transition-colors shrink-0"
          >
            CONFIGURAR
          </button>
        </div>
      )}

      {/* ÁREA PRINCIPAL DIVIDIDA: HUD + FEED DE CONVERSA */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row overflow-hidden max-w-7xl w-full mx-auto">
        {/* Painel Esquerdo / Superior: HUD Futurista Interativo */}
        <section className="flex flex-col items-center justify-center p-4 lg:w-5/12 border-b lg:border-b-0 lg:border-r border-zynk-border/30 backdrop-blur-sm">
          <ZynkHud
            state={speechEngine.state}
            audioLevel={speechEngine.audioLevel}
            transcript={speechEngine.transcript}
            meetingMode={settings.meetingMode}
            onCoreClick={handleHudCoreClick}
          />

          {/* Dica Rápida de Voz */}
          <div className="mt-2 text-center text-[11px] font-mono text-zynk-textMuted">
            {settings.continuousListening ? (
              <span>Fale <strong className="text-zynk-cyan">"Ok Zynk"</strong> para interagir</span>
            ) : (
              <span>Toque no reator ou no microfone para falar</span>
            )}
          </div>
        </section>

        {/* Painel Direito / Inferior: Histórico de Conversa */}
        <section className="flex-1 flex flex-col min-h-0 bg-black/20">
          <ChatFeed
            messages={messages}
            onSpeakMessage={(text) => speechEngine.speak(text)}
            onSuggestionClick={(prompt) => handleExecuteCommand(prompt)}
          />

          {/* BARRA DE COMANDO INFERIOR */}
          <div className="p-3 sm:p-4 border-t border-zynk-border/40 bg-zynk-bg/90 backdrop-blur-xl">
            <form onSubmit={handleTextSubmit} className="flex items-center gap-2 max-w-3xl mx-auto">
              {/* Botão de Microfone Principal */}
              <button
                type="button"
                onClick={handleHudCoreClick}
                className={`relative p-3 rounded-2xl border transition-all duration-300 flex items-center justify-center ${
                  speechEngine.state === 'listening_command'
                    ? 'bg-zynk-emerald text-black border-zynk-emerald shadow-neon-emerald scale-105'
                    : speechEngine.state === 'speaking'
                    ? 'bg-zynk-cyan text-black border-zynk-cyan shadow-neon-cyan'
                    : 'bg-zynk-deepBlue hover:bg-zynk-cyan/20 text-zynk-cyan border-zynk-border hover:border-zynk-cyan'
                }`}
                title="Ativar microfone de comando"
              >
                {speechEngine.state === 'listening_command' ? (
                  <Mic className="w-5 h-5 animate-pulse" />
                ) : speechEngine.state === 'speaking' ? (
                  <Volume2 className="w-5 h-5 animate-bounce" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              {/* Campo de Entrada de Texto */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={
                    speechEngine.state === 'listening_command'
                      ? 'Ouvindo comando de voz...'
                      : 'Digite uma mensagem ou fale "Ok Zynk"...'
                  }
                  disabled={speechEngine.state === 'processing'}
                  className="w-full px-4 py-3 rounded-2xl bg-zynk-card border border-zynk-border/80 focus:border-zynk-cyan focus:outline-none text-xs sm:text-sm font-sans text-zynk-textBright placeholder-zynk-textMuted/60 shadow-glass transition-all disabled:opacity-50"
                />
              </div>

              {/* Botão Enviar */}
              <button
                type="submit"
                disabled={!textInput.trim() || speechEngine.state === 'processing'}
                className="p-3 rounded-2xl bg-gradient-to-r from-zynk-cyan to-zynk-neonBlue text-black font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 shadow-neon-cyan transition-all flex items-center justify-center"
                title="Enviar comando"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* MODAL DE CONFIGURAÇÕES */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        availableVoices={speechEngine.availableVoices}
        onClearHistory={() => setMessages([])}
      />
    </div>
  );
};
