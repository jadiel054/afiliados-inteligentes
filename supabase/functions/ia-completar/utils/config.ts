// ============================================
// CONFIGURAÇÃO DOS PROVEDORES DE IA PARA COMPLETAR
// ============================================

import type { ProvedorIA } from '../../../types/index.ts';

// Configuração de retry e backoff
export const RETRY_CONFIG = {
  MAX_TENTATIVAS: 3,
  BACKOFF_BASE: 1000, // 1 segundo
  STATUS_RETRY: [429, 500, 502, 503, 504],
} as const;

// Configuração dos provedores
export const PROVEDORES_CONFIG = {
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    endpoint: '/chat/completions',
    authHeader: 'Authorization',
    keyFormat: (key: string) => `Bearer ${key}`,
    defaultModel: 'llama-3.3-70b-versatile',
  },
  ollama: {
    baseUrl: '',
    endpoint: '/api/chat',
    authHeader: '',
    keyFormat: (_key: string) => '',
    defaultModel: 'llama3.3',
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    endpoint: '/chat/completions',
    authHeader: 'x-goog-api-key',
    keyFormat: (key: string) => key,
    defaultModel: 'gemini-2.0-flash',
  },
  cloudflare: {
    baseUrl: '',
    endpoint: '/ai/run/@cf/meta/llama-3.1-8b-instruct',
    authHeader: 'Authorization',
    keyFormat: (key: string) => `Bearer ${key}`,
    defaultModel: '@cf/meta/llama-3.1-8b-instruct',
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    endpoint: '/chat/completions',
    authHeader: 'Authorization',
    keyFormat: (key: string) => `Bearer ${key}`,
    defaultModel: 'llama-3.3-70b-versatile',
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    endpoint: '/chat/completions',
    authHeader: 'Authorization',
    keyFormat: (key: string) => `Bearer ${key}`,
    defaultModel: 'deepseek-chat',
  },
} as const satisfies Record<ProvedorIA, {
  baseUrl: string;
  endpoint: string;
  authHeader: string;
  keyFormat: (key: string) => string;
  defaultModel: string;
}>;

// Tipos para request e response
export interface CompletarIARequest {
  prompt: string;
  usuario_id: string;
  modelo_preferido?: string;
}

export interface CompletarIAResponse {
  sucesso: boolean;
  resposta?: string;
  provedor_usado?: ProvedorIA;
  modelo_usado?: string;
  tokens_entrada?: number;
  tokens_saida?: number;
  latencia_ms?: number;
  erro?: string;
}

export interface LogIAData {
  usuario_id: string;
  provedor: ProvedorIA;
  modelo?: string;
  tokens_entrada?: number;
  tokens_saida?: number;
  latencia_ms?: number;
  sucesso: boolean;
  erro?: string;
}

export type ProvedorConfig = typeof PROVEDORES_CONFIG[keyof typeof PROVEDORES_CONFIG];
