-- =====================================================
-- MejoraCRM — Cron job para refresco de vistas materializadas
-- Ejecutar DESPUÉS de MIGRACIONES_PENDIENTES.sql
-- Requiere extensión pg_cron (activar en Supabase Dashboard)
-- =====================================================

-- 1. Activar extensión pg_cron (si no está activa)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Programar refresco cada 30 minutos
SELECT cron.schedule(
  'refresh-materialized-views',     -- nombre del job
  '*/30 * * * *',                    -- cada 30 minutos
  'SELECT public.refresh_materialized_views()'
);

-- Verificar que se creó:
-- SELECT * FROM cron.job;
