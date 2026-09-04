-- ============================================
-- 004_cron.sql
-- Agendamento de tarefas com pg_cron
-- ============================================

-- Habilitar a extensão pg_cron se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar varredura horária do agente
-- Roda de hora em hora; a própria Edge Function decide quem está no horário
-- e quem já venceu o intervalo de rodar_a_cada_horas.
SELECT cron.schedule(
  'agente-varredura-horaria',
  '0 * * * *',  -- A cada hora, no minuto 0
  $$ 
  SELECT net.http_post(
    url     := current_setting('app.edge_url') || '/agente-varredura',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.cron_token'),
      'Content-Type', 'application/json'
    )
  ) $$
);

-- Agendar sincronização diária das plataformas (uma vez por dia)
SELECT cron.schedule(
  'plataforma-sincronizacao-diaria',
  '0 3 * * *',  -- Às 3h da manhã
  $$ 
  SELECT net.http_post(
    url     := current_setting('app.edge_url') || '/plataforma/sincronizar-todas',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.cron_token'),
      'Content-Type', 'application/json'
    )
  ) $$
);

-- Agendar limpeza de notificações antigas (uma vez por semana)
SELECT cron.schedule(
  'limpeza-notificacoes',
  '0 4 * * 0',  -- Todo domingo às 4h
  $$ 
  DELETE FROM notificacoes 
  WHERE created_at < now() - interval '30 days' 
  AND lida = true
  $$
);

-- Agendar limpeza de logs antigos (uma vez por mês)
SELECT cron.schedule(
  'limpeza-logs',
  '0 5 1 * *',  -- Todo dia 1 do mês às 5h
  $$ 
  DELETE FROM log_ia 
  WHERE created_at < now() - interval '90 days';
  
  DELETE FROM log_agente 
  WHERE created_at < now() - interval '90 days'
  $$
);
