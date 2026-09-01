/**
 * SettingsModal - Modal de Configurações do Zynk
 * Gerencia API Key do Gemini (salva em localStorage), Vozes da Web Speech API e preferências.
 */

import React, { useState } from 'react';
import { ZynkSettings } from '../types/zynk';
import {
  X,
  Key,
  Volume2,
  Sliders,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Mic,
  Briefcase
} from 'lucide-react';
import { zynkAudio } from '../utils/audioEffects';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ZynkSettings;
  onSaveSettings: (newSettings: ZynkSettings) => void;
  availableVoices: SpeechSynthesisVoice[];
  onClearHistory: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  availableVoices,
  onClearHistory
}) => {
  const [localSettings, setLocalSettings] = useState<ZynkSettings>(settings);
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    zynkAudio.playUiClick();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleTestVoice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance('Zynk operacional. Sintetizador de voz calibrado com sucesso.');
    utterance.rate = localSettings.rate;
    utterance.pitch = localSettings.pitch;
    utterance.lang = 'pt-BR';

    if (localSettings.voiceName) {
      const selected = availableVoices.find((v) => v.name === localSettings.voiceName);
      if (selected) utterance.voice = selected;
    }
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-zynk-deepBlue/95 border border-zynk-border shadow-2xl p-6 text-zynk-textBright overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-zynk-cyan/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header do Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-zynk-cyan" />
            <h2 className="text-lg font-orbitron font-bold tracking-wide">CONFIGURAÇÕES // ZYNK</h2>
          </div>
          <button
            onClick={() => {
              zynkAudio.playUiClick();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-white/10 text-zynk-textMuted hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário de Configuração */}
        <div className="mt-4 space-y-5 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zynk-border">
          {/* 1. Google Gemini API Key */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-mono font-semibold text-zynk-cyan uppercase">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> Google Gemini API Key (Grátis)
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-zynk-cyan/80 hover:text-zynk-cyan underline flex items-center gap-1"
              >
                Gerar chave gratuita <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </label>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={localSettings.apiKey}
                onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-zynk-border focus:border-zynk-cyan focus:outline-none text-xs font-mono text-white placeholder-slate-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-zynk-textMuted hover:text-zynk-cyan"
              >
                {showKey ? 'OCULTAR' : 'VER'}
              </button>
            </div>

            <p className="text-[11px] text-zynk-textMuted flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-zynk-emerald" />
              Salvo exclusivamente no seu navegador (localStorage). Custo zero.
            </p>
          </div>

          {/* 2. Seletor de Voz da Web Speech API */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-mono font-semibold text-zynk-cyan uppercase">
              <Volume2 className="w-3.5 h-3.5" /> Voz do Sintetizador Nativo
            </label>

            <div className="flex gap-2">
              <select
                value={localSettings.voiceName}
                onChange={(e) => setLocalSettings({ ...localSettings, voiceName: e.target.value })}
                className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-zynk-border focus:border-zynk-cyan focus:outline-none text-xs font-mono text-white transition-colors"
              >
                <option value="">Voz Padrão do Sistema (Automática)</option>
                {availableVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang}) {v.default ? '★' : ''}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleTestVoice}
                className="px-3 py-2 text-xs font-mono rounded-xl bg-zynk-cyan/15 hover:bg-zynk-cyan/30 border border-zynk-cyan/50 text-zynk-cyan transition-colors"
              >
                Testar
              </button>
            </div>
          </div>

          {/* 3. Sliders de Velocidade e Tom */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-zynk-textMuted">
                <span>Velocidade:</span>
                <span className="text-zynk-cyan font-bold">{localSettings.rate.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.6"
                step="0.1"
                value={localSettings.rate}
                onChange={(e) => setLocalSettings({ ...localSettings, rate: parseFloat(e.target.value) })}
                className="w-full accent-zynk-cyan cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-zynk-textMuted">
                <span>Tom (Pitch):</span>
                <span className="text-zynk-cyan font-bold">{localSettings.pitch.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.1"
                value={localSettings.pitch}
                onChange={(e) => setLocalSettings({ ...localSettings, pitch: parseFloat(e.target.value) })}
                className="w-full accent-zynk-cyan cursor-pointer"
              />
            </div>
          </div>

          {/* 4. Alternadores Rápidos */}
          <div className="pt-2 border-t border-white/10 space-y-3">
            {/* Wake Word Contínuo */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-zynk-border/40">
              <div className="flex items-center gap-2.5">
                <Mic className="w-4 h-4 text-zynk-cyan" />
                <div>
                  <div className="text-xs font-semibold font-mono">Palavra-Chave "Ok Zynk"</div>
                  <div className="text-[10px] text-zynk-textMuted">Escuta contínua em segundo plano</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.continuousListening}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, continuousListening: e.target.checked })
                }
                className="w-4 h-4 accent-zynk-cyan cursor-pointer"
              />
            </div>

            {/* Modo Reunião */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-zynk-border/40">
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-semibold font-mono">Modo Reunião Padrão</div>
                  <div className="text-[10px] text-zynk-textMuted">Respostas somente em texto silencioso</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.meetingMode}
                onChange={(e) => setLocalSettings({ ...localSettings, meetingMode: e.target.checked })}
                className="w-4 h-4 accent-amber-400 cursor-pointer"
              />
            </div>
          </div>

          {/* 5. Ação de Limpeza de Conversa */}
          <div className="pt-2 border-t border-white/10 flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Deseja limpar todo o histórico da conversa atual?')) {
                  onClearHistory();
                  zynkAudio.playUiClick();
                }
              }}
              className="flex items-center gap-1.5 text-xs font-mono text-red-400 hover:text-red-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Limpar Conversa
            </button>
          </div>
        </div>

        {/* Footer do Modal */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-mono text-zynk-textMuted hover:text-white transition-colors"
          >
            CANCELAR
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-orbitron font-bold bg-gradient-to-r from-zynk-cyan to-zynk-neonBlue text-black hover:opacity-90 shadow-neon-cyan transition-all"
          >
            {savedSuccess ? 'SALVO COM SUCESSO!' : 'SALVAR PREFERÊNCIAS'}
          </button>
        </div>
      </div>
    </div>
  );
};
