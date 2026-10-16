import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { CATEGORIAS_NICHO, STATUS_PRODUTO } from '@/lib/constantes';
import type { Plataforma, StatusProduto } from '@/types';

interface ProdutosFiltrosProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filtroPlataforma: string;
  setFiltroPlataforma: (val: string) => void;
  filtroCategoria: string;
  setFiltroCategoria: (val: string) => void;
  filtroStatus: StatusProduto | '';
  setFiltroStatus: (val: StatusProduto | '') => void;
  plataformas: Plataforma[];
}

export function ProdutosFiltros({
  searchTerm,
  setSearchTerm,
  filtroPlataforma,
  setFiltroPlataforma,
  filtroCategoria,
  setFiltroCategoria,
  filtroStatus,
  setFiltroStatus,
  plataformas,
}: ProdutosFiltrosProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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

          <div className="space-y-2">
            <Label htmlFor="filtro-plataforma">Plataforma</Label>
            <Select value={filtroPlataforma} onValueChange={setFiltroPlataforma}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as plataformas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as plataformas</SelectItem>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="filtro-categoria">Categoria</Label>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as categorias</SelectItem>
                {CATEGORIAS_NICHO.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filtro-status">Status</Label>
            <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as StatusProduto | '')}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                {STATUS_PRODUTO.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
