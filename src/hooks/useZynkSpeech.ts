/**
 * Hook customizado para gerenciar nativamente Web Speech APIs
 * (SpeechRecognition contínuo com Wake-Word "Ok Zynk" e SpeechSynthesis)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ZynkState, ISpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from '../types/zynk';
import { zynkAudio } from '../utils/audioEffects';

// Padrões fonéticos e variações para detecção da palavra-chave "Ok Zynk"
const HOTWORD_PATTERNS = [
  /ok\s*zynk/i,
  /ok\s*zinc/i,
  /ok\s*zync/i,
  /ok\s*zink/i,
  /hey\s*zynk/i,
  /ei\s*zynk/i,
  /e\s*aí\s*zynk/i,
  /ola\s*zynk/i,
  /olá\s*zynk/i,
  /\bzynk\b/i,
  /\bzinc\b/i
];

interface UseZynkSpeechProps {
  continuousListening: boolean;
  meetingMode: boolean;
  voiceName: string;
  rate: number;
  pitch: number;
  onCommandCaptured: (command: string) => void;
}

export function useZynkSpeech({
  continuousListening,
  meetingMode,
  voiceName,
  rate,
  pitch,
  onCommandCaptured
}: UseZynkSpeechProps) {
  const [state, setState] = useState<ZynkState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const isListeningRef = useRef<boolean>(false);
  const isContinuousEnabledRef = useRef<boolean>(continuousListening);
  const isProcessingRef = useRef<boolean>(false);
  const audioAnimationRef = useRef<number | null>(null);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentCommandRef = useRef<string>('');

  // Sincroniza refs com props
  useEffect(() => {
    isContinuousEnabledRef.current = continuousListening;
  }, [continuousListening]);

  // Carrega e atualiza vozes disponíveis do navegador
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Simulação de oscilação do nível de áudio durante estados de fala ou escuta para alimentar o HUD
  useEffect(() => {
    const updateAudioWave = () => {
      if (state === 'listening_command' || state === 'speaking') {
        // Gera oscilação rítmica natural baseada em harmônicos
        const time = Date.now() / 150;
        const base = Math.sin(time) * 0.3 + Math.sin(time * 2.3) * 0.2 + 0.5;
        setAudioLevel(Math.min(1, Math.max(0.15, base)));
      } else if (state === 'listening_hotword') {
        // Pulso suave de respiração no estado de background
        const time = Date.now() / 400;
        setAudioLevel(0.15 + Math.sin(time) * 0.08);
      } else {
        setAudioLevel(0.05);
      }

      audioAnimationRef.current = requestAnimationFrame(updateAudioWave);
    };

    audioAnimationRef.current = requestAnimationFrame(updateAudioWave);

    return () => {
      if (audioAnimationRef.current) {
        cancelAnimationFrame(audioAnimationRef.current);
      }
    };
  }, [state]);

  /**
   * Limpa buffer de comando e reseta temporizadores
   */
  const resetCommandState = useCallback(() => {
    currentCommandRef.current = '';
    setTranscript('');
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  /**
   * Processa texto capturado e verifica ocorrência de Wake-Word
   */
  const handleTranscriptResult = useCallback(
    (text: string, isFinal: boolean) => {
      const cleanText = text.trim();
      if (!cleanText) return;

      setTranscript(cleanText);

      // Estado 1: Escuta de Palavra-Chave ("Ok Zynk")
      if (state === 'listening_hotword' || state === 'idle') {
        for (const pattern of HOTWORD_PATTERNS) {
          const match = cleanText.match(pattern);
          if (match && match.index !== undefined) {
            // Wake word detectado!
            zynkAudio.playWakeWordChime();
            setState('listening_command');

            // Verifica se o usuário já falou o comando na mesma sentença (ex: "Ok Zynk que horas são?")
            const commandAfterHotword = cleanText.slice(match.index + match[0].length).replace(/^[,.:;! ]+/, '').trim();

            if (commandAfterHotword.length > 2 && isFinal) {
              // Dispara comando direto
              resetCommandState();
              isProcessingRef.current = true;
              setState('processing');
              onCommandCaptured(commandAfterHotword);
              return;
            } else if (commandAfterHotword.length > 0) {
              currentCommandRef.current = commandAfterHotword;
            }
            return;
          }
        }
      }

      // Estado 2: Escuta do Comando Ativo
      if (state === 'listening_command') {
        // Remove eventual repetição do hotword do início
        let actualCommand = cleanText;
        for (const pattern of HOTWORD_PATTERNS) {
          actualCommand = actualCommand.replace(pattern, '').trim();
        }

        if (actualCommand) {
          currentCommandRef.current = actualCommand;
        }

        // Se a fala finalizou ou houve silêncio
        if (isFinal && currentCommandRef.current.length > 1) {
          const finalCommand = currentCommandRef.current;
          resetCommandState();
          isProcessingRef.current = true;
          setState('processing');
          zynkAudio.playProcessingChime();
          onCommandCaptured(finalCommand);
        } else {
          // Timeout de silêncio para disparar caso isFinal demore no browser mobile
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = setTimeout(() => {
            if (currentCommandRef.current.length > 1 && !isProcessingRef.current) {
              const finalCommand = currentCommandRef.current;
              resetCommandState();
              isProcessingRef.current = true;
              setState('processing');
              zynkAudio.playProcessingChime();
              onCommandCaptured(finalCommand);
            }
          }, 2200);
        }
      }
    },
    [state, onCommandCaptured, resetCommandState]
  );

  /**
   * Inicializa instância do SpeechRecognition
   */
  const initSpeechRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      setErrorMessage('Seu navegador não suporta a Web Speech API. Use Google Chrome, Edge ou Safari atualizados.');
      return null;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setErrorMessage(null);
        setState((prev) => (prev === 'idle' ? (isContinuousEnabledRef.current ? 'listening_hotword' : 'idle') : prev));
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        handleTranscriptResult(currentText, Boolean(finalTranscript));
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('[Zynk Speech] Erro no reconhecimento:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Permissão de microfone negada. Conceda acesso ao microfone nas configurações do navegador.');
          setState('error');
          isListeningRef.current = false;
        } else if (event.error === 'network') {
          setErrorMessage('Falha de conexão com o serviço nativo de fala.');
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        // Auto-reinicia se o modo contínuo estiver ativado e não estivermos processando/falando
        if (isContinuousEnabledRef.current && !isProcessingRef.current) {
          setTimeout(() => {
            try {
              if (recognitionRef.current && isContinuousEnabledRef.current) {
                recognitionRef.current.start();
                setState('listening_hotword');
              }
            } catch (e) {
              // Já iniciado ou ignorar
            }
          }, 250);
        } else if (!isProcessingRef.current) {
          setState('idle');
        }
      };

      return recognition;
    } catch (err: any) {
      console.error('[Zynk Speech] Erro ao instanciar SpeechRecognition:', err);
      setIsSupported(false);
      return null;
    }
  }, [handleTranscriptResult]);

  /**
   * Inicia escuta
   */
  const startListening = useCallback(
    (isDirectCommand: boolean = false) => {
      if (!recognitionRef.current) {
        recognitionRef.current = initSpeechRecognition();
      }

      if (isDirectCommand) {
        zynkAudio.playWakeWordChime();
        setState('listening_command');
        resetCommandState();
      }

      try {
        if (!isListeningRef.current && recognitionRef.current) {
          recognitionRef.current.start();
        }
      } catch (e) {
        // Já em execução
      }
    },
    [initSpeechRecognition, resetCommandState]
  );

  /**
   * Para reconhecimento
   */
  const stopListening = useCallback(() => {
    isContinuousEnabledRef.current = false;
    resetCommandState();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setState('idle');
  }, [resetCommandState]);

  /**
   * Síntese de voz com SpeechSynthesis nativo
   */
  const speak = useCallback(
    (text: string, onEndCallback?: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        onEndCallback?.();
        return;
      }

      // Se o Modo Reunião estiver ativo, não emite áudio por voz
      if (meetingMode) {
        setState('idle');
        isProcessingRef.current = false;
        onEndCallback?.();
        // Reinicia escuta contínua se ativada
        if (isContinuousEnabledRef.current) {
          startListening(false);
        }
        return;
      }

      // Cancela qualquer fala anterior
      window.speechSynthesis.cancel();

      // Limpa texto para fala limpa
      const spokenText = text
        .replace(/[*_#`~>\[\]]/g, '')
        .replace(/\bhttps?:\/\/\S+/gi, 'link')
        .trim();

      if (!spokenText) {
        setState('idle');
        isProcessingRef.current = false;
        onEndCallback?.();
        return;
      }

      setState('speaking');
      zynkAudio.playResponseChime();

      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.rate = Math.max(0.7, Math.min(1.8, rate || 1.05));
      utterance.pitch = Math.max(0.5, Math.min(1.5, pitch || 1.0));
      utterance.lang = 'pt-BR';

      // Seleção de voz personalizada ou melhor voz disponível em português
      if (voiceName) {
        const selected = availableVoices.find((v) => v.name === voiceName);
        if (selected) utterance.voice = selected;
      } else {
        const ptVoice = availableVoices.find(
          (v) => v.lang.includes('pt-BR') || v.lang.includes('pt_BR') || v.lang.startsWith('pt')
        );
        if (ptVoice) utterance.voice = ptVoice;
      }

      utterance.onend = () => {
        setState('idle');
        isProcessingRef.current = false;
        onEndCallback?.();

        // Volta a escutar hotword caso ativado
        if (isContinuousEnabledRef.current) {
          setTimeout(() => {
            startListening(false);
          }, 300);
        }
      };

      utterance.onerror = (e) => {
        console.warn('[Zynk Speech] Erro na síntese de voz:', e);
        setState('idle');
        isProcessingRef.current = false;
        onEndCallback?.();
        if (isContinuousEnabledRef.current) {
          startListening(false);
        }
      };

      window.speechSynthesis.speak(utterance);
    },
    [meetingMode, rate, pitch, voiceName, availableVoices, startListening]
  );

  /**
   * Cancela fala imediata
   */
  const cancelSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setState('idle');
    isProcessingRef.current = false;
  }, []);

  // Efeito para inicialização de escuta contínua na montagem
  useEffect(() => {
    recognitionRef.current = initSpeechRecognition();

    if (continuousListening) {
      startListening(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [initSpeechRecognition, continuousListening, startListening]);

  return {
    state,
    setState,
    transcript,
    isSupported,
    availableVoices,
    audioLevel,
    errorMessage,
    startListeningCommand: () => startListening(true),
    startListeningBackground: () => startListening(false),
    stopListening,
    speak,
    cancelSpeech,
    resetState: () => {
      resetCommandState();
      setState('idle');
      isProcessingRef.current = false;
    }
  };
}
