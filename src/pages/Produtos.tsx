import React, { useState, useEffect } from 'react';
import { Produto, SlugPlataforma } from '../types';
import { carregarProdutos, salvarProdutos } from '../lib/dadosService';
import { BadgePlataforma } from '../components/ui/BadgePlataforma';
import { ModalConfirmacao } from '../components/ui/ModalConfirmacao';
import { ModalProduto } from '../components/Produtos/ModalProduto';
import {
  Plus,
  Search,
  Filter,
  Copy,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export const Produtos: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroPlataforma, setFiltroPlataforma] = useState<string>('todas');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');

  // Controle de Modais
  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);

  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [produtoExcluindo, setProdutoExcluindo] = useState<Produto | null>(null);

  useEffect(() => {
    const prods = carregarProdutos();
    setProdutos(prods);
  }, []);

  const handleSalvarProduto = (prodSalvar: Produto) => {
    let novaLista: Produto[];
    const existe = produtos.some(p => p.id === prodSalvar.id);

    if (existe) {
      novaLista = produtos.map(p => (p.id === prodSalvar.id ? prodSalvar : p));
    } else {
      novaLista = [prodSalvar, ...produtos];
    }

    setProdutos(novaLista);
    salvarProdutos(novaLista);
  };

  const handleConfirmarExclusao = () => {
    if (!produtoExcluindo) return;

    const novaLista = produtos.filter(p => p.id !== produtoExcluindo.id);
    setProdutos(novaLista);
    salvarProdutos(novaLista);

    toast.success(`Produto "${produtoExcluindo.nome}" excluído com sucesso!`);
    setModalExcluirAberto(false);
    setProdutoExcluindo(null);
  };

  const handleCopiarLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência!', {
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    });
  };

  // Filtragem
  const produtosFiltrados = produtos.filter(p => {
    const atendeBusca =
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.categoria.toLowerCase().includes(busca.toLowerCase());

    const atendePlataforma =
      filtroPlataforma === 'todas' ||
      p.plataforma_slug === filtroPlataforma ||
      p.plataforma_id === filtroPlataforma;

    const atendeCategoria =
      filtroCategoria === 'todas' ||
      p.categoria.toLowerCase() === filtroCategoria.toLowerCase();

    return atendeBusca && atendePlataforma && atendeCategoria;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Gestão de Produtos & Links
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cadastre, edite e monitore os links de afiliados de todas as plataformas.
          </p>
        </div>

        <button
          onClick={() => {
            setProdutoEditando(null);
            setModalProdutoAberto(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Produto
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Busca por texto */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome do produto ou categoria..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro por Plataforma */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filtroPlataforma}
              onChange={e => setFiltroPlataforma(e.target.value)}
              className="w-full md:w-40 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas Plataformas</option>
              <option value="shopee">Shopee</option>
              <option value="mercado-livre">Mercado Livre</option>
              <option value="magalu">Magalu</option>
              <option value="aliexpress">AliExpress</option>
            </select>
          </div>

          {/* Filtro por Categoria */}
          <div>
            <select
              value={filtroCategoria}
              onChange={e => setFiltroCategoria(e.target.value)}
              className="w-full md:w-36 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas Categoriass</option>
              <option value="Beleza">Beleza</option>
              <option value="Pele">Pele</option>
              <option value="Maquiagem">Maquiagem</option>
              <option value="Cabelo">Cabelo</option>
              <option value="Perfumaria">Perfumaria</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Produtos (Grid Responsivo) */}
      {produtosFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Nenhum produto encontrado
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Não há produtos correspondentes aos filtros selecionados. Tente alterar a busca ou cadastrar um novo produto.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {produtosFiltrados.map(produto => (
            <div
              key={produto.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all p-4 flex flex-col justify-between"
            >
              <div>
                {/* Imagem + Badge */}
                <div className="relative h-40 w-full mb-3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <img
                    src={produto.imagem_url || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&q=80'}
                    alt={produto.nome}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <BadgePlataforma
                      slug={produto.plataforma_slug}
                      nome={produto.plataforma_nome}
                    />
                  </div>
                  {produto.pontuacao_agente && (
                    <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-700">
                      Score: {produto.pontuacao_agente}
                    </div>
                  )}
                </div>

                {/* Categoria + Nome */}
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {produto.categoria}
                </span>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 mt-0.5 mb-2">
                  {produto.nome}
                </h4>

                {/* Preço e Comissão */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/40 mb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Preço</span>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      R$ {produto.valor.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Comissão ({produto.comissao_percent}%)</span>
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      R$ {((produto.valor * produto.comissao_percent) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Link Curto */}
                <div className="mb-4">
                  <span className="text-[10px] text-slate-400 block mb-1">Link de Rastreio</span>
                  <div className="flex items-center justify-between gap-1 bg-slate-100 dark:bg-slate-900 p-2 rounded-xl font-mono text-[11px] text-slate-700 dark:text-slate-300 overflow-hidden">
                    <span className="truncate">{produto.link_curto}</span>
                    <button
                      onClick={() => handleCopiarLink(produto.link_curto)}
                      title="Copiar Link"
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-blue-600 shrink-0 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/60 gap-2">
                <a
                  href={produto.link_original}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Original
                </a>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setProdutoEditando(produto);
                      setModalProdutoAberto(true);
                    }}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setProdutoExcluindo(produto);
                      setModalExcluirAberto(true);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Cadastro / Edição */}
      <ModalProduto
        isOpen={modalProdutoAberto}
        produtoParaEditar={produtoEditando}
        onSalvar={handleSalvarProduto}
        onClose={() => {
          setModalProdutoAberto(false);
          setProdutoEditando(null);
        }}
      />

      {/* Modal de Confirmação para Exclusão */}
      <ModalConfirmacao
        isOpen={modalExcluirAberto}
        titulo="Tem certeza?"
        mensagem={`Deseja realmente excluir o produto "${produtoExcluindo?.nome}"? Esta ação não pode ser desfeita.`}
        textoConfirmar="Sim, Excluir"
        textoCancelar="Cancelar"
        variant="danger"
        onConfirm={handleConfirmarExclusao}
        onClose={() => {
          setModalExcluirAberto(false);
          setProdutoExcluindo(null);
        }}
      />
    </div>
  );
};
