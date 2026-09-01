/**
 * ChatFeed - Componente de Histórico de Conversas e Cards de Resposta
 * Otimizado para exibição rápida e suporte total ao Modo Reunião (Silent Text).
 */

import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types/zynk';
import { Bot, User, Volume2, Copy, Check, Briefcase, Sparkles } from 'lucide-react';

interface ChatFeedProps {
  messages: ChatMessage[];
  onSpeakMessage: (text: string) => void;
  onSuggestionClick: (prompt: string) => void;
}

export const ChatFeed: React.FC<ChatFeedProps> = ({
  messages,
  onSpeakMessage,
  onSuggestionClick
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll para última mensagem
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const samplePrompts = [
    'Qual a previsão do tempo para hoje?',
    'Resuma os princípios da computação quântica em 2 frases.',
    'Defina uma rotina de alta produtividade para programadores.',
    'Explique a diferença entre Web Speech API e APIs de nuvem.'
  ];

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md p-5 rounded-2xl bg-zynk-card border border-zynk-border/60 backdrop-blur-xl shadow-glass">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-zynk-cyan/10 border border-zynk-cyan/30 text-zynk-cyan shadow-neon-cyan">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-base font-orbitron font-bold text-zynk-textBright mb-1">
            ZYNK TACTICAL AI ONLINE
          </h3>
          <p className="text-xs text-zynk-textMuted mb-4">
            Diga <span className="text-zynk-cyan font-semibold">"Ok Zynk"</span> seguido do seu comando ou clique nas sugestões táticas abaixo:
          </p>

          <div className="grid grid-cols-1 gap-2 text-left">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => onSuggestionClick(prompt)}
                className="px-3 py-2 text-xs font-mono rounded-lg bg-zynk-deepBlue/70 hover:bg-zynk-cyan/15 border border-zynk-border/50 hover:border-zynk-cyan/80 text-zynk-textBright transition-all duration-200 flex items-center justify-between group"
              >
                <span>&gt; {prompt}</span>
                <span className="text-zynk-cyan opacity-0 group-hover:opacity-100 transition-opacity">↵</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-zynk-border">
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        const isAssistant = msg.role === 'assistant';

        return (
          <div
            key={msg.id}
            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-2xl ${
              isUser ? 'ml-auto' : 'mr-auto'
            } transition-all duration-300 animate-fadeIn`}
          >
            {/* Header da Mensagem */}
            <div className="flex items-center gap-2 mb-1 px-1 text-[11px] font-mono text-zynk-textMuted">
              {isUser ? (
                <>
                  <span>OPERADOR</span>
                  <User className="w-3.5 h-3.5 text-zynk-neonBlue" />
                </>
              ) : (
                <>
                  <Bot className="w-3.5 h-3.5 text-zynk-cyan" />
                  <span className="font-semibold text-zynk-cyan">ZYNK AI</span>
                  {msg.isMeetingMode && (
                    <span className="flex items-center gap-1 text-[10px] bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/30">
                      <Briefcase className="w-2.5 h-2.5" /> MODO REUNIÃO
                    </span>
                  )}
                </>
              )}
              <span className="text-[10px] opacity-60">{msg.timestamp}</span>
            </div>

            {/* Corpo do Card */}
            <div
              className={`relative group p-3.5 sm:p-4 rounded-2xl text-sm backdrop-blur-xl border transition-all ${
                isUser
                  ? 'bg-gradient-to-br from-zynk-deepBlue/90 to-blue-950/80 border-blue-500/40 text-blue-50 shadow-glass rounded-tr-none'
                  : 'bg-gradient-to-br from-zynk-card to-slate-950/90 border-zynk-border/80 text-zynk-textBright shadow-glass rounded-tl-none hover:border-zynk-borderGlow'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed font-sans">{msg.text}</p>

              {/* Botões de Ação no Card do Zynk */}
              {isAssistant && (
                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onSpeakMessage(msg.text)}
                    className="p-1.5 rounded-md hover:bg-zynk-cyan/20 text-zynk-textMuted hover:text-zynk-cyan transition-colors"
                    title="Ouvir resposta por voz"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="p-1.5 rounded-md hover:bg-zynk-cyan/20 text-zynk-textMuted hover:text-zynk-cyan transition-colors"
                    title="Copiar texto"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-zynk-emerald" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={scrollEndRef} />
    </div>
  );
};
