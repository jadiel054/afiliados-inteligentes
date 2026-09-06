// ============================================
// FUNÇÃO PARA TESTAR CONEXÃO COM PROVEDORES DE IA
// ============================================

import { PROVEDORES, MENSAGENS_ERRO } from './config.ts';
import type { ProvedorIA, ProvedorConfig } from './config.ts';

// Interface para resultado do teste
export interface TesteResultado {
  sucesso: boolean;
  mensagem: string;
  vault_secret_id?: string;
}

// Função para testar conexão com um provedor específico
export async function testarConexao(
  provedor: ProvedorIA,
  url_base: string | undefined,
  modelo: string,
  chave_api: string | undefined,
  conta_id: string | undefined,
): Promise<TesteResultado> {
  const config = PROVEDORES[provedor];

  try {
    // Validar dados obrigatórios
    if (config.requiresKey && !chave_api) {
      return { sucesso: false, mensagem: 'Chave API é obrigatória para este provedor.' };
    }

    // Verificar prefixo da chave
    if (config.requiresKey && config.keyPrefix && chave_api && !chave_api.startsWith(config.keyPrefix)) {
      return { sucesso: false, mensagem: MENSAGENS_ERRO[provedor] };
    }

    // Para Ollama, precisamos da URL base
    if (config.requiresUrlBase && !url_base) {
      return { sucesso: false, mensagem: 'URL base é obrigatória para este provedor.' };
    }

    // Para Cloudflare, precisamos da conta_id e url_base
    if (config.requiresContaId && (!conta_id || !url_base)) {
      return { 
        sucesso: false, 
        mensagem: config.requiresUrlBase && config.requiresContaId 
          ? 'URL base e Account ID são obrigatórios para Cloudflare.'
          : 'Account ID é obrigatório.'
      };
    }

    // Determinar URL base final
    let finalBaseUrl = config.baseUrl;
    if (provedor === 'ollama' && url_base) {
      finalBaseUrl = url_base.replace(/\/v1$/, '');
    } else if (provedor === 'cloudflare' && url_base) {
      finalBaseUrl = url_base;
    }

    // Determinar endpoint final
    let endpoint = config.testEndpoint;
    if (provedor === 'cloudflare' && conta_id) {
      endpoint = `/accounts/${conta_id}${endpoint}`;
    }

    // Construir URL completa
    const url = `${finalBaseUrl}${endpoint}`;

    // Construir headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.authHeader && chave_api) {
      headers[config.authHeader] = config.keyFormat(chave_api);
    }

    // Construir body com base no provedor
    let body: Record<string, unknown> | undefined;
    let method = 'GET';

    if (provedor === 'cloudflare') {
      method = 'POST';
      body = { messages: [{ role: 'user', content: 'diga apenas: ok' }] };
    } else if (provedor === 'deepseek') {
      method = 'POST';
      body = {
        model: modelo,
        messages: [{ role: 'user', content: 'diga apenas: ok' }],
        stream: false,
        max_tokens: 5,
      };
    }

    // Fazer a requisição
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Verificar resposta
    if (!response.ok) {
      const errorText = await response.text();
      let mensagem = `Falha ao conectar: ${response.status} ${response.statusText}`;

      if (response.status === 401 || response.status === 403) {
        mensagem = MENSAGENS_ERRO[provedor];
      } else if (response.status === 404) {
        mensagem = 'Endpoint não encontrado. Verifique a URL base e o modelo.';
      } else if (errorText.includes('Invalid API key') || errorText.includes('invalid token')) {
        mensagem = MENSAGENS_ERRO[provedor];
      }

      return { sucesso: false, mensagem };
    }

    // Se tudo estiver ok
    return { sucesso: true, mensagem: 'Conexão bem-sucedida!' };

  } catch (error) {
    console.error(`Erro ao testar conexão com ${provedor}:`, error);

    // Erros de rede
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      if (provedor === 'ollama') {
        return { sucesso: false, mensagem: 'Não foi possível conectar ao servidor Ollama. Verifique se o servidor está rodando.' };
      }
      return { sucesso: false, mensagem: `Não foi possível conectar ao servidor do provedor ${provedor}.` };
    }

    // Timeout
    if (error instanceof Error && error.message.includes('timeout')) {
      return { sucesso: false, mensagem: `Timeout ao conectar com ${provedor}. Tente novamente.` };
    }

    return { 
      sucesso: false, 
      mensagem: `Erro inesperado ao conectar com ${provedor}: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}
