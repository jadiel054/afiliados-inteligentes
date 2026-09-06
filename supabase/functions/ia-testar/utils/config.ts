// ============================================
// CONFIGURAÇÃO DOS PROVEDORES DE IA
// ============================================

import type { ProvedorIA } from '../../../types/index.ts';

// Tipos dos provedores
export const PROVEDORES = {
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    testEndpoint: '/models',
    authHeader: 'Authorization',
    authPrefix: 'Bearer',
    keyPrefix: 'gsk_',
    keyFormat: (key: string) => `Bearer ${key}`,
    requiresKey: true,
    requiresUrlBase: false,
    requiresContaId: false,
  },
  ollama: {
    baseUrl: '',
    testEndpoint: '/api/tags',
    authHeader: '',
    authPrefix: '',
    keyPrefix: '',
    keyFormat: (_key: string) => '',
    requiresKey: false,
    requiresUrlBase: true,
    requiresContaId: false,
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    testEndpoint: '/models',
    authHeader: 'x-goog-api-key',
    authPrefix: '',
    keyPrefix: '',
    keyFormat: (key: string) => key,
    requiresKey: true,
    requiresUrlBase: false,
    requiresContaId: false,
  },
  cloudflare: {
    baseUrl: '',
    testEndpoint: '/ai/run/@cf/meta/llama-3.1-8b-instruct',
    authHeader: 'Authorization',
    authPrefix: 'Bearer',
    keyPrefix: '',
    keyFormat: (key: string) => `Bearer ${key}`,
    requiresKey: true,
    requiresUrlBase: true,
    requiresContaId: true,
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    testEndpoint: '/models',
    authHeader: 'Authorization',
    authPrefix: 'Bearer',
    keyPrefix: 'sk-or-v1-',
    keyFormat: (key: string) => `Bearer ${key}`,
    requiresKey: true,
    requiresUrlBase: false,
    requiresContaId: false,
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    testEndpoint: '/chat/completions',
    authHeader: 'Authorization',
    authPrefix: 'Bearer',
    keyPrefix: 'sk-',
    keyFormat: (key: string) => `Bearer ${key}`,
    requiresKey: true,
    requiresUrlBase: false,
    requiresContaId: false,
  },
} as const satisfies Record<ProvedorIA, {
  baseUrl: string;
  testEndpoint: string;
  authHeader: string;
  authPrefix: string;
  keyPrefix: string;
  keyFormat: (key: string) => string;
  requiresKey: boolean;
  requiresUrlBase: boolean;
  requiresContaId: boolean;
}>;

// Mensagens de erro específicas por provedor
export const MENSAGENS_ERRO: Record<ProvedorIA, string> = {
  groq: 'Chave inválida — verifique se começa com gsk_',
  ollama: 'Não foi possível conectar ao servidor Ollama. Verifique se o servidor está rodando e a URL está correta.',
  gemini: 'Chave inválida — verifique se a chave da Google está correta.',
  cloudflare: 'Token ou Account ID inválido — verifique suas credenciais da Cloudflare.',
  openrouter: 'Chave inválida — verifique se começa com sk-or-v1-',
  deepseek: 'Chave inválida — verifique se começa com sk-',
};

// Tipos para request e response
export interface TestarIARequest {
  provedor: ProvedorIA;
  url_base?: string;
  modelo: string;
  chave_api?: string;
  conta_id?: string;
  usuario_id: string;
}

export interface TestarIAResponse {
  sucesso: boolean;
  mensagem: string;
  provedor: ProvedorIA;
  modelo: string;
  vault_secret_id?: string;
}

export type ProvedorConfig = typeof PROVEDORES[keyof typeof PROVEDORES];
