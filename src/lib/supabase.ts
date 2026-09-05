// ============================================
// CONFIGURAÇÃO DO SUPABASE CLIENT
// ============================================

import { createClient } from '@supabase/supabase-js';

// Next.js usa process.env (não import.meta.env do Vite)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

// Funções utilitárias para o Supabase
export const supabaseUtils = {
  // Obter usuário atual
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Erro ao obter usuário:', error);
      return null;
    }
    return user;
  },

  // Obter session atual
  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Erro ao obter session:', error);
      return null;
    }
    return session;
  },

  // Verificar se usuário está autenticado
  async isAuthenticated() {
    const session = await this.getCurrentSession();
    return !!session;
  },

  // Obter ID do usuário atual
  async getUserId() {
    const user = await this.getCurrentUser();
    return user?.id || null;
  },

  // RLS: Verificar se o usuário tem permissão para acessar um recurso
  async hasPermission(resource: { usuario_id: string }) {
    const currentUserId = await this.getUserId();
    return currentUserId === resource.usuario_id;
  },
};
