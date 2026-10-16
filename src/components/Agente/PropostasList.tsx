import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import type { PropostaAgente } from '@/types';

interface PropostasListProps {
  propostas: PropostaAgente[];
  onAprovar: (id: string) => void;
  onRejeitar: (id: string) => void;
}

export function PropostasList({ propostas, onAprovar, onRejeitar }: PropostasListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Propostas Recentes</CardTitle>
        <CardDescription>{propostas.length} propostas encontradas</CardDescription>
      </CardHeader>
      <CardContent>
        {propostas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhuma proposta encontrada</p>
            <p className="text-sm mt-2">O agente ainda não analisou nenhum produto</p>
          </div>
        ) : (
          <div className="space-y-4">
            {propostas.map((proposta) => {
              const produtoNome = (proposta.dados_produto as { nome?: string } | undefined)?.nome || 'Produto sem nome';
              return (
                <div key={proposta.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{produtoNome}</h4>
                        <Badge
                          variant={
                            proposta.status === 'aprovado'
                              ? 'default'
                              : proposta.status === 'rejeitado'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {proposta.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>
                            <TrendingUp className="w-4 h-4 inline mr-1" />
                            Pontuação: {proposta.pontuacao}/100
                          </span>
                          <span>
                            <Brain className="w-4 h-4 inline mr-1" />
                            Confiança: {proposta.confianca}
                          </span>
                          <span>
                            <Clock className="w-4 h-4 inline mr-1" />
                            {new Date(proposta.data).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {proposta.status === 'pendente' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRejeitar(proposta.id)}
                          leftIcon={<XCircle className="w-4 h-4" />}
                        >
                          Rejeitar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onAprovar(proposta.id)}
                          leftIcon={<CheckCircle className="w-4 h-4" />}
                        >
                          Aprovar
                        </Button>
                      </div>
                    )}
                  </div>

                  {proposta.status === 'pendente' && (
                    <div className="mt-4 pt-4 border-t">
                      <h5 className="font-medium mb-2">Resumo da Análise</h5>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {proposta.relatorio || 'Relatório não disponível'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
