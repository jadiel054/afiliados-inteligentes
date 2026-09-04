// ============================================
// PÁGINA DE PLATAFORMAS - CONEXÕES
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import supabase from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Link, Unlink, RefreshCw, CheckCircle, XCircle, AlertCircle, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { MENSAGENS } from '@/lib/constantes';
import type { ContaPlataforma, Plataforma } from '@/types';

export default function Plataformas() {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plataformas, setPlataformas] = useState<Plataforma[]>([]);
  const [contasPlataforma, setContasPlataforma] = useState<ContaPlataforma[]>([]);
  
  // Estados para modal de conexão
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaPlataforma | undefined>(undefined);
  const [formLoading, setFormLoading] = useState(false);
  const [token, setToken] = useState('');
  const [filtroPlataforma, setFiltroPlataforma] = useState('');

  // Buscar dados
  const fetchData = useCallback(async () => {
    if (!usuario) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Buscar plataformas
      const { data: plataformasData, error: plataformasError } = await supabase
        .from('plataformas')
        .select('*');
      
      if (plataformasError) throw plataformasError;
      
      // Buscar contas de plataforma do usuário
      const { data: contasData, error: contasError } = await supabase
        .from('contas_plataforma')
        .select('*, plataforma:plataformas(*)')
        .eq('usuario_id', usuario.id);
      
      if (contasError) throw contasError;
      
      setPlataformas(plataformasData || []);
      setContasPlataforma(contasData || []);
      
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError(MENSAGENS.ERRO_GENERICO);
      toast.error(MENSAGENS.ERRO_GENERICO);
    } finally {
      setLoading(false);
    }
  }, [usuario]);

  // Salvar conexão
  const handleSubmit = async () => {
    if (!usuario || !editingConta?.plataforma_id || !token) return;
    
    setFormLoading(true);
    try {
      if (editingConta.id) {
        // Atualizar conexão existente
        const { error } = await supabase
          .from('contas_plataforma')
          .update({
            id_afiliado: token,
            status: 'conectado',
            ultimo_erro: null,
          })
          .eq('id', editingConta.id)
          .eq('usuario_id', usuario.id);
        
        if (error) throw error;
        
        toast.success('Conexão atualizada com sucesso!');
      } else {
        // Criar nova conexão
        const { error } = await supabase
          .from('contas_plataforma')
          .insert({
            usuario_id: usuario.id,
            plataforma_id: editingConta.plataforma_id,
            id_afiliado: token,
            status: 'conectado',
          });
        
        if (error) throw error;
        
        toast.success('Conexão criada com sucesso!');
      }
      
      fetchData();
      setIsModalOpen(false);
      setEditingConta(undefined);
      setToken('');
    } catch (err) {
      console.error('Erro ao salvar conexão:', err);
      toast.error(MENSAGENS.ERRO_GENERICO);
    } finally {
      setFormLoading(false);
    }
  };

  // Desconectar plataforma
  const handleDesconectar = async (contaId: string) => {
    if (!usuario) return;
    
    try {
      const { error } = await supabase
        .from('contas_plataforma')
        .update({
          status: 'desconectado',
          id_afiliado: null,
          vault_secret_id: null,
        })
        .eq('id', contaId)
        .eq('usuario_id', usuario.id);
      
      if (error) throw error;
      
      toast.success('Plataforma desconectada com sucesso!');
      fetchData();
    } catch (err) {
      console.error('Erro ao desconectar plataforma:', err);
      toast.error(MENSAGENS.ERRO_GENERICO);
    }
  };

  // Sincronizar dados
  const handleSincronizar = async (contaId: string) => {
    if (!usuario) return;
    
    try {
      // Chamar Edge Function para sincronizar
      // Por enquanto, apenas mostrar toast
      toast.info('Sincronização iniciada. Esta funcionalidade será implementada na Fase 4.');
    } catch (err) {
      console.error('Erro ao sincronizar:', err);
      toast.error(MENSAGENS.ERRO_GENERICO);
    }
  };

  // Buscar dados ao montar o componente
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && plataformas.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">
          {error}
        </div>
        <Button onClick={fetchData} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Plataformas</h1>
          <p className="text-muted-foreground">
            Conecte suas contas de afiliados
          </p>
        </div>
      </div>

      {/* Plataformas disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>Plataformas Disponíveis</CardTitle>
          <CardDescription>
            Conecte-se às plataformas de afiliados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {plataformas.map(plataforma => {
              const conta = contasPlataforma.find(c => c.plataforma_id === plataforma.id);
              const status = conta?.status || 'desconectado';
              
              return (
                <div
                  key={plataforma.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: plataforma.cor_hex }}
                      />
                      <h4 className="font-semibold">{plataforma.nome}</h4>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      status === 'conectado' ? 'bg-green-500/10 text-green-600' :
                      status === 'desconectado' ? 'bg-red-500/10 text-red-600' :
                      'bg-yellow-500/10 text-yellow-600'
                    }`}>
                      {status}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {status === 'conectado' ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          ID do Afiliado: {conta?.id_afiliado || 'N/A'}
                        </p>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingConta({
                                ...conta!,
                                plataforma_id: plataforma.id,
                                plataforma: plataforma,
                              });
                              setToken(conta?.id_afiliado || '');
                              setIsModalOpen(true);
                            }}
                            leftIcon={<Settings className="w-4 h-4" />}
                          >
                            Configurar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSincronizar(conta!.id)}
                            leftIcon={<RefreshCw className="w-4 h-4" />}
                          >
                            Sincronizar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDesconectar(conta!.id)}
                            leftIcon={<Unlink className="w-4 h-4" />}
                          >
                            Desconectar
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingConta({
                            id: '',
                            usuario_id: usuario.id,
                            plataforma_id: plataforma.id,
                            plataforma: plataforma,
                            id_afiliado: '',
                            status: 'desconectado',
                          });
                          setToken('');
                          setIsModalOpen(true);
                        }}
                        leftIcon={<Link className="w-4 h-4" />}
                      >
                        Conectar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de conexões */}
      <Card>
        <CardHeader>
          <CardTitle>Minhas Conexões</CardTitle>
          <CardDescription>
            {contasPlataforma.length} conexões configuradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contasPlataforma.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma conexão configurada</p>
              <p className="text-sm mt-2">
                Conecte-se a uma plataforma para começar
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>ID do Afiliado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Sinc</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contasPlataforma.map(conta => (
                    <TableRow key={conta.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: conta.plataforma?.cor_hex || '#ccc' }}
                          />
                          {conta.plataforma?.nome || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {conta.id_afiliado || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          conta.status === 'conectado' ? 'bg-green-500/10 text-green-600' :
                          conta.status === 'desconectado' ? 'bg-red-500/10 text-red-600' :
                          'bg-yellow-500/10 text-yellow-600'
                        }`}>
                          {conta.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {conta.ultima_sinc ? new Date(conta.ultima_sinc).toLocaleString('pt-BR') : 'Nunca'}
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingConta(conta);
                            setToken(conta.id_afiliado || '');
                            setIsModalOpen(true);
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSincronizar(conta.id)}
                        >
                          Sincronizar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDesconectar(conta.id)}
                        >
                          Desconectar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de conexão */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingConta?.id ? 'Editar Conexão' : 'Nova Conexão'}
            </DialogTitle>
            <DialogDescription>
              {editingConta?.plataforma?.nome && (
                <>Conecte sua conta de {editingConta.plataforma.nome}</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {editingConta?.plataforma && (
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: editingConta.plataforma.cor_hex }}
                />
                <span className="font-semibold">{editingConta.plataforma.nome}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="token">ID do Afiliado / Token</Label>
              <Input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Informe seu ID de afiliado ou token"
                disabled={formLoading}
              />
              <p className="text-xs text-muted-foreground">
                Este dado será armazenado de forma segura no Supabase Vault
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsModalOpen(false);
              setEditingConta(undefined);
              setToken('');
            }} disabled={formLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={formLoading}>
              {editingConta?.id ? 'Salvar' : 'Conectar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
