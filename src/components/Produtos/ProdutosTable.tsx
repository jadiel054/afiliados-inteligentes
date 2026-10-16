import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Copy, Trash2 } from 'lucide-react';
import { formatarMoeda, formatarPorcentagem } from '@/lib/constantes';
import type { Produto } from '@/types';

interface ProdutoMetrica {
  cliques: number;
  vendas: number;
  valorBruto: number;
  comissaoTotal: number;
  taxaConversao: number;
  classificacao: string | null;
}

interface ProdutosTableProps {
  produtos: Produto[];
  produtosTotalCount: number;
  getProdutoMetricas: (id: string) => ProdutoMetrica;
  onEdit: (p: Produto) => void;
  onCopyLink: (p: Produto) => void;
  onDelete: (p: Produto) => void;
}

export function ProdutosTable({
  produtos,
  produtosTotalCount,
  getProdutoMetricas,
  onEdit,
  onCopyLink,
  onDelete,
}: ProdutosTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Produtos</CardTitle>
        <CardDescription>{produtos.length} produtos encontrados</CardDescription>
      </CardHeader>
      <CardContent>
        {produtos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum produto encontrado</p>
            {produtosTotalCount === 0 && (
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
                {produtos.map((produto) => {
                  const metricas = getProdutoMetricas(produto.id);
                  return (
                    <TableRow key={produto.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium max-w-[200px] truncate">{produto.nome}</TableCell>
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
                        {metricas.classificacao && (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              metricas.classificacao === 'campeao'
                                ? 'bg-green-500/10 text-green-600'
                                : metricas.classificacao === 'promissor'
                                ? 'bg-blue-500/10 text-blue-600'
                                : metricas.classificacao === 'estavel'
                                ? 'bg-yellow-500/10 text-yellow-600'
                                : 'bg-red-500/10 text-red-600'
                            }`}
                          >
                            {metricas.classificacao}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            produto.status === 'ativo'
                              ? 'bg-green-500/10 text-green-600'
                              : produto.status === 'pausado'
                              ? 'bg-yellow-500/10 text-yellow-600'
                              : 'bg-red-500/10 text-red-600'
                          }`}
                        >
                          {produto.status}
                        </span>
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(produto)} title="Editar">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onCopyLink(produto)} title="Copiar Link Curto">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(produto)}
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
  );
}
