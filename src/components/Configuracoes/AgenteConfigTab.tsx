// ============================================
// COMPONENTE: ABAS DE CONFIGURAÇÃO DO AGENTE
// ============================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CONFIG_PADRAO_AGENTE, CATEGORIAS_NICHO, MODOS_AGENTE, LIMITES } from '@/lib/constantes';
import type { ConfigAgente, ConfigAgenteFormData } from '@/types';

export function AgenteConfigTab({ 
  config,
  onSave,
  loading 
}: {
  config: ConfigAgente | null;
  onSave: (data: ConfigAgente) => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState<ConfigAgenteFormData>(config || { ...CONFIG_PADRAO_AGENTE });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof ConfigAgenteFormData, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (formData.pontuacao_agir < formData.pontuacao_propor) {
      newErrors.pontuacao_agir = 'A pontuação para agir deve ser maior ou igual à pontuação para propor';
    }
    if (formData.comissao_minima < 0 || formData.comissao_minima > 100) {
      newErrors.comissao_minima = 'A comissão mínima deve estar entre 0 e 100';
    }
    if (formData.valor_maximo < 0) {
      newErrors.valor_maximo = 'O valor máximo deve ser positivo';
    }
    if (formData.rodar_a_cada_horas < LIMITES.RODAR_A_CADA_HORAS_MIN || formData.rodar_a_cada_horas > LIMITES.RODAR_A_CADA_HORAS_MAX) {
      newErrors.rodar_a_cada_horas = `Deve estar entre ${LIMITES.RODAR_A_CADA_HORAS_MIN} e ${LIMITES.RODAR_A_CADA_HORAS_MAX}`;
    }
    if (formData.max_produtos_dia < LIMITES.MAX_PRODUTOS_DIA_MIN || formData.max_produtos_dia > LIMITES.MAX_PRODUTOS_DIA_MAX) {
      newErrors.max_produtos_dia = `Deve estar entre ${LIMITES.MAX_PRODUTOS_DIA_MIN} e ${LIMITES.MAX_PRODUTOS_DIA_MAX}`;
    }
    if (formData.horario_inicio < LIMITES.HORARIO_MIN || formData.horario_inicio > LIMITES.HORARIO_MAX) {
      newErrors.horario_inicio = `Deve estar entre ${LIMITES.HORARIO_MIN} e ${LIMITES.HORARIO_MAX}`;
    }
    if (formData.horario_fim < LIMITES.HORARIO_MIN || formData.horario_fim > LIMITES.HORARIO_MAX) {
      newErrors.horario_fim = `Deve estar entre ${LIMITES.HORARIO_MIN} e ${LIMITES.HORARIO_MAX}`;
    }
    if (formData.categorias.length === 0) {
      newErrors.categorias = 'Selecione pelo menos uma categoria';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSave(formData as ConfigAgente);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="modo">Modo de Operação</Label>
        <Select
          value={formData.modo}
          onValueChange={(value) => handleChange('modo', value as 'desligado' | 'semi_autonomo' | 'autonomo_total')}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um modo" />
          </SelectTrigger>
          <SelectContent>
            {MODOS_AGENTE.map(modo => (
              <SelectItem key={modo} value={modo}>
                {modo === 'desligado' ? 'Desligado' :
                 modo === 'semi_autonomo' ? 'Semi-Autônomo' : 'Autônomo Total'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pontuacao_propor">Pontuação para Propor</Label>
          <Input
            id="pontuacao_propor"
            type="number"
            value={formData.pontuacao_propor}
            onChange={(e) => handleChange('pontuacao_propor', parseInt(e.target.value) || 0)}
            min={LIMITES.PONTUACAO_MIN}
            max={LIMITES.PONTUACAO_MAX}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pontuacao_agir">Pontuação para Agir</Label>
          <Input
            id="pontuacao_agir"
            type="number"
            value={formData.pontuacao_agir}
            onChange={(e) => handleChange('pontuacao_agir', parseInt(e.target.value) || 0)}
            min={LIMITES.PONTUACAO_MIN}
            max={LIMITES.PONTUACAO_MAX}
            disabled={loading}
            className={errors.pontuacao_agir ? 'border-destructive' : ''}
          />
          {errors.pontuacao_agir && <p className="text-xs text-destructive">{errors.pontuacao_agir}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="comissao_minima">Comissão Mínima (%)</Label>
          <Input
            id="comissao_minima"
            type="number"
            value={formData.comissao_minima}
            onChange={(e) => handleChange('comissao_minima', parseFloat(e.target.value) || 0)}
            step="0.01"
            min={0}
            max={100}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="valor_maximo">Valor Máximo (R$)</Label>
          <Input
            id="valor_maximo"
            type="number"
            value={formData.valor_maximo}
            onChange={(e) => handleChange('valor_maximo', parseFloat(e.target.value) || 0)}
            step="0.01"
            min={0}
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rodar_a_cada_horas">Rodar a cada (horas)</Label>
          <Input
            id="rodar_a_cada_horas"
            type="number"
            value={formData.rodar_a_cada_horas}
            onChange={(e) => handleChange('rodar_a_cada_horas', parseInt(e.target.value) || 1)}
            min={LIMITES.RODAR_A_CADA_HORAS_MIN}
            max={LIMITES.RODAR_A_CADA_HORAS_MAX}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_produtos_dia">Máx. Produtos/Dia</Label>
          <Input
            id="max_produtos_dia"
            type="number"
            value={formData.max_produtos_dia}
            onChange={(e) => handleChange('max_produtos_dia', parseInt(e.target.value) || 1)}
            min={LIMITES.MAX_PRODUTOS_DIA_MIN}
            max={LIMITES.MAX_PRODUTOS_DIA_MAX}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label>Categorias</Label>
          <div className="flex flex-wrap gap-1">
            {formData.categorias.map(categoria => (
              <Badge key={categoria} variant="secondary" className="text-xs">
                {categoria}
              </Badge>
            ))}
          </div>
          {errors.categorias && <p className="text-xs text-destructive">{errors.categorias}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="horario_inicio">Horário Início</Label>
          <Input
            id="horario_inicio"
            type="number"
            value={formData.horario_inicio}
            onChange={(e) => handleChange('horario_inicio', parseInt(e.target.value) || 0)}
            min={LIMITES.HORARIO_MIN}
            max={LIMITES.HORARIO_MAX}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="horario_fim">Horário Fim</Label>
          <Input
            id="horario_fim"
            type="number"
            value={formData.horario_fim}
            onChange={(e) => handleChange('horario_fim', parseInt(e.target.value) || 23)}
            min={LIMITES.HORARIO_MIN}
            max={LIMITES.HORARIO_MAX}
            disabled={loading}
          />
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        Salvar Configurações do Agente
      </Button>
    </form>
  );
}
