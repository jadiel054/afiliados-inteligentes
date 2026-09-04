// ============================================
// COMPONENTE PRINCIPAL DO APP
// ============================================

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, PublicRoute } from '@/context/AuthContext';
import { Toaster } from 'sonner';

// Importar páginas
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

          {/* Rotas protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Painel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/painel"
            element={
              <ProtectedRoute>
                <Painel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/produtos"
            element={
              <ProtectedRoute>
                <Produtos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agente"
            element={
              <ProtectedRoute>
                <Agente />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plataformas"
            element={
              <ProtectedRoute>
                <Plataformas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notificacoes"
            element={
              <ProtectedRoute>
                <Notificacoes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <ProtectedRoute>
                <Configuracoes />
              </ProtectedRoute>
            }
          />

          {/* Rota para link curto (redirecionamento) */}
          <Route path="/r/:codigo" element={<div>Redirecionando...</div>} />

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
