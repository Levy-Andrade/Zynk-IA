/**
 * ZynkHud - Componente Gráfico da Interface Futurista HUD
 * Renderiza o reator central, ondas sonoras dinâmicas e telemetria sci-fi em HTML5 Canvas.
 */

import React, { useRef, useEffect } from 'react';
import { ZynkState } from '../types/zynk';
import { Mic, MicOff, Volume2, Sparkles, AlertCircle } from 'lucide-react';

interface ZynkHudProps {
  state: ZynkState;
  audioLevel: number;
  transcript: string;
  meetingMode: boolean;
  onCoreClick: () => void;
}

export const ZynkHud: React.FC<ZynkHudProps> = ({
  state,
  audioLevel,
  transcript,
  meetingMode,
  onCoreClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;
    let waveOffset = 0;

    // Partículas flutuantes ambientais
    const particles = Array.from({ length: 32 }, () => ({
      x: (Math.random() - 0.5) * 260,
      y: (Math.random() - 0.5) * 260,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.4 + 0.2,
      opacity: Math.random() * 0.7 + 0.3,
      angle: Math.random() * Math.PI * 2
    }));

    const render = () => {
      // Ajusta para densidade de pixels Retina / High DPI
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.26;

      angle += 0.015;
      waveOffset += 0.06;

      // 1. Cores dinâmicas de acordo com o estado do Zynk
      let primaryColor = '#00f0ff';   // Ciano padrão (Cyan Neon)
      let secondaryColor = '#0070f3'; // Azul elétrico
      let glowColor = 'rgba(0, 240, 255, 0.4)';

      if (state === 'listening_command') {
        primaryColor = '#00ffaa';     // Esmeralda brilhante (Ouvindo comando)
        secondaryColor = '#00f0ff';
        glowColor = 'rgba(0, 255, 170, 0.6)';
      } else if (state === 'processing') {
        primaryColor = '#bd00ff';     // Roxo cibernético (Processando IA)
        secondaryColor = '#0070f3';
        glowColor = 'rgba(189, 0, 255, 0.6)';
      } else if (state === 'speaking') {
        primaryColor = '#00f0ff';     // Ciano vibrante com pulso
        secondaryColor = '#38bdf8';
        glowColor = 'rgba(0, 240, 255, 0.8)';
      } else if (state === 'error') {
        primaryColor = '#ff3366';     // Vermelho neon (Erro)
        secondaryColor = '#ff0055';
        glowColor = 'rgba(255, 51, 102, 0.6)';
      }

      // 2. Renderização de Partículas Orbitais
      particles.forEach((p) => {
        p.angle += p.speed * 0.01;
        const currentDist = Math.sqrt(p.x * p.x + p.y * p.y);
        const dynamicDist = currentDist + Math.sin(angle * 2 + p.angle) * 3 * (1 + audioLevel);
        const px = centerX + Math.cos(p.angle) * dynamicDist;
        const py = centerY + Math.sin(p.angle) * dynamicDist;

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = primaryColor;
        ctx.globalAlpha = p.opacity * (0.3 + audioLevel * 0.7);
        ctx.shadowBlur = 8;
        ctx.shadowColor = primaryColor;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // 3. Anel Externo Holográfico com Marcações Sci-Fi
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle * 0.4);

      ctx.beginPath();
      ctx.arc(0, 0, baseRadius + 38, 0, Math.PI * 2);
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.stroke();

      // Marcações no anel externo
      for (let i = 0; i < 12; i++) {
        const segAngle = (i * Math.PI) / 6;
        const r1 = baseRadius + 34;
        const r2 = baseRadius + 42;
        ctx.beginPath();
        ctx.moveTo(Math.cos(segAngle) * r1, Math.sin(segAngle) * r1);
        ctx.lineTo(Math.cos(segAngle) * r2, Math.sin(segAngle) * r2);
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = i % 3 === 0 ? 2.5 : 1;
        ctx.stroke();
      }
      ctx.restore();

      // 4. Anel Intermediário Giratório Invertido
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-angle * 0.6);

      ctx.beginPath();
      ctx.arc(0, 0, baseRadius + 18, 0, Math.PI * 1.5);
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = primaryColor;
      ctx.setLineDash([12, 18, 30, 8]);
      ctx.stroke();
      ctx.restore();

      // 5. Ondas Sonoras Dinâmicas Circulares (Visualizador de Áudio)
      ctx.save();
      ctx.translate(centerX, centerY);

      const wavePoints = 48;
      ctx.beginPath();

      for (let i = 0; i <= wavePoints; i++) {
        const rad = (i / wavePoints) * Math.PI * 2;
        // Modulação da onda conforme áudio e harmônicos
        const waveAmp = (state === 'speaking' || state === 'listening_command' ? 18 : 6) * audioLevel;
        const waveFreq = Math.sin(rad * 6 + waveOffset) * waveAmp + Math.cos(rad * 3 - waveOffset) * (waveAmp * 0.5);
        const currentR = baseRadius + waveFreq;

        const x = Math.cos(rad) * currentR;
        const y = Math.sin(rad) * currentR;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 15 + audioLevel * 20;
      ctx.shadowColor = primaryColor;
      ctx.stroke();

      // Gradiente interno do núcleo
      const coreGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, baseRadius);
      coreGrad.addColorStop(0, primaryColor);
      coreGrad.addColorStop(0.5, secondaryColor);
      coreGrad.addColorStop(1, 'rgba(4, 7, 17, 0.85)');

      ctx.fillStyle = coreGrad;
      ctx.globalAlpha = 0.25 + audioLevel * 0.35;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();

      // 6. Núcleo Central de Energia Pulsante
      ctx.save();
      ctx.translate(centerX, centerY);

      const pulseRadius = (baseRadius * 0.45) * (1 + audioLevel * 0.25);
      const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, pulseRadius);
      centerGrad.addColorStop(0, '#ffffff');
      centerGrad.addColorStop(0.3, primaryColor);
      centerGrad.addColorStop(1, 'rgba(0, 112, 243, 0)');

      ctx.beginPath();
      ctx.arc(0, 0, pulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = centerGrad;
      ctx.shadowBlur = 25;
      ctx.shadowColor = primaryColor;
      ctx.fill();
      ctx.restore();

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, audioLevel]);

  // Rótulos e badges de telemetria
  const getStatusInfo = () => {
    switch (state) {
      case 'listening_hotword':
        return {
          label: 'STANDBY // AGUARDANDO "OK ZYNK"',
          color: 'text-zynk-cyan border-zynk-cyan/40 bg-zynk-cyan/10',
          dot: 'bg-zynk-cyan animate-pulse',
          icon: Mic
        };
      case 'listening_command':
        return {
          label: 'CAPTURA ATIVA // OUVINDO COMANDO...',
          color: 'text-zynk-emerald border-zynk-emerald/40 bg-zynk-emerald/10',
          dot: 'bg-zynk-emerald animate-ping',
          icon: Mic
        };
      case 'processing':
        return {
          label: 'PROCESSANDO // CONSULTANDO GEMINI...',
          color: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
          dot: 'bg-purple-400 animate-pulse',
          icon: Sparkles
        };
      case 'speaking':
        return {
          label: meetingMode ? 'MODO REUNIÃO // EXIBINDO TEXTO' : 'TRANSMISSÃO // ZYNK FALANDO',
          color: 'text-sky-400 border-sky-400/40 bg-sky-400/10',
          dot: 'bg-sky-400 animate-pulse',
          icon: Volume2
        };
      case 'error':
        return {
          label: 'ALERTA // FALHA NO SISTEMA DE VOZ',
          color: 'text-zynk-crimson border-zynk-crimson/40 bg-zynk-crimson/10',
          dot: 'bg-zynk-crimson',
          icon: AlertCircle
        };
      default:
        return {
          label: 'SISTEMA INATIVO // TOQUE PARA FALAR',
          color: 'text-slate-400 border-slate-700 bg-slate-900/50',
          dot: 'bg-slate-500',
          icon: MicOff
        };
    }
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-lg mx-auto py-2 select-none">
      {/* Container do Canvas Interativo */}
      <div
        onClick={onCoreClick}
        className="relative w-72 h-72 sm:w-84 sm:h-84 cursor-pointer group flex items-center justify-center"
        title="Clique para ativar voz direta ou pausar resposta"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full drop-shadow-[0_0_25px_rgba(0,240,255,0.25)] transition-transform duration-300 group-hover:scale-105"
        />

        {/* Overlay central com botão holográfico discreto */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center shadow-glass transition-all duration-300 group-hover:border-zynk-cyan/80 group-hover:bg-zynk-cyan/20">
            <StatusIcon className={`w-7 h-7 ${status.color.split(' ')[0]} transition-transform duration-300 group-hover:scale-110`} />
          </div>
        </div>
      </div>

      {/* Badge de Telemetria e Status */}
      <div className="mt-3 flex flex-col items-center gap-2">
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono font-semibold uppercase tracking-wider backdrop-blur-md shadow-glass transition-all duration-300 ${status.color}`}
        >
          <span className={`w-2 h-2 rounded-full ${status.dot}`} />
          <span>{status.label}</span>
        </div>

        {/* Feedback de Transcrição em Tempo Real */}
        {transcript && (
          <div className="max-w-md px-4 py-1.5 text-center text-xs font-mono text-zynk-cyan/90 bg-zynk-deepBlue/80 border border-zynk-border rounded-lg backdrop-blur-sm animate-pulse">
            &gt; "{transcript}"
          </div>
        )}
      </div>
    </div>
  );
};
