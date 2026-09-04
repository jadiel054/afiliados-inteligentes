// ============================================
// CONTEXTO DE AUTENTICAÇÃO
// ============================================

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '@/lib/supabase';
import { AuthContextType, Usuario } from '@/types';
import { toast } from 'sonner';
import { MENSAGENS } from '@/lib/constantes';

// Criar contexto
const AuthContext = createContext<AuthContextType>({
  usuario: null,
  loading: true,
  login: async () => ({ error: 'Não implementado' }),
  cadastro: async () => ({ error: 'Não implementado' }),
  recuperarSenha: async () => ({ error: 'Não implementado' }),
  logout: async () => {},
});

// Provedor do contexto
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Verificar session ao montar o componente
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao verificar session:', error);
          setUsuario(null);
          setLoading(false);
          return;
        }

        if (session) {
          const user: Usuario = {
            id: session.user.id,
            email: session.user.email || '',
            nome: session.user.user_metadata?.nome as string || undefined,
            criado_em: session.user.created_at,
          };
          setUsuario(user);
        } else {
          setUsuario(null);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setUsuario(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Escutar por mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          const user: Usuario = {
            id: session?.user.id || '',
            email: session?.user.email || '',
            nome: session?.user.user_metadata?.nome as string || undefined,
            criado_em: session?.user.created_at,
          };
          setUsuario(user);
          toast.success(MENSAGENS.LOGIN_SUCESSO);
          navigate('/painel');
        } else if (event === 'SIGNED_OUT') {
          setUsuario(null);
          toast.success(MENSAGENS.LOGOUT_SUCESSO);
          navigate('/login');
        } else if (event === 'PASSWORD_RECOVERY') {
          toast.info(MENSAGENS.SENHA_RECUPERADA);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, [navigate]);

  // Função de login
  const login = async (email: string, senha: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: MENSAGENS.ERRO_GENERICO };
    }
  };

  // Função de cadastro
  const cadastro = async (email: string, senha: string, nome: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: {
            nome,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        return { error: error.message };
      }

      toast.success(MENSAGENS.CADASTRO_SUCESSO);
      return {};
    } catch (error) {
      return { error: MENSAGENS.ERRO_GENERICO };
    }
  };

  // Função de recuperar senha
  const recuperarSenha = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/redefinir-senha',
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: MENSAGENS.ERRO_GENERICO };
    }
  };

  // Função de logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error(MENSAGENS.ERRO_GENERICO);
    }
  };

  const value: AuthContextType = {
    usuario,
    loading,
    login,
    cadastro,
    recuperarSenha,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook para usar o contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

// Componente para proteger rotas
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { usuario, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !usuario) {
      navigate('/login', { replace: true });
    }
  }, [usuario, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  return <>{children}</>;
}

// Componente para redirecionar se já estiver logado
export function PublicRoute({ children }: { children: ReactNode }) {
  const { usuario, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && usuario) {
      navigate('/painel', { replace: true });
    }
  }, [usuario, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
