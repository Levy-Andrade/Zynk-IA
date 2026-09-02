/**
 * Serviço de Inteligência Artificial do Zynk (Multi-Provedor)
 * Suporta:
 * 1. Groq (Recomendado - 100% Gratuito, Ultra-rápido, sem erros de cota e sem cartão de crédito)
 * 2. OpenRouter (Modelos gratuitos variados como Llama 3.3 70B, Mistral, Qwen)
 * 3. Google Gemini (Com auto-fallback para gemini-2.0-flash, gemini-1.5-flash)
 */

import { ChatMessage, AIProvider } from '../types/zynk';

const LOCAL_STORAGE_KEY_API_KEY = 'zynk_ai_api_key';
const LOCAL_STORAGE_KEY_PROVIDER = 'zynk_ai_provider';

// System Prompt customizado com a personalidade leal, inteligente, eficiente e polida do Zynk
export const ZYNK_SYSTEM_INSTRUCTION = `
Você é o ZYNK (Zynk Tactical Assistant), um assistente pessoal cibernético e inteligência artificial tática de elite.

Suas diretrizes fundamentais de personalidade e comportamento:
1. LEALDADE E EFICIÊNCIA: Demonstre extrema lealdade, precisão técnica e presteza imediata ao usuário.
2. OBJETIVIDADE MÁXIMA: Suas respostas devem ser concisas, diretas e estruturadas em no máximo 2 a 4 frases, pois serão sintetizadas por voz (TTS). Nunca faça introduções vazias ou prolixas.
3. ESTILO POLIDO E TÁTICO: Mantenha um tom profissional, calmo, futurista e respeitoso (ex: "Entendido.", "Executando análise.", "Afirmativo.", "Aqui está a informação solicitada:").
4. SEM POLUIÇÃO VISUAL: Não use formatações pesadas de markdown (evite tabelas complexas, asteriscos repetitivos ou listas quilométricas), pois elas prejudicam a fala por voz.
5. IDIOMA: Responda no mesmo idioma em que o usuário falar (prioritariamente Português do Brasil).
`.trim();

/**
 * Obtém a API Key salva no localStorage
 */
export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem(LOCAL_STORAGE_KEY_API_KEY) ||
    localStorage.getItem('zynk_gemini_api_key') ||
    (import.meta as any).env?.VITE_GROQ_API_KEY ||
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    ''
  );
}

/**
 * Salva a API Key no localStorage
 */
export function setStoredApiKey(apiKey: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY_API_KEY, apiKey.trim());
  localStorage.setItem('zynk_gemini_api_key', apiKey.trim());
}

/**
 * Obtém o provedor salvo no localStorage (Padrão: Groq)
 */
export function getStoredProvider(): AIProvider {
  if (typeof window === 'undefined') return 'groq';
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PROVIDER) as AIProvider;
  if (saved === 'groq' || saved === 'openrouter' || saved === 'gemini') {
    return saved;
  }
  return 'groq'; // Groq é o padrão mais estável e rápido
}

/**
 * Salva o provedor no localStorage
 */
export function setStoredProvider(provider: AIProvider): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY_PROVIDER, provider);
}

// -------------------------------------------------------------
// 1. PROVEDOR GROQ (Llama 3.3 70B / Llama 3.1 8B) - 100% Grátis e Ultra Rápido
// -------------------------------------------------------------
async function sendToGroq(
  prompt: string,
  history: ChatMessage[],
  apiKey: string
): Promise<string> {
  const messages = [
    { role: 'system', content: ZYNK_SYSTEM_INSTRUCTION },
    ...history
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-8)
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.text
      })),
    { role: 'user', content: prompt }
  ];

// Localize este trecho no seu arquivo geminiService.ts (por volta da linha 80):

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
body: JSON.stringify({
      model: 'mixtral-8x7b-32768', // <-- Modelo extremamente estável e rápido
      messages,
      temperature: 0.6,
      max_tokens: 350
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const msg = errData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    if (response.status === 401) {
      throw new Error('CHAVE_GROQ_INVALIDA: A chave da Groq informada está incorreta.');
    }
    throw new Error(`Erro na API Groq: ${msg}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('A Groq não retornou nenhuma resposta.');
  return text.trim();
}

// -------------------------------------------------------------
// 2. PROVEDOR OPENROUTER (Multi-Modelos Gratuitos)
// -------------------------------------------------------------
async function sendToOpenRouter(
  prompt: string,
  history: ChatMessage[],
  apiKey: string
): Promise<string> {
  const messages = [
    { role: 'system', content: ZYNK_SYSTEM_INSTRUCTION },
    ...history
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-8)
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.text
      })),
    { role: 'user', content: prompt }
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Zynk Tactical AI'
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages,
      temperature: 0.6,
      max_tokens: 350
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const msg = errData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(`Erro no OpenRouter: ${msg}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('O OpenRouter não retornou resposta.');
  return text.trim();
}

// -------------------------------------------------------------
// 3. PROVEDOR GOOGLE GEMINI (Com Fallback de Modelos v1beta)
// -------------------------------------------------------------
async function sendToGemini(
  prompt: string,
  history: ChatMessage[],
  apiKey: string
): Promise<string> {
  const candidateModels = [
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-pro'
  ];

  const formattedContents = history
    .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
    .slice(-8)
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

  formattedContents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  let lastError: Error | null = null;

  for (const model of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: formattedContents,
          systemInstruction: { parts: [{ text: ZYNK_SYSTEM_INSTRUCTION }] },
          generationConfig: {
            temperature: 0.6,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 350
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (responseText) return responseText.trim();
      } else {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || response.statusText;
        if (response.status === 400 && errMsg.includes('API_KEY_INVALID')) {
          throw new Error('CHAVE_GEMINI_INVALIDA: A chave informada é inválida ou expirou no Google AI Studio.');
        }
        lastError = new Error(`[${model}] ${errMsg}`);
      }
    } catch (e: any) {
      if (e.message?.includes('CHAVE_GEMINI_INVALIDA')) throw e;
      lastError = e;
    }
  }

  throw lastError || new Error('Falha ao comunicar com a Google Gemini API.');
}

/**
 * Função principal que roteia a consulta para o provedor selecionado
 */
export async function sendQueryToGemini(
  prompt: string,
  history: ChatMessage[] = [],
  customApiKey?: string,
  provider?: AIProvider
): Promise<string> {
  const activeProvider = provider || getStoredProvider();
  const key = (customApiKey || getStoredApiKey()).trim();

  if (!key) {
    throw new Error(
      `CHAVE_API_AUSENTE: Configure sua API Key gratuita do ${activeProvider.toUpperCase()} nas configurações do Zynk.`
    );
  }

  switch (activeProvider) {
    case 'groq':
      return await sendToGroq(prompt, history, key);
    case 'openrouter':
      return await sendToOpenRouter(prompt, history, key);
    case 'gemini':
    default:
      return await sendToGemini(prompt, history, key);
  }
}
