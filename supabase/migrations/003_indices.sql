-- ============================================
-- 003_indices.sql
-- Índices para otimização de consultas
-- ============================================

CREATE INDEX IF NOT EXISTS idx_eventos_usuario_data 
  ON eventos (usuario_id, ocorrido_em DESC);

CREATE INDEX IF NOT EXISTS idx_eventos_produto_tipo 
  ON eventos (produto_id, tipo, ocorrido_em DESC);

CREATE INDEX IF NOT EXISTS idx_eventos_usuario_tipo_data 
  ON eventos (usuario_id, tipo, ocorrido_em DESC);

CREATE INDEX IF NOT EXISTS idx_produtos_usuario 
  ON produtos (usuario_id, status);

CREATE INDEX IF NOT EXISTS idx_produtos_codigo 
  ON produtos (link_curto_codigo);

CREATE INDEX IF NOT EXISTS idx_produtos_usuario_status 
  ON produtos (usuario_id, status);

CREATE INDEX IF NOT EXISTS idx_produtos_plataforma 
  ON produtos (plataforma_id);

CREATE INDEX IF NOT EXISTS idx_produtos_categoria 
  ON produtos (categoria);

CREATE INDEX IF NOT EXISTS idx_propostas_usuario_st 
  ON propostas_agente (usuario_id, status, data DESC);

CREATE INDEX IF NOT EXISTS idx_notificacoes_nao_lidas 
  ON notificacoes (usuario_id, lida, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_custos_usuario_data 
  ON custos (usuario_id, data DESC);

CREATE INDEX IF NOT EXISTS idx_log_agente_usuario 
  ON log_agente (usuario_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_log_ia_usuario 
  ON log_ia (usuario_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contas_plataforma_usuario 
  ON contas_plataforma (usuario_id, plataforma_id);

CREATE INDEX IF NOT EXISTS idx_provedores_ia_usuario 
  ON provedores_ia (usuario_id, ativo, ordem_fallback);

CREATE INDEX IF NOT EXISTS idx_config_agente_usuario 
  ON config_agente (usuario_id);

CREATE INDEX IF NOT EXISTS idx_vault_salt_usuario 
  ON vault_salt (usuario_id);
