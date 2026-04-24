-- =====================================================
-- MejoraCRM — Setup completo desde cero
-- Proyecto Supabase nuevo: fkjuswkjzaeuogctsxpw
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Fecha: 2026-04-24
-- =====================================================

-- =====================================================
-- 1. EXTENSIONES
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;
-- (si pg_cron no está disponible, se puede activar después)

-- =====================================================
-- 1.5 LIMPIEZA (por si se re-ejecuta)
-- =====================================================
DROP MATERIALIZED VIEW IF EXISTS public.mv_seller_ranking CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.mv_client_summary CASCADE;
DROP TABLE IF EXISTS public.interaction_lines CASCADE;
DROP TABLE IF EXISTS public.interactions CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.refresh_materialized_views CASCADE;
DROP FUNCTION IF EXISTS public.get_dashboard_data CASCADE;
DROP FUNCTION IF EXISTS public.get_notifications_data CASCADE;
DROP FUNCTION IF EXISTS public.get_seller_ranking CASCADE;
DROP FUNCTION IF EXISTS public.calculate_client_status CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.has_role CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;
DROP TYPE IF EXISTS public.negotiation_state CASCADE;
DROP TYPE IF EXISTS public.followup_scenario CASCADE;
DROP TYPE IF EXISTS public.quote_path CASCADE;
DROP TYPE IF EXISTS public.currency_code CASCADE;
DROP TYPE IF EXISTS public.interaction_medium CASCADE;
DROP TYPE IF EXISTS public.interaction_result CASCADE;
DROP TYPE IF EXISTS public.client_status CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('admin', 'supervisor', 'vendedor');
CREATE TYPE public.client_status AS ENUM ('activo', 'potencial', 'inactivo');
CREATE TYPE public.interaction_result AS ENUM ('presupuesto', 'venta', 'seguimiento', 'sin_respuesta', 'no_interesado');
CREATE TYPE public.interaction_medium AS ENUM ('whatsapp', 'llamada', 'email', 'reunion_presencial', 'reunion_virtual', 'md_instagram', 'md_facebook', 'md_linkedin', 'visita_campo');
CREATE TYPE public.currency_code AS ENUM ('ARS', 'USD', 'EUR');
CREATE TYPE public.quote_path AS ENUM ('catalogo', 'adjunto');
CREATE TYPE public.followup_scenario AS ENUM ('vinculado', 'independiente', 'historico');
CREATE TYPE public.negotiation_state AS ENUM ('con_interes', 'sin_respuesta', 'revisando', 'pidio_cambios');

-- =====================================================
-- 3. FUNCIONES BASE (sin dependencias en tablas)
-- =====================================================

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =====================================================
-- 4. TABLAS
-- =====================================================

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'vendedor',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC(12,2),
  unit TEXT NOT NULL DEFAULT 'u',
  unit_label TEXT NOT NULL DEFAULT 'Unidad',
  currency public.currency_code NOT NULL DEFAULT 'ARS',
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  contact_name TEXT,
  segment TEXT,
  location TEXT,
  province TEXT,
  address TEXT,
  whatsapp TEXT,
  email TEXT,
  channel TEXT,
  first_contact_date DATE DEFAULT CURRENT_DATE,
  status public.client_status NOT NULL DEFAULT 'potencial',
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Interactions
CREATE TABLE public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  interaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  result public.interaction_result NOT NULL,
  medium public.interaction_medium NOT NULL,
  quote_path public.quote_path,
  total_amount NUMERIC(14,2),
  currency public.currency_code,
  attachment_url TEXT,
  reference_quote_id UUID REFERENCES public.interactions(id) ON DELETE SET NULL,
  followup_scenario public.followup_scenario,
  negotiation_state public.negotiation_state,
  followup_motive TEXT,
  historic_quote_amount NUMERIC(14,2),
  historic_quote_date DATE,
  loss_reason TEXT,
  estimated_loss NUMERIC(14,2),
  next_step TEXT,
  follow_up_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- Interaction lines
CREATE TABLE public.interaction_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id UUID NOT NULL REFERENCES public.interactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity NUMERIC(14,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.interaction_lines ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. FUNCIONES QUE DEPENDEN DE TABLAS
-- =====================================================

-- Verificación de rol
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Obtención de rol
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Auto-crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'vendedor'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Calcular estado del cliente
CREATE OR REPLACE FUNCTION public.calculate_client_status(_client_id UUID)
RETURNS public.client_status
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  has_recent_positive BOOLEAN;
  has_any_recent BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.interactions
    WHERE client_id = _client_id
      AND result IN ('presupuesto', 'venta')
      AND interaction_date >= now() - INTERVAL '90 days'
  ) INTO has_recent_positive;

  IF has_recent_positive THEN
    RETURN 'activo';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.interactions
    WHERE client_id = _client_id
      AND interaction_date >= now() - INTERVAL '90 days'
  ) INTO has_any_recent;

  IF has_any_recent THEN
    RETURN 'potencial';
  END IF;

  RETURN 'inactivo';
END;
$$;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE ON public.interactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 6. POLÍTICAS RLS (ya endurecidas)
-- =====================================================

-- Profiles
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- User roles
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "user_roles_insert" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_update" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_delete" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Products
CREATE POLICY "products_select" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_insert" ON public.products FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));
CREATE POLICY "products_update" ON public.products FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));
CREATE POLICY "products_delete" ON public.products FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Clients
CREATE POLICY "clients_select" ON public.clients FOR SELECT USING (
  assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
);
CREATE POLICY "clients_insert" ON public.clients FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'supervisor')
  OR (auth.uid() IS NOT NULL AND assigned_to = auth.uid())
);
CREATE POLICY "clients_update" ON public.clients FOR UPDATE USING (
  assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
);
CREATE POLICY "clients_delete" ON public.clients FOR DELETE USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
);

-- Interactions
CREATE POLICY "interactions_select" ON public.interactions FOR SELECT USING (
  user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
);
CREATE POLICY "interactions_insert" ON public.interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "interactions_update" ON public.interactions FOR UPDATE USING (
  user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
);
CREATE POLICY "interactions_delete" ON public.interactions FOR DELETE USING (
  user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
);

-- Interaction lines
CREATE POLICY "interaction_lines_select" ON public.interaction_lines FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.interactions i WHERE i.id = interaction_lines.interaction_id
    AND (i.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')))
);
CREATE POLICY "interaction_lines_insert" ON public.interaction_lines FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.interactions i WHERE i.id = interaction_lines.interaction_id AND i.user_id = auth.uid())
);
CREATE POLICY "interaction_lines_update" ON public.interaction_lines FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.interactions i WHERE i.id = interaction_lines.interaction_id
    AND (i.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "interaction_lines_delete" ON public.interaction_lines FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.interactions i WHERE i.id = interaction_lines.interaction_id
    AND (i.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);

-- =====================================================
-- 7. ÍNDICES DE PERFORMANCE
-- =====================================================
CREATE INDEX idx_clients_assigned_to ON public.clients(assigned_to);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_name ON public.clients(name);
CREATE INDEX idx_interactions_follow_up_date ON public.interactions(follow_up_date) WHERE follow_up_date IS NOT NULL;
CREATE INDEX idx_interactions_client_result ON public.interactions(client_id, result);
CREATE INDEX idx_interactions_client ON public.interactions(client_id);
CREATE INDEX idx_interactions_user ON public.interactions(user_id);
CREATE INDEX idx_interactions_date ON public.interactions(interaction_date DESC);
CREATE INDEX idx_interactions_result ON public.interactions(result);
CREATE INDEX idx_interaction_lines_interaction ON public.interaction_lines(interaction_id);
CREATE INDEX idx_interaction_lines_product ON public.interaction_lines(product_id);

-- =====================================================
-- 8. FUNCIONES RPC OPTIMIZADAS
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_dashboard_data()
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'interactions', (
      SELECT COALESCE(json_agg(i.*), '[]'::json)
      FROM (
        SELECT i.*, row_to_json(c.*) AS client,
          COALESCE((SELECT json_agg(json_build_object(
            'quantity', il.quantity, 'unit_price', il.unit_price,
            'line_total', il.line_total, 'product', row_to_json(p.*)
          )) FROM public.interaction_lines il LEFT JOIN public.products p ON p.id = il.product_id
          WHERE il.interaction_id = i.id), '[]'::json) AS interaction_lines
        FROM public.interactions i LEFT JOIN public.clients c ON c.id = i.client_id
        WHERE i.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
        ORDER BY i.interaction_date DESC
      ) i
    ),
    'clients', (
      SELECT COALESCE(json_agg(c.*), '[]'::json) FROM public.clients c
      WHERE c.assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
    ),
    'profiles', (
      SELECT COALESCE(json_agg(json_build_object('user_id', p.user_id, 'full_name', p.full_name)), '[]'::json)
      FROM public.profiles p
    )
  ) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_notifications_data()
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'interactions', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', i.id, 'client_id', i.client_id, 'user_id', i.user_id,
        'interaction_date', i.interaction_date, 'result', i.result,
        'follow_up_date', i.follow_up_date, 'next_step', i.next_step, 'client_name', c.name
      )), '[]'::json)
      FROM public.interactions i LEFT JOIN public.clients c ON c.id = i.client_id
      WHERE i.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
    ),
    'clients', (
      SELECT COALESCE(json_agg(c.*), '[]'::json) FROM public.clients c
      WHERE c.assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
    ),
    'profiles', (
      SELECT COALESCE(json_agg(json_build_object('user_id', p.user_id, 'full_name', p.full_name)), '[]'::json)
      FROM public.profiles p
    )
  ) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_seller_ranking(period_start TIMESTAMPTZ)
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(r.*), '[]'::json)
    FROM (
      SELECT p.user_id, p.full_name,
        COUNT(*) FILTER (WHERE i.result = 'venta') AS ventas,
        COUNT(*) FILTER (WHERE i.result = 'presupuesto') AS presupuestos,
        COUNT(*) FILTER (WHERE i.result = 'seguimiento') AS seguimientos,
        COALESCE(SUM(i.total_amount) FILTER (WHERE i.result = 'venta'), 0) AS ingresos
      FROM public.profiles p
      LEFT JOIN public.interactions i ON i.user_id = p.user_id AND i.interaction_date >= period_start
      GROUP BY p.user_id, p.full_name
      HAVING COUNT(i.id) > 0
      ORDER BY COALESCE(SUM(i.total_amount) FILTER (WHERE i.result = 'venta'), 0) DESC
    ) r
  );
END;
$$;

-- =====================================================
-- 9. VISTAS MATERIALIZADAS
-- =====================================================

CREATE MATERIALIZED VIEW public.mv_seller_ranking AS
SELECT p.user_id, p.full_name, date_trunc('month', now()) AS period_start,
  COUNT(*) FILTER (WHERE i.result = 'venta') AS ventas_count,
  COUNT(*) FILTER (WHERE i.result = 'presupuesto') AS presupuestos_count,
  COUNT(*) FILTER (WHERE i.result = 'seguimiento') AS seguimientos_count,
  COUNT(*) FILTER (WHERE i.result = 'no_interesado') AS rechazos_count,
  COUNT(*) AS total_interactions,
  COALESCE(SUM(i.total_amount) FILTER (WHERE i.result = 'venta'), 0) AS ingresos,
  COALESCE(SUM(i.total_amount) FILTER (WHERE i.result = 'presupuesto'), 0) AS pipeline
FROM public.profiles p
LEFT JOIN public.interactions i ON i.user_id = p.user_id AND i.interaction_date >= date_trunc('month', now())
GROUP BY p.user_id, p.full_name;

CREATE UNIQUE INDEX idx_mv_seller_ranking_user ON public.mv_seller_ranking(user_id);

CREATE MATERIALIZED VIEW public.mv_client_summary AS
SELECT c.id AS client_id, c.name, c.company, c.segment, c.province, c.status, c.assigned_to,
  c.created_at AS client_created_at,
  last_int.last_interaction_date, last_int.last_result, last_int.last_medium,
  COALESCE(int_count.total, 0) AS total_interactions,
  COALESCE(int_count.ventas, 0) AS total_ventas,
  COALESCE(int_count.presupuestos, 0) AS total_presupuestos,
  CASE WHEN last_int.last_interaction_date IS NULL THEN NULL
    ELSE EXTRACT(DAY FROM now() - last_int.last_interaction_date)::INT
  END AS days_since_last_interaction
FROM public.clients c
LEFT JOIN LATERAL (
  SELECT i.interaction_date AS last_interaction_date, i.result AS last_result, i.medium AS last_medium
  FROM public.interactions i WHERE i.client_id = c.id ORDER BY i.interaction_date DESC LIMIT 1
) last_int ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE result = 'venta') AS ventas,
    COUNT(*) FILTER (WHERE result = 'presupuesto') AS presupuestos
  FROM public.interactions i WHERE i.client_id = c.id
) int_count ON true;

CREATE UNIQUE INDEX idx_mv_client_summary_id ON public.mv_client_summary(client_id);
CREATE INDEX idx_mv_client_summary_assigned ON public.mv_client_summary(assigned_to);
CREATE INDEX idx_mv_client_summary_status ON public.mv_client_summary(status);

CREATE OR REPLACE FUNCTION public.refresh_materialized_views()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_seller_ranking;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_client_summary;
END;
$$;

GRANT SELECT ON public.mv_seller_ranking TO authenticated;
GRANT SELECT ON public.mv_client_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_materialized_views() TO authenticated;

-- =====================================================
-- 10. CRON — Refresco automático cada 30 min
-- =====================================================
SELECT cron.schedule('refresh-materialized-views', '*/30 * * * *', 'SELECT public.refresh_materialized_views()');

-- =====================================================
-- 11. DATOS SEMILLA
-- =====================================================
INSERT INTO public.products (name, category, price) VALUES
  ('Plantines de Eucalipto', 'Forestal', 150.00),
  ('Plantines de Pino', 'Forestal', 120.00),
  ('Servicio de Poda', 'Servicios', 5000.00),
  ('Servicio de Raleo', 'Servicios', 8000.00),
  ('Madera Aserrada', 'Productos', 25000.00),
  ('Chips de Madera', 'Productos', 15000.00),
  ('Consultoría Forestal', 'Servicios', 10000.00),
  ('Fertilizantes', 'Insumos', 3500.00),
  ('Herbicidas', 'Insumos', 4200.00),
  ('Maquinaria (alquiler)', 'Servicios', 20000.00);

-- =====================================================
-- FIN — Setup completo ✅
-- =====================================================
