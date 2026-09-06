// ============================================
// EDGE FUNCTION: IA-TESTAR
// Testa conexão com provedores de IA
// Rota: POST /ia/testar
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { testarConexao } from './utils/tester.ts';
import { salvarNoVault, supabase } from './utils/vault.ts';
import { PROVEDORES } from './utils/config.ts';
import type { TestarIARequest, TestarIAResponse, ProvedorIA } from './utils/config.ts';

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
    const { provedor, url_base, modelo, chave_api, conta_id, usuario_id }: TestarIARequest = await req.json();

    // Validar dados obrigatórios
    if (!provedor || !usuario_id) {
      return new Response(JSON.stringify({ 
        error: 'provedor e usuario_id são obrigatórios.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar provedor
    if (!(provedor in PROVEDORES)) {
      return new Response(JSON.stringify({ 
        error: `Provedor ${provedor} não é suportado. Provedores válidos: ${Object.keys(PROVEDORES).join(', ')}` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Testar conexão
    const resultado = await testarConexao(
      provedor,
      url_base,
      modelo,
      chave_api,
      conta_id
    );

    const response: TestarIAResponse = {
      sucesso: resultado.sucesso,
      mensagem: resultado.mensagem,
      provedor,
      modelo,
    };

    // Se sucesso e tiver chave, salvar no Vault e atualizar provedores_ia
    if (resultado.sucesso && chave_api) {
      // Salvar no Vault
      const vaultId = await salvarNoVault(chave_api);
      
      if (vaultId) {
        response.vault_secret_id = vaultId;
        
        // Atualizar ou inserir registro em provedores_ia
        const { data: existing, error: fetchError } = await supabase
          .from('provedores_ia')
          .select('id')
          .eq('usuario_id', usuario_id)
          .eq('provedor', provedor)
          .maybeSingle();

        if (fetchError) {
          console.error('Erro ao buscar provedor existente:', fetchError);
        }

        const now = new Date().toISOString();
        
        if (existing) {
          // Atualizar registro existente
          const { error: updateError } = await supabase
            .from('provedores_ia')
            .update({
              vault_secret_id: vaultId,
              url_base: url_base,
              conta_id: conta_id,
              modelo: modelo,
              ativo: true,
              ultimo_teste: now,
              ultimo_teste_ok: true,
              ultimo_teste_msg: 'Conexão testada com sucesso',
            })
            .eq('id', existing.id);

          if (updateError) {
            console.error('Erro ao atualizar provedor:', updateError);
          }
        } else {
          // Inserir novo registro
          const { error: insertError } = await supabase
            .from('provedores_ia')
            .insert({
              usuario_id,
              nome: provedor,
              provedor,
              vault_secret_id: vaultId,
              url_base: url_base,
              conta_id: conta_id,
              modelo: modelo,
              ativo: true,
              ordem_fallback: 1,
              ultimo_teste: now,
              ultimo_teste_ok: true,
              ultimo_teste_msg: 'Conexão testada com sucesso',
            });

          if (insertError) {
            console.error('Erro ao inserir provedor:', insertError);
          }
        }
      } else {
        console.error('Não foi possível salvar a chave no Vault');
      }
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Erro no ia-testar:', error);
    
    return new Response(JSON.stringify({
      sucesso: false,
      mensagem: 'Erro interno ao processar a requisição.',
      provedor: '',
      modelo: '',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
