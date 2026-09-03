import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Evento, Produto } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface GraficosPainelProps {
  eventos: Evento[];
  produtos: Produto[];
}

export const GraficosPainel: React.FC<GraficosPainelProps> = ({ eventos, produtos }) => {
  // 1. Gráfico de Distribuição por Plataforma
  const contagemPorPlataforma: Record<string, number> = {
    'Shopee': 0,
    'Mercado Livre': 0,
    'Magalu': 0,
    'AliExpress': 0,
  };

  eventos.forEach(ev => {
    if (ev.tipo === 'venda') {
      const prod = produtos.find(p => p.id === ev.produto_id);
      if (prod) {
        const nomePlat = prod.plataforma_nome || prod.plataforma_slug || 'Outros';
        if (nomePlat.toLowerCase().includes('shopee')) contagemPorPlataforma['Shopee'] += ev.valor_comissao;
        else if (nomePlat.toLowerCase().includes('mercado')) contagemPorPlataforma['Mercado Livre'] += ev.valor_comissao;
        else if (nomePlat.toLowerCase().includes('magalu')) contagemPorPlataforma['Magalu'] += ev.valor_comissao;
        else if (nomePlat.toLowerCase().includes('ali')) contagemPorPlataforma['AliExpress'] += ev.valor_comissao;
      }
    }
  });

  const doughnutData = {
    labels: Object.keys(contagemPorPlataforma),
    datasets: [
      {
        data: Object.values(contagemPorPlataforma),
        backgroundColor: ['#f97316', '#eab308', '#2563eb', '#ef4444'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  // 2. Evolução de Vendas e Comissões
  const lineData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [
      {
        fill: true,
        label: 'Comissão (R$)',
        data: [120, 190, 300, 250, 420, 310, 480],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
      },
      {
        fill: true,
        label: 'Vendas Brutas (R$)',
        data: [800, 1200, 2100, 1800, 3100, 2400, 3900],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        tension: 0.4,
      },
    ],
  };

  // 3. Produtos mais clicados vs mais vendidos
  const barData = {
    labels: produtos.slice(0, 4).map(p => p.nome.slice(0, 12) + '...'),
    datasets: [
      {
        label: 'Cliques',
        data: [140, 95, 80, 60],
        backgroundColor: '#60a5fa',
        borderRadius: 8,
      },
      {
        label: 'Vendas',
        data: [24, 18, 12, 9],
        backgroundColor: '#10b981',
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Gráfico 1: Evolução */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">
          Evolução de Vendas e Comissões
        </h3>
        <div className="h-60">
          <Line
            data={lineData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } },
            }}
          />
        </div>
      </div>

      {/* Gráfico 2: Distribuição por Plataforma */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col items-center">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 self-start">
          Comissão por Plataforma
        </h3>
        <div className="h-60 w-full max-w-xs flex items-center justify-center">
          <Doughnut
            data={doughnutData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } },
            }}
          />
        </div>
      </div>

      {/* Gráfico 3: Desempenho de Produtos */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm lg:col-span-2">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">
          Produtos Mais Clicados vs Mais Vendidos
        </h3>
        <div className="h-64">
          <Bar
            data={barData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } },
            }}
          />
        </div>
      </div>
    </div>
  );
};
