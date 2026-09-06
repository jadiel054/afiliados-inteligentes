// ============================================
// FUNÇÕES PARA INTERAÇÃO COM SUPABASE VAULT
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuração do Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Criar cliente Supabase com service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Função para obter chave do Vault
export async function obterDoVault(vaultSecretId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('vault_secrets')
      .select('value')
      .eq('id', vaultSecretId)
      .single();

    if (error || !data) {
      console.error('Erro ao obter segredo do Vault:', error);
      return null;
    }

    return data.value as string;
    
  } catch (error) {
    console.error('Erro ao obter do Vault:', error);
    return null;
  }
}

// Exportar supabase para uso em outros módulos
export { supabase, supabaseUrl, supabaseServiceKey };
