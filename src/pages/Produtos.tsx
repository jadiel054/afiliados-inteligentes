// ============================================
// PÁGINA DE PRODUTOS - CRUD COMPLETO
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
import { Plus, Edit, Trash2, Copy, Eye, Search, Filter, MoreVertical, Link2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { MENSAGENS, LIMITES, CATEGORIAS_NICHO, STATUS_PRODUTO, PLATAFORMAS_CORES } from '@/lib/constantes';
import { formatarMoeda, formatarPorcentagem, copyToClipboard, getClassificacaoAutomatica } from '@/lib/constantes';
import type { Produto, Plataforma, ProdutoFormData, StatusProduto, ClassificacaoProduto } from '@/types';

// Componente para o formulário de produto
function ProdutoForm({
  produto,
  plataformas,
  onSubmit,
  onCancel,
  loading,
}: {
  produto?: Produto;
  plataformas: Plataforma[];
  onSubmit: (data: ProdutoFormData) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState<ProdutoFormData>({
    nome: produto?.nome || '',
    categoria: produto?.categoria || '',
    plataforma_id: produto?.plataforma_id || '',
    valor: produto?.valor || 0,
    comissao_percent: produto?.comissao_percent || 0,
    link_original: produto?.link_original || '',
    link_afiliado: produto?.link_afiliado || '',
    imagem_url: produto?.imagem_url || '',
    status: produto?.status || 'ativo',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof ProdutoFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro ao alterar campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nome || formData.nome.length < LIMITES.NOME_MIN) {
      newErrors.nome = `O nome deve ter pelo menos ${LIMITES.NOME_MIN} caracteres`;
    }
    
    if (!formData.categoria) {
      newErrors.categoria = 'Selecione uma categoria';
    }
    
    if (!formData.plataforma_id) {
      newErrors.plataforma_id = 'Selecione uma plataforma';
    }
    
    if (!formData.valor || formData.valor <= 0) {
      newErrors.valor = 'Informe um valor válido';
    }
    
    if (!formData.comissao_percent || formData.comissao_percent <= 0) {
      newErrors.comissao_percent = 'Informe uma comissão válida';
    }
    
    if (!formData.link_original) {
      newErrors.link_original = 'Informe o link original';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="nome">Nome *</Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => handleChange('nome', e.target.value)}
          placeholder="Nome do produto"
          minLength={LIMITES.NOME_MIN}
          maxLength={LIMITES.NOME_MAX}
          disabled={loading}
          className={errors.nome ? 'border-destructive' : ''}
        />
        {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
      </div>

      {/* Categoria */}
      <div className="space-y-2">
        <Label htmlFor="categoria">Categoria *</Label>
        <Select
          value={formData.categoria}
          onValueChange={(value) => handleChange('categoria', value)}
          disabled={loading}
        >
          <SelectTrigger className={errors.categoria ? 'border-destructive' : ''}>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIAS_NICHO.map(categoria => (
              <SelectItem key={categoria} value={categoria}>
                {categoria}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoria && <p className="text-xs text-destructive">{errors.categoria}</p>}
      </div>

      {/* Plataforma */}
      <div className="space-y-2">
        <Label htmlFor="plataforma_id">Plataforma *</Label>
        <Select
          value={formData.plataforma_id}
          onValueChange={(value) => handleChange('plataforma_id', value)}
          disabled={loading}
        >
          <SelectTrigger className={errors.plataforma_id ? 'border-destructive' : ''}>
            <SelectValue placeholder="Selecione uma plataforma" />
          </SelectTrigger>
          <SelectContent>
            {plataformas.map(plataforma => (
              <SelectItem key={plataforma.id} value={plataforma.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: plataforma.cor_hex }}
                  />
                  {plataforma.nome}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.plataforma_id && <p className="text-xs text-destructive">{errors.plataforma_id}</p>}
      </div>

      {/* Valor e Comissão */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valor">Valor (R$) *</Label>
          <Input
            id="valor"
            type="number"
            value={formData.valor}
            onChange={(e) => handleChange('valor', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            step="0.01"
            min={LIMITES.VALOR_MIN}
            max={LIMITES.VALOR_MAX}
            disabled={loading}
            className={errors.valor ? 'border-destructive' : ''}
          />
          {errors.valor && <p className="text-xs text-destructive">{errors.valor}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="comissao_percent">Comissão (%) *</Label>
          <Input
            id="comissao_percent"
            type="number"
            value={formData.comissao_percent}
            onChange={(e) => handleChange('comissao_percent', parseFloat(e.target.value) || 0)}
            placeholder="0"
            step="0.01"
            min={LIMITES.COMISSAO_MIN}
            max={LIMITES.COMISSAO_MAX}
            disabled={loading}
            className={errors.comissao_percent ? 'border-destructive' : ''}
          />
          {errors.comissao_percent && <p className="text-xs text-destructive">{errors.comissao_percent}</p>}
        </div>
      </div>

      {/* Link Original */}
      <div className="space-y-2">
        <Label htmlFor="link_original">Link Original *</Label>
        <Input
          id="link_original"
          type="url"
          value={formData.link_original}
          onChange={(e) => handleChange('link_original', e.target.value)}
          placeholder="https://exemplo.com/produto"
          maxLength={LIMITES.LINK_MAX}
          disabled={loading}
          className={errors.link_original ? 'border-destructive' : ''}
        />
        {errors.link_original && <p className="text-xs text-destructive">{errors.link_original}</p>}
      </div>

      {/* Link Afiliado */}
      <div className="space-y-2">
        <Label htmlFor="link_afiliado">Link de Afiliado</Label>
        <Input
          id="link_afiliado"
          type="url"
          value={formData.link_afiliado}
          onChange={(e) => handleChange('link_afiliado', e.target.value)}
          placeholder="https://exemplo.com/afiliado/produto"
          maxLength={LIMITES.LINK_MAX}
          disabled={loading}
        />
      </div>

      {/* Imagem URL */}
      <div className="space-y-2">
        <Label htmlFor="imagem_url">URL da Imagem</Label>
        <Input
          id="imagem_url"
          type="url"
          value={formData.imagem_url}
          onChange={(e) => handleChange('imagem_url', e.target.value)}
          placeholder="https://exemplo.com/imagem.jpg"
          maxLength={LIMITES.LINK_MAX}
          disabled={loading}
        />
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => handleChange('status', value as StatusProduto)}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_PRODUTO.map(status => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Botões */}
      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {produto ? 'Salvar Alterações' : 'Cadastrar Produto'}
        </Button>
      </div>
    </form>
  );
}

// Componente para confirmar exclusão
function ConfirmarExclusaoDialog({
  isOpen,
  onClose,
  onConfirm,
  produtoNome,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  produtoNome: string;
  loading: boolean;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogDescription>
            Tem certeza? Esta ação não pode ser desfeita. O produto "{produtoNome}" será removido, mas o histórico de vendas será preservado.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} loading={loading}>
            Sim, Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Componente principal da página de Produtos
export default function Produtos() {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [plataformas, setPlataformas] = useState<Plataforma[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  
  // Estados para modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | undefined>(undefined);
  const [formLoading, setFormLoading] = useState(false);
  
  // Estados para exclusão
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [produtoToDelete, setProdutoToDelete] = useState<Produto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Estados para filtros
  const [filtroPlataforma, setFiltroPlataforma] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusProduto | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Buscar dados
  const fetchData = useCallback(async () => {
    if (!usuario) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Buscar produtos
      const { data: produtosData, error: produtosError } = await supabase
        .from('produtos')
        .select('*, plataforma:plataformas(*)')
        .eq('usuario_id', usuario.id)
        .order('atualizado_em', { ascending: false });
      
      if (produtosError) throw produtosError;
      
      // Buscar plataformas
      const { data: plataformasData, error: plataformasError } = await supabase
        .from('plataformas')
        .select('*');
      
      if (plataformasError) throw plataformasError;
      
      // Buscar eventos para calcular métricas
      const { data: eventosData, error: eventosError } = await supabase
        .from('eventos')
        .select('*')
        .eq('usuario_id', usuario.id);
      
      if (eventosError) throw eventosError;
      
      setProdutos(produtosData || []);
      setPlataformas(plataformasData || []);
      setEventos(eventosData || []);
      
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError(MENSAGENS.ERRO_GENERICO);
      toast.error(MENSAGENS.ERRO_GENERICO);
    } finally {
      setLoading(false);
    }
  }, [usuario]);

  // Calcular métricas para cada produto
  const getProdutoMetricas = (produtoId: string) => {
    const pEventos = eventos.filter(e => e.produto_id === produtoId);
    const cliques = pEventos.filter(e => e.tipo === 'clique').length;
    const vendas = pEventos.filter(e => e.tipo === 'venda').length;
    const valorBruto = pEventos
      .filter(e => e.tipo === 'venda')
      .reduce((sum, e) => sum + (e.valor_bruto || 0), 0);
    const comissaoTotal = pEventos
      .filter(e => ['venda', 'reembolso'].includes(e.tipo))
      .reduce((sum, e) => sum + (e.valor_comissao || 0), 0);
    
    const taxaConversao = cliques > 0 ? (vendas / cliques) * 100 : 0;
    const classificacao = getClassificacaoAutomatica(cliques, vendas, taxaConversao);
    
    return { cliques, vendas, valorBruto, comissaoTotal, taxaConversao, classificacao };
  };

  // Filtrar produtos
  const getProdutosFiltrados = () => {
    return produtos.filter(produto => {
      if (filtroPlataforma && produto.plataforma_id !== filtroPlataforma) return false;
      if (filtroCategoria && produto.categoria !== filtroCategoria) return false;
      if (filtroStatus && produto.status !== filtroStatus) return false;
      if (searchTerm && !produto.nome.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  };

  // Cadastrar ou editar produto
  const handleSubmit = async (data: ProdutoFormData) => {
    if (!usuario) return;
    
    setFormLoading(true);
    try {
      if (editingProduto) {
        // Editar produto existente
        const { error } = await supabase
          .from('produtos')
          .update({
            ...data,
            atualizado_em: new Date().toISOString(),
          })
          .eq('id', editingProduto.id)
          .eq('usuario_id', usuario.id);
        
        if (error) throw error;
        
        toast.success(MENSAGENS.PRODUTO_SALVO);
        fetchData();
        setIsModalOpen(false);
        setEditingProduto(undefined);
      } else {
        // Criar novo produto
        // Gerar código curto (simulação - na prática será feito via Edge Function)
        const codigoCurto = Math.random().toString(36).substring(2, 10).toUpperCase();
        
        const { error } = await supabase
          .from('produtos')
          .insert({
            usuario_id: usuario.id,
            ...data,
            link_curto_codigo: codigoCurto,
            data_cadastro: new Date().toISOString(),
            atualizado_em: new Date().toISOString(),
            origem: 'manual',
          });
        
        if (error) throw error;
        
        toast.success(MENSAGENS.PRODUTO_SALVO);
        fetchData();
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      toast.error(MENSAGENS.ERRO_GENERICO);
    } finally {
      setFormLoading(false);
    }
  };

  // Excluir produto
  const handleDelete = async () => {
    if (!usuario || !produtoToDelete) return;
    
    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', produtoToDelete.id)
        .eq('usuario_id', usuario.id);
      
      if (error) throw error;
      
      toast.success(MENSAGENS.PRODUTO_EXCLUIDO);
      fetchData();
      setIsDeleteDialogOpen(false);
      setProdutoToDelete(null);
    } catch (err) {
      console.error('Erro ao excluir produto:', err);
      toast.error(MENSAGENS.ERRO_GENERICO);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Copiar link curto
  const handleCopyLink = async (produto: Produto) => {
    const link = `${window.location.origin}/r/${produto.link_curto_codigo}`;
    const success = await copyToClipboard(link);
    if (success) {
      toast.success(MENSAGENS.LINK_COPADO);
    } else {
      toast.error('Falha ao copiar link');
    }
  };

  // Buscar dados ao montar o componente
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
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie seus produtos de afiliados
          </p>
        </div>
        <Button onClick={() => {
          setEditingProduto(undefined);
          setIsModalOpen(true);
        }} leftIcon={<Plus className="w-4 h-4" />}>
          Adicionar Produto
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Plataforma */}
            <div className="space-y-2">
              <Label htmlFor="filtro-plataforma">Plataforma</Label>
              <Select
                value={filtroPlataforma}
                onValueChange={setFiltroPlataforma}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as plataformas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as plataformas</SelectItem>
                  {plataformas.map(plataforma => (
                    <SelectItem key={plataforma.id} value={plataforma.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: plataforma.cor_hex }}
                        />
                        {plataforma.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="filtro-categoria">Categoria</Label>
              <Select
                value={filtroCategoria}
                onValueChange={setFiltroCategoria}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as categorias</SelectItem>
                  {CATEGORIAS_NICHO.map(categoria => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="filtro-status">Status</Label>
              <Select
                value={filtroStatus}
                onValueChange={(value) => setFiltroStatus(value as StatusProduto | '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  {STATUS_PRODUTO.map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
          <CardDescription>
            {getProdutosFiltrados().length} produtos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {getProdutosFiltrados().length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum produto encontrado</p>
              {produtos.length === 0 && (
                <p className="text-sm mt-2">
                  Adicione seu primeiro produto clicando no botão "Adicionar Produto"
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Cliques</TableHead>
                    <TableHead>Vendas</TableHead>
                    <TableHead>Classificação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getProdutosFiltrados().map(produto => {
                    const metricas = getProdutoMetricas(produto.id);
                    const classificacao = metricas.classificacao;
                    
                    return (
                      <TableRow key={produto.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {produto.nome}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: produto.plataforma?.cor_hex || '#ccc' }}
                            />
                            {produto.plataforma?.nome || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>{produto.categoria}</TableCell>
                        <TableCell>{formatarMoeda(produto.valor)}</TableCell>
                        <TableCell>{formatarPorcentagem(produto.comissao_percent)}</TableCell>
                        <TableCell>{metricas.cliques}</TableCell>
                        <TableCell>{metricas.vendas}</TableCell>
                        <TableCell>
                          {classificacao && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              classificacao === 'campeao' ? 'bg-green-500/10 text-green-600' :
                              classificacao === 'promissor' ? 'bg-blue-500/10 text-blue-600' :
                              classificacao === 'estavel' ? 'bg-yellow-500/10 text-yellow-600' :
                              'bg-red-500/10 text-red-600'
                            }`}>
                              {classificacao}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            produto.status === 'ativo' ? 'bg-green-500/10 text-green-600' :
                            produto.status === 'pausado' ? 'bg-yellow-500/10 text-yellow-600' :
                            'bg-red-500/10 text-red-600'
                          }`}>
                            {produto.status}
                          </span>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingProduto(produto);
                              setIsModalOpen(true);
                            }}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyLink(produto)}
                            title="Copiar Link Curto"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setProdutoToDelete(produto);
                              setIsDeleteDialogOpen(true);
                            }}
                            title="Excluir"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de produto */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduto ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
            <DialogDescription>
              {editingProduto ? 'Edite os dados do produto' : 'Adicione um novo produto ao seu catálogo'}
            </DialogDescription>
          </DialogHeader>
          <ProdutoForm
            produto={editingProduto}
            plataformas={plataformas}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingProduto(undefined);
            }}
            loading={formLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <ConfirmarExclusaoDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setProdutoToDelete(null);
        }}
        onConfirm={handleDelete}
        produtoNome={produtoToDelete?.nome || ''}
        loading={deleteLoading}
      />

      {/* Dialog para copiar link */}
    </div>
  );
}
