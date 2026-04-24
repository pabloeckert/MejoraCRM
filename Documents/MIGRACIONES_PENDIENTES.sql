-- =====================================================
-- MejoraCRM — Script consolidado de migraciones pendientes
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Fecha: 2026-04-24
-- IMPORTANTE: Ejecutar todo junto, en orden
-- =====================================================

-- =====================================================
-- MIGRACIÓN 1: Índices de performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to
  ON public.clients(assigned_to);

CREATE INDEX IF NOT EXISTS idx_clients_status
  ON public.clients(status);

CREATE INDEX IF NOT EXISTS idx_clients_name
  ON public.clients(name);

CREATE INDEX IF NOT EXISTS idx_interactions_follow_up_date
  ON public.interactions(follow_up_date)
  WHERE follow_up_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_interactions_client_result
  ON public.interactions(client_id, result);

-- =====================================================
-- MIGRACIÓN 2: Funciones RPC optimizadas
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_dashboard_data()
RETURNS JSON
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'interactions', (
      SELECT COALESCE(json_agg(i.*), '[]'::json)
      FROM (
        SELECT
          i.*,
          row_to_json(c.*) AS client,
          COALESCE(
            (SELECT json_agg(json_build_object(
              'quantity', il.quantity,
              'unit_price', il.unit_price,
              'line_total', il.line_total,
              'product', row_to_json(p.*)
            ))
            FROM public.interaction_lines il
            LEFT JOIN public.products p ON p.id = il.product_id
            WHERE il.interaction_id = i.id),
            '[]'::json
          ) AS interaction_lines
        FROM public.interactions i
        LEFT JOIN public.clients c ON c.id = i.client_id
        WHERE
          i.user_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'supervisor')
        ORDER BY i.interaction_date DESC
      ) i
    ),
    'clients', (
      SELECT COALESCE(json_agg(c.*), '[]'::json)
      FROM public.clients c
      WHERE
        c.assigned_to = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'supervisor')
    ),
    'profiles', (
      SELECT COALESCE(json_agg(json_build_object(
        'user_id', p.user_id,
        'full_name', p.full_name
      )), '[]'::json)
      FROM public.profiles p
    )
  ) INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_notifications_data()
RETURNS JSON
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'interactions', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', i.id,
        'client_id', i.client_id,
        'user_id', i.user_id,
        'interaction_date', i.interaction_date,
        'result', i.result,
        'follow_up_date', i.follow_up_date,
        'next_step', i.next_step,
        'client_name', c.name
      )), '[]'::json)
      FROM public.interactions i
      LEFT JOIN public.clients c ON c.id = i.client_id
      WHERE
        i.user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'supervisor')
    ),
    'clients', (
      SELECT COALESCE(json_agg(c.*), '[]'::json)
      FROM public.clients c
      WHERE
        c.assigned_to = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'supervisor')
    ),
    'profiles', (
      SELECT COALESCE(json_agg(json_build_object(
        'user_id', p.user_id,
        'full_name', p.full_name
      )), '[]'::json)
      FROM public.profiles p
    )
  ) INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_seller_ranking(period_start TIMESTAMPTZ)
RETURNS JSON
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(r.*), '[]'::json)
    FROM (
      SELECT
        p.user_id,
        p.full_name,
        COUNT(*) FILTER (WHERE i.result = 'venta') AS ventas,
        COUNT(*) FILTER (WHERE i.result = 'presupuesto') AS presupuestos,
        COUNT(*) FILTER (WHERE i.result = 'seguimiento') AS seguimientos,
        COALESCE(SUM(i.total_amount) FILTER (WHERE i.result = 'venta'), 0) AS ingresos
      FROM public.profiles p
      LEFT JOIN public.interactions i ON i.user_id = p.user_id
        AND i.interaction_date >= period_start
      GROUP BY p.user_id, p.full_name
      HAVING COUNT(i.id) > 0
      ORDER BY COALESCE(SUM(i.total_amount) FILTER (WHERE i.result = 'venta'), 0) DESC
    ) r
  );
END;
$$;

-- =====================================================
-- MIGRACIÓN 3: Endurecimiento de políticas RLS
-- =====================================================

-- CLIENTS: Endurecer INSERT
DROP POLICY IF EXISTS "clients_insert" ON public.clients;
CREATE POLICY "clients_insert" ON public.clients
FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'supervisor')
  OR (auth.uid() IS NOT NULL AND assigned_to = auth.uid())
);

-- PRODUCTS: Separar INSERT de UPDATE/DELETE
DROP POLICY IF EXISTS "products_manage" ON public.products;

CREATE POLICY "products_insert" ON public.products
FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'supervisor')
);

CREATE POLICY "products_update" ON public.products
FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'supervisor')
);

CREATE POLICY "products_delete" ON public.products
FOR DELETE USING (
  public.has_role(auth.uid(), 'admin')
);

-- INTERACTIONS: DELETE para vendedores (propias)
DROP POLICY IF EXISTS "interactions_delete" ON public.interactions;
CREATE POLICY "interactions_delete" ON public.interactions
FOR DELETE USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

-- CLIENTS: DELETE para supervisor
DROP POLICY IF EXISTS "clients_delete" ON public.clients;
CREATE POLICY "clients_delete" ON public.clients
FOR DELETE USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'supervisor')
);

-- PROFILES: DELETE solo admin
CREATE POLICY "profiles_delete" ON public.profiles
FOR DELETE USING (
  public.has_role(auth.uid(), 'admin')
);

-- =====================================================
-- MIGRACIÓN 4: Vistas materializadas + refresh function
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_seller_ranking AS
SELECT
  p.user_id,
  p.full_name,
  date_trunc('month', now()) AS period_start,
  COUNT(*) FILTER (WHERE i.result = 'venta') AS ventas_count,
  COUNT(*) FILTER (WHERE i.result = 'presupuesto') AS presupuestos_count,
  COUNT(*) FILTER (WHERE i.result = 'seguimiento') AS seguimientos_count,
  COUNT(*) FILTER (WHERE i.result = 'no_interesado') AS rechazos_count,
  COUNT(*) AS total_interactions,
  COALESCE(SUM(i.total_amount) FILTER (WHERE i.result = 'venta'), 0) AS ingresos,
  COALESCE(SUM(i.total_amount) FILTER (WHERE i.result = 'presupuesto'), 0) AS pipeline
FROM public.profiles p
LEFT JOIN public.interactions i ON i.user_id = p.user_id
  AND i.interaction_date >= date_trunc('month', now())
GROUP BY p.user_id, p.full_name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_seller_ranking_user
  ON public.mv_seller_ranking(user_id);

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_client_summary AS
SELECT
  c.id AS client_id,
  c.name,
  c.company,
  c.segment,
  c.province,
  c.status,
  c.assigned_to,
  c.created_at AS client_created_at,
  last_int.last_interaction_date,
  last_int.last_result,
  last_int.last_medium,
  COALESCE(int_count.total, 0) AS total_interactions,
  COALESCE(int_count.ventas, 0) AS total_ventas,
  COALESCE(int_count.presupuestos, 0) AS total_presupuestos,
  CASE
    WHEN last_int.last_interaction_date IS NULL THEN NULL
    ELSE EXTRACT(DAY FROM now() - last_int.last_interaction_date)::INT
  END AS days_since_last_interaction
FROM public.clients c
LEFT JOIN LATERAL (
  SELECT
    i.interaction_date AS last_interaction_date,
    i.result AS last_result,
    i.medium AS last_medium
  FROM public.interactions i
  WHERE i.client_id = c.id
  ORDER BY i.interaction_date DESC
  LIMIT 1
) last_int ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE result = 'venta') AS ventas,
    COUNT(*) FILTER (WHERE result = 'presupuesto') AS presupuestos
  FROM public.interactions i
  WHERE i.client_id = c.id
) int_count ON true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_client_summary_id
  ON public.mv_client_summary(client_id);

CREATE INDEX IF NOT EXISTS idx_mv_client_summary_assigned
  ON public.mv_client_summary(assigned_to);

CREATE INDEX IF NOT EXISTS idx_mv_client_summary_status
  ON public.mv_client_summary(status);

-- Función de refresco
CREATE OR REPLACE FUNCTION public.refresh_materialized_views()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_seller_ranking;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_client_summary;
END;
$$;

-- Permisos
GRANT SELECT ON public.mv_seller_ranking TO authenticated;
GRANT SELECT ON public.mv_client_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_materialized_views() TO authenticated;

-- =====================================================
-- FIN — Verificar que no haya errores arriba
-- =====================================================
-- Migración: Mecanismo de eliminación de cuenta y datos
-- Fecha: 2026-04-25
-- Descripción: Función RPC para que un usuario solicite la eliminación de sus datos.
--              Anonimiza datos personales y elimina datos de clientes asociados.

-- 1. Función para solicitar eliminación de cuenta
CREATE OR REPLACE FUNCTION request_account_deletion()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _clients_count INT;
  _interactions_count INT;
BEGIN
  -- Verificar que hay un usuario autenticado
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No autenticado'
    );
  END IF;

  -- Contar datos que se eliminarán
  SELECT COUNT(*) INTO _clients_count FROM clients WHERE assigned_to = _user_id;
  SELECT COUNT(*) INTO _interactions_count FROM interactions WHERE user_id = _user_id;

  -- 1. Anonimizar perfil (no eliminar para mantener integridad referencial)
  UPDATE profiles
  SET
    full_name = 'Usuario eliminado',
    avatar_url = NULL,
    updated_at = now()
  WHERE user_id = _user_id;

  -- 2. Eliminar interacciones del usuario
  -- (las interaction_lines se eliminan en CASCADE)
  DELETE FROM interactions WHERE user_id = _user_id;

  -- 3. Eliminar clientes asignados al usuario
  -- (las interacciones de esos clientes ya se eliminaron arriba)
  DELETE FROM clients WHERE assigned_to = _user_id;

  -- 4. Eliminar roles del usuario
  DELETE FROM user_roles WHERE user_id = _user_id;

  -- 5. Registrar en audit_log
  INSERT INTO audit_log (table_name, record_id, action, old_data, changed_by)
  VALUES (
    'account_deletion',
    _user_id,
    'DELETE',
    jsonb_build_object(
      'clients_deleted', _clients_count,
      'interactions_deleted', _interactions_count
    ),
    _user_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'clients_deleted', _clients_count,
    'interactions_deleted', _interactions_count,
    'message', 'Datos eliminados correctamente. El perfil fue anonimizado.'
  );
END;
$$;

-- 2. Permisos
GRANT EXECUTE ON FUNCTION request_account_deletion() TO authenticated;

-- 3. Comentario
COMMENT ON FUNCTION request_account_deletion() IS 'Elimina todos los datos del usuario autenticado y anonimiza su perfil. Irreversible.';
