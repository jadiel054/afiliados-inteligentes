// ============================================
// FUNÇÃO PARA CHAMAR PROVEDORES DE IA
// ============================================

import { RETRY_CONFIG, PROVEDORES_CONFIG } from './config.ts';
import { obterDoVault } from './vault.ts';
import type { ProvedorIA, ProvedorConfig } from './config.ts';

// Função para contar tokens (estimativa simples)
export function contarTokens(texto: string): number {
  const palavras = texto.trim().split(/\s+/).filter(Boolean);
  return Math.max(1, Math.ceil(palavras.length * 4));
}

// Função para fazer backoff exponencial
export async function backoffExponencial(tentativa: number): Promise<void> {
  const delay = RETRY_CONFIG.BACKOFF_BASE * Math.pow(2, tentativa - 1);
  await new Promise(resolve => setTimeout(resolve, delay));
}

// Interface para resultado da chamada
export interface ChamadaResultado {
  sucesso: boolean;
  resposta?: string;
  tokens_entrada: number;
  tokens_saida: number;
  latencia_ms: number;
  erro?: string;
}

// Função para chamar um provedor específico
export async function chamarProvedor(
  provedor: ProvedorIA,
  config: ProvedorConfig,
  vaultSecretId: string,
  url_base: string | undefined,
  conta_id: string | undefined,
  modelo: string,
  prompt: string,
  tentativa: number = 1
): Promise<ChamadaResultado> {
  try {
    // Obter a chave do Vault
    const chave_api = await obterDoVault(vaultSecretId);
    
    if (!chave_api) {
      return {
        sucesso: false,
        tokens_entrada: 0,
        tokens_saida: 0,
        latencia_ms: 0,
        erro: 'Não foi possível obter a chave do Vault.',
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
    let endpoint = config.endpoint;
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

    // Determinar modelo final
    const modeloFinal = modelo || config.defaultModel;

    // Construir body com base no provedor
    let body: Record<string, unknown>;
    let method = 'POST';

    if (provedor === 'ollama') {
      body = {
        model: modeloFinal,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 100,
        },
      };
    } else if (provedor === 'cloudflare') {
      body = {
        messages: [{ role: 'user', content: prompt }],
      };
    } else if (provedor === 'gemini') {
      body = {
        model: modeloFinal,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 100,
          temperature: 0.7,
        },
      };
      method = 'POST';
    } else {
      // Formato OpenAI compatível (Groq, OpenRouter, DeepSeek)
      body = {
        model: modeloFinal,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        max_tokens: 100,
        temperature: 0.7,
      };
    }

    // Medir latência
    const startTime = Date.now();

    // Fazer a requisição
    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body),
      });
    } catch (fetchError) {
      console.error(`Erro ao chamar ${provedor}:`, fetchError);
      return {
        sucesso: false,
        tokens_entrada: 0,
        tokens_saida: 0,
        latencia_ms: Date.now() - startTime,
        erro: `Erro de rede ao conectar com ${provedor}: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
      };
    }

    const latencia_ms = Date.now() - startTime;

    // Verificar se precisamos fazer retry
    if (RETRY_CONFIG.STATUS_RETRY.includes(response.status) && tentativa < RETRY_CONFIG.MAX_TENTATIVAS) {
      await backoffExponencial(tentativa);
      return chamarProvedor(
        provedor,
        config,
        vaultSecretId,
        url_base,
        conta_id,
        modelo,
        prompt,
        tentativa + 1
      );
    }

    // Processar resposta
    if (!response.ok) {
      const errorText = await response.text();
      let erro = `Falha: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error && errorJson.error.message) {
          erro = errorJson.error.message;
        }
      } catch {
        // Ignorar
      }

      return {
        sucesso: false,
        tokens_entrada: 0,
        tokens_saida: 0,
        latencia_ms,
        erro,
      };
    }

    // Parsear resposta
    let resposta: string = '';
    let tokens_saida = 0;

    try {
      const json = await response.json();
      
      if (provedor === 'ollama') {
        resposta = json.message?.content || json.response || '';
        tokens_saida = contarTokens(resposta);
      } else if (provedor === 'cloudflare') {
        resposta = json.response || '';
        tokens_saida = contarTokens(resposta);
      } else if (provedor === 'gemini') {
        const candidates = json.candidates || [];
        if (candidates.length > 0 && candidates[0].content?.parts) {
          resposta = candidates[0].content.parts
            .map((part: { text?: string }) => part.text || '')
            .join('');
          tokens_saida = contarTokens(resposta);
        }
      } else {
        // Formato OpenAI (Groq, OpenRouter, DeepSeek)
        const choices = json.choices || [];
        if (choices.length > 0 && choices[0].message?.content) {
          resposta = choices[0].message.content as string;
          tokens_saida = contarTokens(resposta);
        }
      }
    } catch {
      resposta = '';
      tokens_saida = 0;
    }

    const tokens_entrada = contarTokens(prompt);

    return {
      sucesso: true,
      resposta,
      tokens_entrada,
      tokens_saida,
      latencia_ms,
    };
    
  } catch (error) {
    console.error(`Erro ao chamar provedor ${provedor}:`, error);
    return {
      sucesso: false,
      tokens_entrada: 0,
      tokens_saida: 0,
      latencia_ms: 0,
      erro: `Erro inesperado: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
