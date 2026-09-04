-- ============================================
-- 002_rls.sql
-- Row Level Security para todas as tabelas
-- ============================================

-- Catálogo global: leitura para autenticados, escrita ninguém (só service_role)
ALTER TABLE plataformas ENABLE ROW LEVEL SECURITY;

CREATE POLICY plataformas_leitura ON plataformas
  FOR SELECT TO authenticated USING (true);

-- ============================================
-- Tabelas com usuario_id - Padrão RLS
-- ============================================

-- contas_plataforma
ALTER TABLE contas_plataforma ENABLE ROW LEVEL SECURITY;

CREATE POLICY contas_plataforma_sel ON contas_plataforma
  FOR SELECT TO authenticated USING (auth.uid() = usuario_id);

CREATE POLICY contas_plataforma_ins ON contas_plataforma
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY contas_plataforma_upd ON contas_plataforma
  FOR UPDATE TO authenticated
  USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY contas_plataforma_del ON contas_plataforma
  FOR DELETE TO authenticated USING (auth.uid() = usuario_id);

-- produtos
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY produtos_sel ON produtos
  FOR SELECT TO authenticated USING (auth.uid() = usuario_id);

CREATE POLICY produtos_ins ON produtos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY produtos_upd ON produtos
  FOR UPDATE TO authenticated
  USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY produtos_del ON produtos
  FOR DELETE TO authenticated USING (auth.uid() = usuario_id);

-- eventos - SOMENTE LEITURA para frontend, escrita por Edge Function
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY eventos_sel ON eventos
  FOR SELECT TO authenticated USING (auth.uid() = usuario_id);

-- custos
ALTER TABLE custos ENABLE ROW LEVEL SECURITY;

CREATE POLICY custos_sel ON custos
  FOR SELECT TO authenticated USING (auth.uid() = usuario_id);

CREATE POLICY custos_ins ON custos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY custos_upd ON custos
  FOR UPDATE TO authenticated
  USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY custos_del ON custos
  FOR DELETE TO authenticated USING (auth.uid() = usuario_id);

-- provedores_ia
ALTER TABLE provedores_ia ENABLE ROW LEVEL SECURITY;

CREATE POLICY provedores_ia_sel ON provedores_ia
  FOR SELECT TO authenticated USING (auth.uid() = usuario_id);

CREATE POLICY provedores_ia_ins ON provedores_ia
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY provedores_ia_upd ON provedores_ia
  FOR UPDATE TO authenticated
  USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY provedores_ia_del ON provedores_ia
  FOR DELETE TO authenticated USING (auth.uid() = usuario_id);

-- config_agente
ALTER TABLE config_agente ENABLE ROW LEVEL SECURITY;

CREATE POLICY config_agente_sel ON config_agente
  FOR SELECT TO authenticated USING (auth.uid() = usuario_id);

CREATE POLICY config_agente_ins ON config_agente
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY config_agente_upd ON config_agente
  FOR UPDATE TO authenticated
  USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

-- propostas_agente - frontend pode SELECT e UPDATE apenas do status
ALTER TABLE propostas_agente ENABLE ROW LEVEL SECURITY;

CREATE POLICY propostas_agente_sel ON propostas_agente
  FOR SELECT TO authenticated USING (auth.uid() = usuario_id);

CREATE POLICY propostas_agente_upd_status ON propostas_agente
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = usuario_id AND 
    (pg_has_role('service_role') OR (NEW.status IS NOT NULL AND OLD.status <> NEW.status))
  ) WITH CHECK (auth.uid() = usuario_id);

-- notificacoes
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY notificacoes_sel ON notificacoes
  FOR SELECT TO authenticated USING (auth.uid() = usuario_id);

CREATE POLICY notificacoes_upd_lida ON notificacoes
  FOR UPDATE TO authenticated
  USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id AND NEW.lida = true);

-- log_agente - SOMENTE LEITURA
ALTER TABLE log_agente ENABLE ROW LEVEL SECURITY;

CREATE POLICY log_agente_sel ON log_agente
  FOR SELECT TO authenticated USING (auth.uid() = usuario_id);

-- log_ia - SOMENTE LEITURA
ALTER TABLE log_ia ENABLE ROW LEVEL SECURITY;

CREATE POLICY log_ia_sel ON log_ia
  FOR SELECT TO authenticated USING (auth.uid() = usuario_id);

-- vault_salt - SOMENTE LEITURA
ALTER TABLE vault_salt ENABLE ROW LEVEL SECURITY;

CREATE POLICY vault_salt_sel ON vault_salt
  FOR SELECT TO authenticated USING (auth.uid() = usuario_id);

-- ============================================
-- VIEWS para expor dados sem segredos
-- ============================================

-- View para provedores_ia sem vault_secret_id
CREATE OR REPLACE VIEW provedores_ia_view AS
SELECT 
  id, usuario_id, nome, provedor, url_base, conta_id, modelo, ativo, 
  ordem_fallback, ultimo_teste, ultimo_teste_ok, ultimo_teste_msg, created_at
FROM provedores_ia;

GRANT SELECT ON provedores_ia_view TO authenticated;

-- View para contas_plataforma sem vault_secret_id
CREATE OR REPLACE VIEW contas_plataforma_view AS
SELECT 
  id, usuario_id, plataforma_id, id_afiliado, config, status, 
  ultima_sinc, ultimo_erro, created_at
FROM contas_plataforma;

GRANT SELECT ON contas_plataforma_view TO authenticated;
