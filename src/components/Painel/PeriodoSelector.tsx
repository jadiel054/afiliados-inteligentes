import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PERIODOS } from '@/lib/constantes';
import type { Periodo } from '@/types';

const PERIODO_LABELS: Record<Periodo, string> = {
  hoje: 'Hoje',
  ontem: 'Ontem',
  ultimos_3: 'Últimos 3 dias',
  ultimos_5: 'Últimos 5 dias',
  ultimos_7: 'Últimos 7 dias',
  ultimos_15: 'Últimos 15 dias',
  ultimo_mes: 'Último mês',
  especifico: 'Data específica',
};

interface PeriodoSelectorProps {
  periodo: Periodo;
  onPeriodoChange: (periodo: Periodo) => void;
  dataEspecifica: string;
  onDataEspecificaChange: (data: string) => void;
}

export function PeriodoSelector({
  periodo,
  onPeriodoChange,
  dataEspecifica,
  onDataEspecificaChange,
}: PeriodoSelectorProps) {
  const [showDataInput, setShowDataInput] = useState(false);

  useEffect(() => {
    setShowDataInput(periodo === 'especifico');
  }, [periodo]);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Select value={periodo} onValueChange={(v) => onPeriodoChange(v as Periodo)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          {PERIODOS.map((p) => (
            <SelectItem key={p} value={p}>
              {PERIODO_LABELS[p] || p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showDataInput && (
        <input
          type="date"
          value={dataEspecifica}
          onChange={(e) => onDataEspecificaChange(e.target.value)}
          className="border rounded px-2 py-1 text-sm bg-background text-foreground"
        />
      )}
    </div>
  );
}
