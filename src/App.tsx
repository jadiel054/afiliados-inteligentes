// ============================================
// COMPONENTE PRINCIPAL DO APP
// ============================================

import React, { useEffect } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, PublicRoute } from '@/context/AuthContext';
import { Toaster } from 'sonner';

// Importar layout e páginas
const Layout = React.lazy(() => import('@/components/Layout/Layout'));
const Login = React.lazy(() => import('@/pages/Login'));
const Cadastro = React.lazy(() => import('@/pages/Cadastro'));
const RecuperarSenha = React.lazy(() => import('@/pages/RecuperarSenha'));
const Painel = React.lazy(() => import('@/pages/Painel'));
const Produtos = React.lazy(() => import('@/pages/Produtos'));
const Agente = React.lazy(() => import('@/pages/Agente'));
const Plataformas = React.lazy(() => import('@/pages/Plataformas'));
const Notificacoes = React.lazy(() => import('@/pages/Notificacoes'));
const Configuracoes = React.lazy(() => import('@/pages/Configuracoes'));

// Componente de loading
const LoadingFallback = () => (
  <div className="flex h-screen w-screen items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Componente para redirecionamento de link curto
function RedirectLink() {
  const { codigo } = useParams<{ codigo: string }>();

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gkjibjipgcqasweisfitp.supabase.co';
    if (codigo) {
      window.location.replace(`${supabaseUrl}/functions/v1/redirect-link/r/${codigo}`);
    }
  }, [codigo]);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  );
}

// Componente principal
function App() {
  return (
    <AuthProvider>
      <React.Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Rotas públicas */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/cadastro"
            element={
              <PublicRoute>
                <Cadastro />
              </PublicRoute>
            }
          />
          <Route
            path="/recuperar-senha"
            element={
              <PublicRoute>
                <RecuperarSenha />
              </PublicRoute>
            }
          />

          {/* Rota para link curto (redirecionamento) */}
          <Route path="/r/:codigo" element={<RedirectLink />} />

          {/* Rotas protegidas com Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Painel />} />
            <Route path="/painel" element={<Painel />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/agente" element={<Agente />} />
            <Route path="/plataformas" element={<Plataformas />} />
            <Route path="/notificacoes" element={<Notificacoes />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>

          {/* Rota 404 */}
          <Route
            path="*"
            element={
              <div className="flex h-screen w-screen items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold">404</h1>
                  <p className="text-muted-foreground">Página não encontrada</p>
                </div>
              </div>
            }
          />
        </Routes>
      </React.Suspense>

      {/* Toaster para notificações */}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          className: 'group toast group-[.toaster]:bg-background group-[.toaster]:shadow-lg',
        }}
      />
    </AuthProvider>
  );
}

export default App;
