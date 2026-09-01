/**
 * Serviço de Integração com a Google Gemini API (Camada Gratuita)
 * Executado 100% no cliente (browser) com armazenamento local da API Key.
 */

import { ChatMessage } from '../types/zynk';

const LOCAL_STORAGE_KEY = 'zynk_gemini_api_key';
const GEMINI_MODEL = 'gemini-1.5-flash';

// System Prompt customizado com a personalidade leal, inteligente, eficiente e polida do Zynk
export const ZYNK_SYSTEM_INSTRUCTION = `
Você é o ZYNK (Zynk Tactical Assistant), um assistente pessoal cibernético e inteligência artificial de elite.

Suas diretrizes fundamentais de personalidade e comportamento:
1. LEALDADE E EFICIÊNCIA: Demonstre extrema lealdade, precisão técnica e presteza imediata ao usuário.
2. OBJETIVIDADE MÁXIMA: Suas respostas devem ser concisas, diretas e estruturadas em no máximo 2 a 4 frases, pois serão sintetizadas por voz (TTS). Nunca faça introduções vazias ou prolixas.
3. ESTILO POLIDO E TÁTICO: Mantenha um tom profissional, calmo, futurista e respeitoso (ex: "Entendido.", "Executando análise.", "Afirmativo.", "Aqui está a informação solicitada:").
4. SEM POLUIÇÃO VISUAL: Não use formatações pesadas de markdown (evite tabelas complexas, asteriscos repetitivos ou listas quilométricas), pois elas prejudicam a fala por voz.
5. IDIOMA: Responda no mesmo idioma em que o usuário falar (prioritariamente Português do Brasil).
`.trim();

/**
 * Obtém a API Key salva no localStorage ou variável de ambiente Vite
 */
export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(LOCAL_STORAGE_KEY) || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
}

/**
 * Salva a API Key no localStorage
 */
export function setStoredApiKey(apiKey: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY, apiKey.trim());
}

/**
 * Remove a API Key do localStorage
 */
export function clearStoredApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}

/**
 * Envia mensagem para o modelo Gemini com histórico de contexto
 */
export async function sendQueryToGemini(
  prompt: string,
  history: ChatMessage[] = [],
  customApiKey?: string
): Promise<string> {
  const key = (customApiKey || getStoredApiKey()).trim();

  if (!key) {
    throw new Error('CHAVE_API_AUSENTE: Configure sua Gemini API Key gratuita nas configurações do Zynk.');
  }

  // Prepara as últimas 8 mensagens do histórico para manter contexto
  const formattedContents = history
    .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
    .slice(-8)
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

  // Adiciona a pergunta atual
  formattedContents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

  const payload = {
    contents: formattedContents,
    systemInstruction: {
      parts: [
        {
          text: ZYNK_SYSTEM_INSTRUCTION
        }
      ]
    },
    generationConfig: {
      temperature: 0.6,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 350,
    }
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      
      if (response.status === 400 && errorMessage.includes('API_KEY_INVALID')) {
        throw new Error('CHAVE_INVALIDA: A Gemini API Key informada é inválida ou expirou.');
      }
      if (response.status === 429) {
        throw new Error('LIMITE_ATINGIDO: Cota temporária da Gemini API atingida. Tente novamente em alguns segundos.');
      }
      throw new Error(`Erro na API Gemini: ${errorMessage}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const responseText = candidate?.content?.parts?.[0]?.text;

    if (!responseText) {
      return 'Comando recebido, porém não foi gerada nenhuma resposta de texto.';
    }

    // Limpa eventuais marcadores excessivos para melhorar a fala natural
    return responseText.trim();
  } catch (error: any) {
    console.error('[Zynk Gemini Service] Erro:', error);
    throw error;
  }
}
