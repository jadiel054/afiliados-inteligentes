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
    // Gerar nome único para o segredo
    const secretName = `ia_key_${crypto.randomUUID()}`;
    
    // Salvar no Vault usando a API REST do Supabase
    // O Supabase Vault usa o endpoint /vault/secrets
    const vaultResponse = await fetch(`${supabaseUrl}/vault/secrets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
      },
      body: JSON.stringify({
        name: secretName,
        value: chave,
      }),
    });

    if (!vaultResponse.ok) {
      console.error('Erro ao salvar no Vault:', await vaultResponse.text());
      return null;
    }

    const vaultData = await vaultResponse.json();
    return vaultData.id || null;
    
  } catch (error) {
    console.error('Erro ao salvar no Vault:', error);
    return null;
  }
}

// Função para obter chave do Vault
export async function obterDoVault(vaultSecretId: string): Promise<string | null> {
  try {
    // Obter segredo do Vault
    const vaultResponse = await fetch(`${supabaseUrl}/vault/secrets/${vaultSecretId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
      },
    });

    if (!vaultResponse.ok) {
      console.error('Erro ao obter do Vault:', await vaultResponse.text());
      return null;
    }

    const vaultData = await vaultResponse.json();
    return vaultData.value || null;
    
  } catch (error) {
    console.error('Erro ao obter do Vault:', error);
    return null;
  }
}

// Função para excluir segredo do Vault
export async function excluirDoVault(vaultSecretId: string): Promise<boolean> {
  try {
    const vaultResponse = await fetch(`${supabaseUrl}/vault/secrets/${vaultSecretId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
      },
    });

    if (!vaultResponse.ok) {
      console.error('Erro ao excluir do Vault:', await vaultResponse.text());
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
