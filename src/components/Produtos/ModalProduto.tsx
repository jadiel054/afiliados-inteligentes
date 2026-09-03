import React, { useState } from 'react';
import { Produto, SlugPlataforma } from '../../types';
import { gerarLinkCurto } from '../../lib/dadosService';
import { X, Sparkles, Link2 } from 'lucide-react';
import { toast } from 'sonner';

interface ModalProdutoProps {
  isOpen: boolean;
  produtoParaEditar?: Produto | null;
  onSalvar: (produto: Produto) => void;
  onClose: () => void;
}

export const ModalProduto: React.FC<ModalProdutoProps> = ({
  isOpen,
  produtoParaEditar,
  onSalvar,
  onClose,
}) => {
  if (!isOpen) return null;

  const [nome, setNome] = useState(produtoParaEditar?.nome || '');
  const [categoria, setCategoria] = useState(produtoParaEditar?.categoria || 'Beleza');
  const [plataformaSlug, setPlataformaSlug] = useState<SlugPlataforma>(
    (produtoParaEditar?.plataforma_slug as SlugPlataforma) || 'shopee'
  );
  const [valor, setValor] = useState(produtoParaEditar?.valor?.toString() || '');
  const [comissaoPercent, setComissaoPercent] = useState(
    produtoParaEditar?.comissao_percent?.toString() || ''
  );
  const [linkOriginal, setLinkOriginal] = useState(produtoParaEditar?.link_original || '');
  const [imagemUrl, setImagemUrl] = useState(
    produtoParaEditar?.imagem_url || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&q=80'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome || !valor || !comissaoPercent || !linkOriginal) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    const valNum = parseFloat(valor);
    const comNum = parseFloat(comissaoPercent);

    if (isNaN(valNum) || valNum <= 0) {
      toast.error('Informe um valor de produto válido.');
      return;
    }

    if (isNaN(comNum) || comNum <= 0) {
      toast.error('Informe uma porcentagem de comissão válida.');
      return;
    }

    const nomePlat =
      plataformaSlug === 'shopee' ? 'Shopee' :
      plataformaSlug === 'mercado-livre' ? 'Mercado Livre' :
      plataformaSlug === 'magalu' ? 'Magalu' : 'AliExpress';

    const idPlat =
      plataformaSlug === 'shopee' ? '1' :
      plataformaSlug === 'mercado-livre' ? '2' :
      plataformaSlug === 'magalu' ? '3' : '4';

    const linkCurtoFinal = produtoParaEditar?.link_curto || gerarLinkCurto(nome, plataformaSlug);

    const prodSalvar: Produto = {
      id: produtoParaEditar?.id || `prod-${Date.now()}`,
      nome,
      categoria,
      plataforma_id: idPlat,
      plataforma_slug: plataformaSlug,
      plataforma_nome: nomePlat,
      valor: valNum,
      comissao_percent: comNum,
      link_original: linkOriginal,
      link_curto: linkCurtoFinal,
      imagem_url: imagemUrl,
      status: produtoParaEditar?.status || 'ativo',
      pontuacao_agente: produtoParaEditar?.pontuacao_agente || 80,
      razao_escolha: produtoParaEditar?.razao_escolha || 'Cadastrado manualmente pelo usuário com boa margem.',
      data_cadastro: produtoParaEditar?.data_cadastro || new Date().toISOString(),
    };

    onSalvar(prodSalvar);
    toast.success(produtoParaEditar ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
          {produtoParaEditar ? '✏️ Editar Produto' : '➕ Cadastrar Novo Produto'}
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          O link encurtado de rastreio será gerado automaticamente.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome do Produto *
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Kit Sérum Anti-Idade Vitamina C"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Plataforma *
              </label>
              <select
                value={plataformaSlug}
                onChange={e => setPlataformaSlug(e.target.value as SlugPlataforma)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="shopee">Shopee</option>
                <option value="mercado-livre">Mercado Livre</option>
                <option value="magalu">Magalu</option>
                <option value="aliexpress">AliExpress</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Beleza">Beleza</option>
                <option value="Pele">Pele</option>
                <option value="Maquiagem">Maquiagem</option>
                <option value="Cabelo">Cabelo</option>
                <option value="Perfumaria">Perfumaria</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                value={valor}
                onChange={e => setValor(e.target.value)}
                placeholder="49.90"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Comissão (%) *
              </label>
              <input
                type="number"
                step="0.1"
                value={comissaoPercent}
                onChange={e => setComissaoPercent(e.target.value)}
                placeholder="14.5"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Link Original do Produto *
            </label>
            <input
              type="url"
              value={linkOriginal}
              onChange={e => setLinkOriginal(e.target.value)}
              placeholder="https://shopee.com.br/product/..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              URL da Imagem
            </label>
            <input
              type="url"
              value={imagemUrl}
              onChange={e => setImagemUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/40 flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Link Curto Autogerado: <strong className="font-mono">{gerarLinkCurto(nome || 'exemplo', plataformaSlug)}</strong></span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20"
            >
              {produtoParaEditar ? 'Salvar Alterações' : 'Cadastrar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
