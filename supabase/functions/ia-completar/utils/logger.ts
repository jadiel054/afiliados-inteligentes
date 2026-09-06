// ============================================
// FUNÇÕES PARA LOG E NOTIFICAÇÕES
// ============================================

import { supabase } from './vault.ts';
import type { LogIAData } from './config.ts';

// Função para gravar log no banco
export async function gravarLogIA(data: LogIAData): Promise<void> {
  try {
    await supabase
      .from('log_ia')
      .insert(data);
  } catch (error) {
    console.error('Erro ao gravar log_ia:', error);
  }
}

// Função para criar notificação de sistema
export async function criarNotificacao(usuario_id: string, mensagem: string): Promise<void> {
  try {
    await supabase
      .from('notificacoes')
      .insert({
        usuario_id,
        tipo: 'sistema',
        titulo: 'Erro: Todos os provedores de IA falharam',
        mensagem,
        lida: false,
        created_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
  }
}
