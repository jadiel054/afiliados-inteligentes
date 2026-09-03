import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario } from '../types';

interface AuthContextType {
  usuario: Usuario | null;
  autenticado: boolean;
  carregando: boolean;
  login: (email: string, nome?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'afiliados_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const sessaoSalva = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (sessaoSalva) {
      try {
        setUsuario(JSON.parse(sessaoSalva));
      } catch (e) {
        console.error('Erro ao restaurar sessão', e);
      }
    } else {
      // Usuário mock padrão para iniciar logado com facilidade
      const userDefault: Usuario = {
        id: 'usr-demo-123',
        email: 'afiliado@inteligente.com.br',
        nome: 'Afiliado Demo',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'
      };
      setUsuario(userDefault);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(userDefault));
    }
    setCarregando(false);
  }, []);

  const login = async (email: string, nome?: string) => {
    setCarregando(true);
    // Simula uma pequena requisição de login
    await new Promise(res => setTimeout(res, 600));
    const user: Usuario = {
      id: `usr-${Date.now()}`,
      email,
      nome: nome || email.split('@')[0],
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`
    };
    setUsuario(user);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
    setCarregando(false);
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        autenticado: Boolean(usuario),
        carregando,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
