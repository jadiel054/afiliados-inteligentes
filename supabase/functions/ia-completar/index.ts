// ============================================
// EDGE FUNCTION: IA-COMPLETAR
// Chama provedores de IA com failover automático
// Rota: POST /ia/completar
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { chamarProvedor } from './utils/caller.ts';
import { gravarLogIA, criarNotificacao, supabase } from './utils/logger.ts';
import { PROVEDORES_CONFIG, RETRY_CONFIG } from './utils/config.ts';
import type { CompletarIARequest, CompletarIAResponse, ProvedorIA } from './utils/config.ts';

// Handler principal
serve(async (req) => {
  try {
    // Verificar método
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método não permitido. Use POST.' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extrair dados do request
    const { prompt, usuario_id, modelo_preferido }: CompletarIARequest = await req.json();

    // Validar dados obrigatórios
    if (!prompt || !usuario_id) {
      return new Response(JSON.stringify({ 
        error: 'prompt e usuario_id são obrigatórios.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Buscar provedores ativos do usuário, ordenados por ordem_fallback
    const { data: provedores, error: provedoresError } = await supabase
      .from('provedores_ia')
      .select('*')
      .eq('usuario_id', usuario_id)
      .eq('ativo', true)
      .order('ordem_fallback', { ascending: true });

    if (provedoresError || !provedores || provedores.length === 0) {
      const mensagem = 'Nenhum provedor de IA ativo configurado para este usuário.';
      
      // Criar notificação
      await criarNotificacao(usuario_id, mensagem);

      return new Response(JSON.stringify({
        sucesso: false,
        erro: mensagem,
      } as CompletarIAResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Tentar cada provedor na ordem de fallback
    let ultimoErro: string | undefined;
    let respostaFinal: CompletarIAResponse | undefined;

    for (const provedor of provedores) {
      const config = PROVEDORES_CONFIG[provedor.provedor as ProvedorIA];
      
      if (!config) {
        console.warn(`Provedor ${provedor.provedor} não tem configuração. Pulando...`);
        continue;
      }

      // Chamar o provedor
      const resultado = await chamarProvedor(
        provedor.provedor as ProvedorIA,
        config,
        provedor.vault_secret_id || '',
        provedor.url_base,
        provedor.conta_id,
        modelo_preferido || provedor.modelo,
        prompt,
        usuario_id
      );

      // Gravar log
      await gravarLogIA({
        usuario_id,
        provedor: provedor.provedor as ProvedorIA,
        modelo: modelo_preferido || provedor.modelo,
        tokens_entrada: resultado.tokens_entrada,
        tokens_saida: resultado.tokens_saida,
        latencia_ms: resultado.latencia_ms,
        sucesso: resultado.sucesso,
        erro: resultado.erro,
      });

      if (resultado.sucesso && resultado.resposta) {
        // Sucesso!
        respostaFinal = {
          sucesso: true,
          resposta: resultado.resposta,
          provedor_usado: provedor.provedor as ProvedorIA,
          modelo_usado: modelo_preferido || provedor.modelo,
          tokens_entrada: resultado.tokens_entrada,
          tokens_saida: resultado.tokens_saida,
          latencia_ms: resultado.latencia_ms,
        };
        break;
      } else {
        // Guardar o último erro para a resposta
        ultimoErro = resultado.erro || `Provedor ${provedor.provedor} falhou`;
        console.warn(`Provedor ${provedor.provedor} falhou: ${resultado.erro || 'erro desconhecido'}`);
      }
    }

    // Se todos falharam
    if (!respostaFinal) {
      const mensagem = `Todos os provedores de IA falharam. Último erro: ${ultimoErro || 'erro desconhecido'}`;
      
      // Criar notificação
      await criarNotificacao(usuario_id, mensagem);

      return new Response(JSON.stringify({
        sucesso: false,
        erro: mensagem,
      } as CompletarIAResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(respostaFinal), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Erro no ia-completar:', error);
    
    return new Response(JSON.stringify({
      sucesso: false,
      erro: 'Erro interno ao processar a requisição.',
    } as CompletarIAResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
