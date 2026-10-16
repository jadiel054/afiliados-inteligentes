// ============================================
// PÁGINA DE PRODUTOS - CRUD COMPLETO
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import supabase from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { MENSAGENS, copyToClipboard, getClassificacaoAutomatica } from '@/lib/constantes';
import type { Produto, Plataforma, ProdutoFormData, StatusProduto, Evento } from '@/types';
import { ProdutoForm } from '@/components/Produtos/ProdutoForm';
import { ConfirmarExclusaoDialog } from '@/components/Produtos/ConfirmarExclusaoDialog';
import { ProdutosFiltros } from '@/components/Produtos/ProdutosFiltros';
import { ProdutosTable } from '@/components/Produtos/ProdutosTable';

export default function Produtos() {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [plataformas, setPlataformas] = useState<Plataforma[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | undefined>(undefined);
  const [formLoading, setFormLoading] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [produtoToDelete, setProdutoToDelete] = useState<Produto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [filtroPlataforma, setFiltroPlataforma] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusProduto | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    if (!usuario) return;
    try {
      setLoading(true);
      setError(null);

      const { data: pData, error: pErr } = await supabase
        .from('produtos')
        .select('*, plataforma:plataformas(*)')
        .eq('usuario_id', usuario.id)
        .order('atualizado_em', { ascending: false });
      if (pErr) throw pErr;

      const { data: platData, error: platErr } = await supabase.from('plataformas').select('*');
      if (platErr) throw platErr;

      const { data: eData, error: eErr } = await supabase.from('eventos').select('*').eq('usuario_id', usuario.id);
      if (eErr) throw eErr;

      setProdutos(pData || []);
      setPlataformas(platData || []);
      setEventos(eData || []);
    } catch (err) {
      console.error(err);
      setError(MENSAGENS.ERRO_GENERICO);
      toast.error(MENSAGENS.ERRO_GENERICO);
    } finally {
      setLoading(false);
    }
  }, [usuario]);

  const getProdutoMetricas = (produtoId: string) => {
    const pEventos = eventos.filter((e) => e.produto_id === produtoId);
    const cliques = pEventos.filter((e) => e.tipo === 'clique').length;
    const vendas = pEventos.filter((e) => e.tipo === 'venda').length;
    const valorBruto = pEventos.filter((e) => e.tipo === 'venda').reduce((sum, e) => sum + (e.valor_bruto || 0), 0);
    const comissaoTotal = pEventos.filter((e) => ['venda', 'reembolso'].includes(e.tipo)).reduce((sum, e) => sum + (e.valor_comissao || 0), 0);
    const taxaConversao = cliques > 0 ? (vendas / cliques) * 100 : 0;
    const classificacao = getClassificacaoAutomatica(cliques, vendas, taxaConversao);
    return { cliques, vendas, valorBruto, comissaoTotal, taxaConversao, classificacao };
  };

  const getProdutosFiltrados = () => {
    return produtos.filter((produto) => {
      if (filtroPlataforma && produto.plataforma_id !== filtroPlataforma) return false;
      if (filtroCategoria && produto.categoria !== filtroCategoria) return false;
      if (filtroStatus && produto.status !== filtroStatus) return false;
      if (searchTerm && !produto.nome.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  };

  const handleSubmit = async (data: ProdutoFormData) => {
    if (!usuario) return;
    setFormLoading(true);
    try {
      if (editingProduto) {
        const { error } = await supabase
          .from('produtos')
          .update({ ...data, atualizado_em: new Date().toISOString() })
          .eq('id', editingProduto.id)
          .eq('usuario_id', usuario.id);
        if (error) throw error;
        toast.success(MENSAGENS.PRODUTO_SALVO);
      } else {
        const codigoCurto = Math.random().toString(36).substring(2, 10).toUpperCase();
        const { error } = await supabase.from('produtos').insert({
          usuario_id: usuario.id,
          ...data,
          link_curto_codigo: codigoCurto,
          data_cadastro: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
          origem: 'manual',
        });
        if (error) throw error;
        toast.success(MENSAGENS.PRODUTO_SALVO);
      }
      fetchData();
      setIsModalOpen(false);
      setEditingProduto(undefined);
    } catch (err) {
      toast.error(MENSAGENS.ERRO_GENERICO);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!usuario || !produtoToDelete) return;
    setDeleteLoading(true);
    try {
      const { error } = await supabase.from('produtos').delete().eq('id', produtoToDelete.id).eq('usuario_id', usuario.id);
      if (error) throw error;
      toast.success(MENSAGENS.PRODUTO_EXCLUIDO);
      fetchData();
      setIsDeleteDialogOpen(false);
      setProdutoToDelete(null);
    } catch (err) {
      toast.error(MENSAGENS.ERRO_GENERICO);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCopyLink = async (produto: Produto) => {
    const link = `${window.location.origin}/r/${produto.link_curto_codigo}`;
    const success = await copyToClipboard(link);
    if (success) toast.success(MENSAGENS.LINK_COPADO);
    else toast.error('Falha ao copiar link');
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && produtos.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">{error}</div>
        <Button onClick={fetchData} className="mt-4">Tentar Novamente</Button>
      </div>
    );
  }

  const produtosFiltrados = getProdutosFiltrados();

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">Gerencie seus produtos de afiliados</p>
        </div>
        <Button onClick={() => { setEditingProduto(undefined); setIsModalOpen(true); }} leftIcon={<Plus className="w-4 h-4" />}>
          Adicionar Produto
        </Button>
      </div>

      <ProdutosFiltros
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filtroPlataforma={filtroPlataforma}
        setFiltroPlataforma={setFiltroPlataforma}
        filtroCategoria={filtroCategoria}
        setFiltroCategoria={setFiltroCategoria}
        filtroStatus={filtroStatus}
        setFiltroStatus={setFiltroStatus}
        plataformas={plataformas}
      />

      <ProdutosTable
        produtos={produtosFiltrados}
        produtosTotalCount={produtos.length}
        getProdutoMetricas={getProdutoMetricas}
        onEdit={(p) => { setEditingProduto(p); setIsModalOpen(true); }}
        onCopyLink={handleCopyLink}
        onDelete={(p) => { setProdutoToDelete(p); setIsDeleteDialogOpen(true); }}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduto ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            <DialogDescription>{editingProduto ? 'Edite os dados do produto' : 'Adicione um novo produto ao seu catálogo'}</DialogDescription>
          </DialogHeader>
          <ProdutoForm
            produto={editingProduto}
            plataformas={plataformas}
            onSubmit={handleSubmit}
            onCancel={() => { setIsModalOpen(false); setEditingProduto(undefined); }}
            loading={formLoading}
          />
        </DialogContent>
      </Dialog>

      <ConfirmarExclusaoDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => { setIsDeleteDialogOpen(false); setProdutoToDelete(null); }}
        onConfirm={handleDelete}
        produtoNome={produtoToDelete?.nome || ''}
        loading={deleteLoading}
      />
    </div>
  );
}
