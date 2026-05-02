-- ============================================================
-- MejoraCRM — Datos de demostración
-- ============================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Este script inserta datos de prueba para demostrar el CRM.
-- Los UUIDs son fijos para poder referenciar entre tablas.
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. PERFILES (3 usuarios)
-- ─────────────────────────────────────────────
-- Nota: Los auth.users deben crearse desde Supabase Auth primero.
-- Este script asume que los usuarios ya existen en auth.users
-- con los UUIDs definidos abajo.
--
-- Creá estos usuarios desde el Dashboard → Authentication → Users:
--
--   sindygeisert@gmail.com   → UUID: a0000000-0000-0000-0000-000000000001 (admin/dueña)
--   pabloeckert@gmail.com    → UUID: a0000000-0000-0000-0000-000000000002 (admin/dueño)
--   mejoraok@gmail.com       → UUID: a0000000-0000-0000-0000-000000000003 (vendedor)
--
-- Password para todos: T@beg2301
--
-- IMPORTANTE: Los UUIDs de auth.users los genera Supabase automáticamente.
-- Después de crear los usuarios, copiá sus UUIDs reales y reemplazá los
-- valores de abajo (a0000000-...) antes de ejecutar este script.

-- Perfiles
INSERT INTO profiles (id, user_id, full_name, avatar_url) VALUES
  ('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Sindy Geisert', NULL),
  ('p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Pablo Eckert', NULL),
  ('p0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Mejora OK', NULL)
ON CONFLICT (id) DO NOTHING;

-- Roles (admin = dueño, vendedor = vendedor)
INSERT INTO user_roles (id, user_id, role) VALUES
  ('r0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'admin'),
  ('r0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'admin'),
  ('r0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'vendedor')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- 2. PRODUCTOS (5 productos del rubro forestal)
-- ─────────────────────────────────────────────
INSERT INTO products (id, name, description, category, unit, unit_label, currency, price, active) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Pino Elliotis - Semilla',        'Semilla certificada de pino elliotis para vivero',               'Semillas',    'kg',   'Kilogramo',    'ARS', 8500,    true),
  ('d0000000-0000-0000-0000-000000000002', 'Eucalipto Grandis - Semilla',    'Semilla certificada de eucalipto grandis',                       'Semillas',    'kg',   'Kilogramo',    'ARS', 12000,   true),
  ('d0000000-0000-0000-0000-000000000003', 'Plancha Pino Paraná 25mm',       'Plancha aserrada de pino paraná, 25mm de espesor',               'Madera',      'm3',   'Metro cúbico', 'ARS', 180000,  true),
  ('d0000000-0000-0000-0000-000000000004', 'Plancha Eucalipto 30mm',         'Plancha aserrada de eucalipto, 30mm de espesor',                 'Madera',      'm3',   'Metro cúbico', 'ARS', 220000,  true),
  ('d0000000-0000-0000-0000-000000000005', 'Servicio de Manejo Forestal',    'Asesoramiento técnico forestal por hectárea por año',            'Servicios',   'ha',   'Hectárea',     'USD', 150,     true)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- 3. CLIENTES (8 clientes)
-- ─────────────────────────────────────────────
INSERT INTO clients (id, name, company, contact_name, whatsapp, email, segment, channel, province, country, location, address, status, assigned_to, notes) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Roberto Maidana',      'Forestal Misiones S.A.',   'Roberto Maidana',      '+54 376 4123456', 'roberto@forestalmisiones.com',  'Forestal',     'Referido',       'Misiones', 'Argentina', 'Eldorado',      'Ruta 12 km 8',              'activo',    'a0000000-0000-0000-0000-000000000003', 'Cliente principal. Compra semillas y madera.'),
  ('c0000000-0000-0000-0000-000000000002', 'Ana Sosa',             'Estancia El Retiro',       'Ana Sosa',             '+54 375 5234567', 'ana@estanciaretiro.com.ar',     'Agropecuario', 'WhatsApp',       'Misiones', 'Argentina', 'Oberá',         'Camino Rural s/n',          'activo',    'a0000000-0000-0000-0000-000000000003', 'Interesada en reforestación.'),
  ('c0000000-0000-0000-0000-000000000003', 'Luis Benítez',         'Maderas del Norte',        'Luis Benítez',         '+54 376 4345678', 'luis@maderasnorte.com',         'Industrial',   'Feria/Evento',   'Misiones', 'Argentina', 'Posadas',       'Av. Corrientes 1234',       'activo',    'a0000000-0000-0000-0000-000000000003', 'Compra madera aserrada en volumen.'),
  ('c0000000-0000-0000-0000-000000000004', 'Gabriela Romero',      'Constructora Andes',       'Gabriela Romero',      '+54 376 4456789', 'gaby@constructoraandes.com',    'Construcción', 'Email',          'Misiones', 'Argentina', 'San Martín',    'Belgrano 567',              'potencial',  'a0000000-0000-0000-0000-000000000003', 'Busca madera para estructuras.'),
  ('c0000000-0000-0000-0000-000000000005', 'Martín Acuña',         'Gobierno de Misiones',     'Martín Acuña',         '+54 376 4567890', 'macuña@misiones.gob.ar',        'Gobierno',     'Reunión presencial', 'Misiones', 'Argentina', 'Posadas',       'Córdoba 1200',              'activo',    'a0000000-0000-0000-0000-000000000003', 'Licitación de plantines para programa provincial.'),
  ('c0000000-0000-0000-0000-000000000006', 'Silvia Ferreyra',      'Vivero Los Pinos',         'Silvia Ferreyra',      '+54 375 4678901', 'silvia@viverolospinos.com',     'Forestal',     'Redes sociales', 'Misiones', 'Argentina', 'Puerto Iguazú', 'Av. Victoria Aguirre 890',  'activo',    'a0000000-0000-0000-0000-000000000003', 'Viverista. Compra semillas regularmente.'),
  ('c0000000-0000-0000-0000-000000000007', 'Diego Morel',          'Agro Semillas S.R.L.',     'Diego Morel',          '+54 375 4789012', 'diego@agrosemillas.com',        'Agropecuario', 'Referido',       'Misiones', 'Argentina', 'Apóstoles',     'San Martín 345',            'potencial',  'a0000000-0000-0000-0000-000000000003', 'Nuevo contacto. Interesado en eucalipto.'),
  ('c0000000-0000-0000-0000-000000000008', 'Laura Cáceres',        'Casa del Parquet',         'Laura Cáceres',        '+54 376 4890123', 'laura@casadelparquet.com',      'Comercio',     'Sitio web',      'Misiones', 'Argentina', 'Candelaria',    'Ruta 12 km 5',              'inactivo',  'a0000000-0000-0000-0000-000000000003', 'Dejó de responder hace 2 meses.')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- 4. INTERACCIONES (16 interacciones)
-- ─────────────────────────────────────────────

-- VENTAS CERRADAS (6)
INSERT INTO interactions (id, client_id, user_id, medium, result, total_amount, currency, loss_reason, estimated_loss, next_step, follow_up_date, notes, interaction_date) VALUES
  ('i0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'whatsapp',       'venta', 425000,  'ARS', NULL, NULL, 'Coordinar entrega',      '2026-05-10', 'Venta de 50kg semilla pino elliotis',           '2026-04-20'),
  ('i0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 'whatsapp',       'venta', 255000,  'ARS', NULL, NULL, 'Confirmar recepción',    '2026-05-05', '30kg semilla pino para vivero',                  '2026-04-22'),
  ('i0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'reunion_presencial', 'venta', 540000,  'ARS', NULL, NULL, 'Enviar factura',         '2026-05-08', '3m3 pino paraná para taller',                    '2026-04-18'),
  ('i0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'reunion_presencial', 'venta', 7500,    'USD', NULL, NULL, 'Iniciar proyecto',       '2026-05-15', 'Servicio manejo forestal 50ha programa provincial','2026-04-10'),
  ('i0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'llamada',        'venta', 660000,  'ARS', NULL, NULL, 'Programar despacho',     '2026-05-12', '3m3 eucalipto para nueva plantación',             '2026-04-25'),
  ('i0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'whatsapp',       'venta', 340000,  'ARS', NULL, NULL, 'Seguimiento post-venta', '2026-05-20', '40kg semilla eucalipto para campo',              '2026-04-28'),

-- PRESUPUESTOS / VENTAS EN CURSO (4)
  ('i0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', 'email',          'presupuesto', 900000,  'ARS', NULL, NULL, 'Esperar respuesta',      '2026-05-08', 'Presupuesto 5m3 pino para estructura',           '2026-05-01'),
  ('i0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'reunion_presencial', 'presupuesto', 15000,  'USD', NULL, NULL, 'Reunión de seguimiento', '2026-05-12', 'Propuesta manejo forestal 100ha',                 '2026-05-02'),
  ('i0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000003', 'llamada',        'presupuesto', 170000,  'ARS', NULL, NULL, 'Enviar cotización',      '2026-05-06', '20kg semilla eucalipto + asesoramiento',          '2026-05-01'),
  ('i0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'whatsapp',       'presupuesto', 440000,  'ARS', NULL, NULL, 'Confirmar pedido',       '2026-05-15', '2m3 eucalipto para construcción galpón',          '2026-05-03'),

-- SEGUIMIENTOS PENDIENTES (3)
  ('i0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'whatsapp',       'seguimiento', NULL, NULL, NULL, NULL, 'Consultar necesidades',  '2026-05-06', 'Seguimiento post-venta satisfactoria',           '2026-05-02'),
  ('i0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 'whatsapp',       'seguimiento', NULL, NULL, NULL, NULL, 'Ofrecer nueva variedad', '2026-05-09', 'Preguntar si necesita más semillas este mes',     '2026-05-02'),
  ('i0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'llamada',        'seguimiento', NULL, NULL, NULL, NULL, 'Agendar visita',         '2026-05-10', 'Visita a taller para ver stock',                  '2026-05-01'),

-- SEGUIMIENTOS VENCIDOS (3)
  ('i0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', 'llamada',        'seguimiento', NULL, NULL, NULL, NULL, 'Llamar de nuevo',        '2026-04-28', 'No contestó. Reintentar.',                        '2026-04-25'),
  ('i0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'email',          'seguimiento', NULL, NULL, NULL, NULL, 'Reenviar propuesta',     '2026-04-30', 'Pidió más info. Enviar resumen ejecutivo.',       '2026-04-22'),
  ('i0000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000002', 'whatsapp',       'seguimiento', NULL, NULL, NULL, NULL, 'Verificar interés',      '2026-04-20', 'Cliente inactivo. Último contacto hace 2 meses.', '2026-04-15'),

-- VENTAS PERDIDAS (3)
  ('i0000000-0000-0000-0000-000000000017', 'c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000003', 'llamada',        'no_interesado', NULL, 'ARS', 'Precio', 200000, NULL, NULL, 'Prefirió la competencia por precio más bajo.',    '2026-04-20'),
  ('i0000000-0000-0000-0000-000000000018', 'c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', 'reunion_presencial', 'no_interesado', NULL, 'ARS', 'Tiempo de entrega', 450000, NULL, NULL, 'Necesitaba para la semana. No llegábamos.',       '2026-04-15'),
  ('i0000000-0000-0000-0000-000000000019', 'c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000002', 'whatsapp',       'no_interesado', NULL, 'ARS', 'Necesidad no confirmada', 350000, NULL, NULL, 'Decidió no renovar piso este año.',              '2026-04-10');

-- ─────────────────────────────────────────────
-- 5. LÍNEAS DE INTERACCIÓN (para ventas y presupuestos)
-- ─────────────────────────────────────────────
INSERT INTO interaction_lines (id, interaction_id, product_id, quantity, unit_price, line_total) VALUES
  -- Venta 1: 50kg pino elliotis
  ('l0000000-0000-0000-0000-000000000001', 'i0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 50,  8500,  425000),
  -- Venta 2: 30kg pino elliotis
  ('l0000000-0000-0000-0000-000000000002', 'i0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 30,  8500,  255000),
  -- Venta 3: 3m3 pino paraná
  ('l0000000-0000-0000-0000-000000000003', 'i0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 3,   180000, 540000),
  -- Venta 5: 3m3 eucalipto
  ('l0000000-0000-0000-0000-000000000004', 'i0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000004', 3,   220000, 660000),
  -- Venta 6: 40kg eucalipto
  ('l0000000-0000-0000-0000-000000000005', 'i0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000002', 40,  8500,   340000),
  -- Presupuesto 1: 5m3 pino
  ('l0000000-0000-0000-0000-000000000006', 'i0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000003', 5,   180000, 900000),
  -- Presupuesto 3: 20kg eucalipto + servicio
  ('l0000000-0000-0000-0000-000000000007', 'i0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000002', 20,  8500,   170000),
  -- Presupuesto 4: 2m3 eucalipto
  ('l0000000-0000-0000-0000-000000000008', 'i0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000004', 2,   220000, 440000);

-- ─────────────────────────────────────────────
-- 6. VERIFICACIÓN
-- ─────────────────────────────────────────────
-- Después de ejecutar, verificá con:
-- SELECT count(*) FROM clients;          -- Debe dar 8
-- SELECT count(*) FROM interactions;     -- Debe dar 19
-- SELECT count(*) FROM products;         -- Debe dar 5
-- SELECT count(*) FROM profiles;         -- Debe dar 3
-- SELECT count(*) FROM interaction_lines;-- Debe dar 8
