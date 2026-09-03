import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout/Layout';
import { Login } from './pages/Login';
import { Painel } from './pages/Painel';
import { Produtos } from './pages/Produtos';
import { Agente } from './pages/Agente';
import { Plataformas } from './pages/Plataformas';
import { Notificacoes } from './pages/Notificacoes';
import { Configuracoes } from './pages/Configuracoes';
import { Toaster } from 'sonner';

const AppContent: React.FC = () => {
  const { autenticado, carregando } = useAuth();
  const [paginaAtual, setPaginaAtual] = useState('painel');

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-500 border-t-transparent" />
          <span className="text-xs text-slate-400">Carregando Afiliados Inteligentes...</span>
        </div>
      </div>
    );
  }

  if (!autenticado) {
    return (
      <>
        <Login />
        <Toaster position="top-right" richColors />
      </>
    );
  }

  const renderizarPagina = () => {
    switch (paginaAtual) {
      case 'painel':
        return <Painel />;
      case 'produtos':
        return <Produtos />;
      case 'agente':
        return <Agente />;
      case 'plataformas':
        return <Plataformas />;
      case 'notificacoes':
        return <Notificacoes />;
      case 'configuracoes':
        return <Configuracoes />;
      default:
        return <Painel />;
    }
  };

  return (
    <Layout paginaAtual={paginaAtual} setPaginaAtual={setPaginaAtual}>
      {renderizarPagina()}
      <Toaster position="top-right" richColors />
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
