

## CRM "Mejora Continua" — Plan de implementación

### Base de datos (Supabase)

**Tablas principales:**
- **profiles** — nombre, rol (vendedor/supervisor/dueño), avatar
- **user_roles** — roles con enum (admin/supervisor/vendedor) y función `has_role` con RLS segura
- **clients** — nombre, empresa, contacto, segmento, ubicación, WhatsApp, email, canal de ingreso, fecha primer contacto, estado (lead/cliente/inactivo), observaciones
- **interactions** — fecha, cliente, vendedor, medio (WhatsApp/email/llamada/redes/reunión), tipo (consulta/cotización/seguimiento/cierre), producto, resultado (interés/venta/sin respuesta/rechazo), próximo paso, fecha seguimiento, observaciones
- **products** — lista predefinida de productos (nombre, categoría, precio)
- **pipeline_stages** — etapas del pipeline (prospecto, contactado, cotización, negociación, cerrado ganado, cerrado perdido)
- **opportunities** — cliente, producto, etapa, monto estimado, motivo de pérdida, vendedor asignado

**Seguridad:** RLS en todas las tablas. Vendedores ven solo sus datos; supervisores/dueños ven todo.

---

### Pantallas y funcionalidades

#### 1. Login y Autenticación
- Login con email y contraseña
- Registro con asignación de rol
- Protección de rutas según rol

#### 2. Dashboard principal (Supervisor/Dueño)
- KPIs: oportunidades activas, cerradas, tasa de conversión, ventas del período
- Gráfico de ventas por producto, zona y vendedor
- Lista de seguimientos vencidos
- Alertas: leads sin contacto en X días, vendedores sin actividad

#### 3. Clientes y Leads
- Tabla con búsqueda y filtros (segmento, estado, zona, canal)
- Formulario simple de alta/edición con los campos mínimos del documento
- Vista detalle del cliente con historial de interacciones
- Estados: Lead → Cliente → Inactivo

#### 4. Interacciones
- Registro rápido: seleccionar cliente, medio, tipo, producto (dropdown predefinido), resultado, próximo paso + fecha
- Timeline de interacciones por cliente
- Filtros por vendedor, fecha, tipo, resultado

#### 5. Pipeline visual (Kanban)
- Columnas por etapa: Prospecto → Contactado → Cotización → Negociación → Cerrado
- Drag & drop para mover oportunidades
- Al cerrar como perdida: campo obligatorio de motivo de pérdida
- Indicador visual de oportunidades estancadas (sin movimiento en X días)

#### 6. Reportes
- Oportunidades activas vs cerradas
- Seguimientos vencidos
- Conversión por vendedor
- Motivos de pérdida (gráfico)
- Ventas realizadas por producto, zona, vendedor, período
- Ventas no cerradas e impacto económico estimado

#### 7. Alertas y recordatorios
- Panel de seguimientos del día
- Badge/notificación de leads sin contacto
- Indicador de vendedores sin actividad reciente

---

### Diseño
- Estilo limpio y minimalista tipo Notion/Linear
- Sidebar de navegación colapsable
- Paleta neutra con acentos azules
- Tipografía clara, espaciado generoso
- Mobile-friendly para uso desde celular

### Tecnología
- React + TypeScript + Tailwind + shadcn/ui
- Supabase (auth, DB, RLS)
- Recharts para gráficos
- @hello-pangea/dnd para Kanban drag & drop

