/**
 * Tipos e Interfaces para o Assistente Pessoal Zynk
 */

export type ZynkState =
  | 'idle'               // Em repouso, aguardando hotword ou clique
  | 'listening_hotword'  // Escuta contínua de background ("Ok Zynk")
  | 'listening_command'  // Capturando comando de voz ativo
  | 'processing'         // Consultando Gemini API
  | 'speaking'           // Falando resposta via Web SpeechSynthesis
  | 'error';             // Erro de microfone, API ou rede

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  isMeetingMode?: boolean;
}

export interface ZynkSettings {
  apiKey: string;
  voiceName: string;
  rate: number;          // 0.5 a 2.0 (velocidade da fala)
  pitch: number;         // 0.5 a 1.5 (tom da voz)
  continuousListening: boolean; // Ativa escuta em background do "Ok Zynk"
  meetingMode: boolean;  // Resposta silenciosa em texto
  hotwordSensitivity: number; // 1 a 10
}

// Declarações para a Web Speech API do navegador
export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onnomatch: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): ISpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new (): ISpeechRecognition;
    };
    webkitAudioContext?: typeof AudioContext;
  }
}
