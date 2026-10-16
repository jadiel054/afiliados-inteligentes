import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LIMITES, CATEGORIAS_NICHO, STATUS_PRODUTO } from '@/lib/constantes';
import type { Produto, Plataforma, ProdutoFormData, StatusProduto } from '@/types';

interface ProdutoFormProps {
  produto?: Produto;
  plataformas: Plataforma[];
  onSubmit: (data: ProdutoFormData) => void;
  onCancel: () => void;
  loading: boolean;
}

export function ProdutoForm({ produto, plataformas, onSubmit, onCancel, loading }: ProdutoFormProps) {
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
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.nome || formData.nome.length < LIMITES.NOME_MIN) {
      newErrors.nome = `O nome deve ter pelo menos ${LIMITES.NOME_MIN} caracteres`;
    }
    if (!formData.categoria) newErrors.categoria = 'Selecione uma categoria';
    if (!formData.plataforma_id) newErrors.plataforma_id = 'Selecione uma plataforma';
    if (!formData.valor || formData.valor <= 0) newErrors.valor = 'Informe um valor válido';
    if (!formData.comissao_percent || formData.comissao_percent <= 0) newErrors.comissao_percent = 'Informe uma comissão válida';
    if (!formData.link_original) newErrors.link_original = 'Informe o link original';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="space-y-2">
        <Label htmlFor="categoria">Categoria *</Label>
        <Select value={formData.categoria} onValueChange={(val) => handleChange('categoria', val)} disabled={loading}>
          <SelectTrigger className={errors.categoria ? 'border-destructive' : ''}>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIAS_NICHO.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoria && <p className="text-xs text-destructive">{errors.categoria}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="plataforma_id">Plataforma *</Label>
        <Select value={formData.plataforma_id} onValueChange={(val) => handleChange('plataforma_id', val)} disabled={loading}>
          <SelectTrigger className={errors.plataforma_id ? 'border-destructive' : ''}>
            <SelectValue placeholder="Selecione uma plataforma" />
          </SelectTrigger>
          <SelectContent>
            {plataformas.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.cor_hex }} />
                  {p.nome}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.plataforma_id && <p className="text-xs text-destructive">{errors.plataforma_id}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valor">Valor (R$) *</Label>
          <Input id="valor" type="number" value={formData.valor} onChange={(e) => handleChange('valor', parseFloat(e.target.value) || 0)} placeholder="0.00" step="0.01" min={LIMITES.VALOR_MIN} max={LIMITES.VALOR_MAX} disabled={loading} className={errors.valor ? 'border-destructive' : ''} />
          {errors.valor && <p className="text-xs text-destructive">{errors.valor}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="comissao_percent">Comissão (%) *</Label>
          <Input id="comissao_percent" type="number" value={formData.comissao_percent} onChange={(e) => handleChange('comissao_percent', parseFloat(e.target.value) || 0)} placeholder="0" step="0.01" min={LIMITES.COMISSAO_MIN} max={LIMITES.COMISSAO_MAX} disabled={loading} className={errors.comissao_percent ? 'border-destructive' : ''} />
          {errors.comissao_percent && <p className="text-xs text-destructive">{errors.comissao_percent}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="link_original">Link Original *</Label>
        <Input id="link_original" type="url" value={formData.link_original} onChange={(e) => handleChange('link_original', e.target.value)} placeholder="https://exemplo.com/produto" maxLength={LIMITES.LINK_MAX} disabled={loading} className={errors.link_original ? 'border-destructive' : ''} />
        {errors.link_original && <p className="text-xs text-destructive">{errors.link_original}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="link_afiliado">Link de Afiliado</Label>
        <Input id="link_afiliado" type="url" value={formData.link_afiliado} onChange={(e) => handleChange('link_afiliado', e.target.value)} placeholder="https://exemplo.com/afiliado/produto" maxLength={LIMITES.LINK_MAX} disabled={loading} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imagem_url">URL da Imagem</Label>
        <Input id="imagem_url" type="url" value={formData.imagem_url} onChange={(e) => handleChange('imagem_url', e.target.value)} placeholder="https://exemplo.com/imagem.jpg" maxLength={LIMITES.LINK_MAX} disabled={loading} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(val) => handleChange('status', val as StatusProduto)} disabled={loading}>
          <SelectTrigger><SelectValue placeholder="Selecione um status" /></SelectTrigger>
          <SelectContent>
            {STATUS_PRODUTO.map((st) => (
              <SelectItem key={st} value={st}>{st}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button type="submit" loading={loading}>{produto ? 'Salvar Alterações' : 'Cadastrar Produto'}</Button>
      </div>
    </form>
  );
}
