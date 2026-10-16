// ============================================
// EDGE FUNCTION: IA-TESTAR
// Testa conexão com provedores de IA
// Rota: POST /ia/testar
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { testarConexao } from './utils/tester.ts';
import { salvarNoVault, obterDoVault, supabase } from './utils/vault.ts';
import { PROVEDORES } from './utils/config.ts';
import type { ProvedorIA } from '../../../types/index.ts';

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

    // Extrair e validar JWT do header Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'Não autorizado. Token de autenticação ausente.'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return new Response(JSON.stringify({ 
        error: 'Não autorizado. Token de autenticação ausente.'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({
        error: 'Não autorizado. Token de autenticação inválido ou expirado.'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse do body JSON
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ 
        error: 'Formato de requisição inválido. Corpo JSON inválido.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { provedor_id, provedor, url_base, modelo, chave_api, conta_id, usuario_id } = body || {};

    // FORMATO NOVO: body possui provedor_id
    if (provedor_id) {
      const { data: row, error: fetchError } = await supabase
        .from('provedores_ia')
        .select('*')
        .eq('id', provedor_id)
        .maybeSingle();

      if (fetchError || !row) {
        return new Response(JSON.stringify({
          error: 'Provedor não encontrado ou acesso negado.'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (row.usuario_id !== user.id) {
        return new Response(JSON.stringify({
          error: 'Acesso negado ao provedor especificado.'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      let chave: string | null = null;
      if (row.vault_secret_id) {
        chave = await obterDoVault(row.vault_secret_id);
      }

      const resultado = await testarConexao(
        row.provedor as ProvedorIA,
        row.url_base,
        row.modelo,
        chave || '',
        row.conta_id
      );

      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('provedores_ia')
        .update({
          ultimo_teste: now,
          ultimo_teste_ok: resultado.sucesso,
          ultimo_teste_msg: resultado.mensagem,
        })
        .eq('id', row.id);

      if (updateError) {
        console.error('Erro ao atualizar status do teste do provedor:', updateError);
      }

      return new Response(JSON.stringify({
        sucesso: resultado.sucesso,
        mensagem: resultado.mensagem,
        provedor: row.provedor,
        modelo: row.modelo,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // FORMATO ANTIGO: body possui provedor e usuario_id
    if (provedor && usuario_id) {
      if (usuario_id !== user.id) {
        return new Response(JSON.stringify({
          error: 'Acesso negado ao usuário especificado.'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (!(provedor in PROVEDORES)) {
        return new Response(JSON.stringify({
          error: `Provedor ${provedor} não é suportado. Provedores válidos: ${Object.keys(PROVEDORES).join(', ')}`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const resultado = await testarConexao(
        provedor as ProvedorIA,
        url_base,
        modelo,
        chave_api,
        conta_id
      );

      const response: any = {
        sucesso: resultado.sucesso,
        mensagem: resultado.mensagem,
        provedor,
        modelo,
      };

      if (resultado.sucesso && chave_api) {
        const vaultId = await salvarNoVault(chave_api);

        if (vaultId) {
          response.vault_secret_id = vaultId;

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
    }

    // NENHUM FORMATO VÁLIDO
    return new Response(JSON.stringify({
      error: 'Formato de requisição inválido. Informe provedor_id ou provedor com usuario_id.'
    }), {
      status: 400,
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
