// ============================================
// FUNÇÕES PARA INTERAÇÃO COM SUPABASE VAULT
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuração do Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Criar cliente Supabase com service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Função para salvar chave no Vault
export async function salvarNoVault(chave: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('vault_rpc_wrapper_create_secret', {
      p_value: chave,
    });

    if (error || !data) {
      console.error('Erro ao salvar no Vault:', error);
      return null;
    }

    return data as string;
  } catch (error) {
    console.error('Erro ao salvar no Vault:', error);
    return null;
  }
}

// Função para obter chave do Vault
export async function obterDoVault(vaultSecretId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('vault_rpc_wrapper_get_secret', {
      p_id: vaultSecretId,
    });

    if (error || !data) {
      console.error('Erro ao obter do Vault:', error);
      return null;
    }

    return data as string;
  } catch (error) {
    console.error('Erro ao obter do Vault:', error);
    return null;
  }
}

// Função para excluir segredo do Vault
export async function excluirDoVault(vaultSecretId: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('vault_rpc_wrapper_delete_secret', {
      p_id: vaultSecretId,
    });

    if (error) {
      console.error('Erro ao excluir do Vault:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao excluir do Vault:', error);
    return false;
  }
}

// Exportar supabase para uso em outros módulos
export { supabase, supabaseUrl, supabaseServiceKey };
