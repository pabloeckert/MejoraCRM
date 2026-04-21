# CRM Mejora - Documentación del Proyecto

**Empresa:** Mejora Continua  
**Dominio:** crm.mejoraok.com  
**Repositorio:** https://github.com/pabloeckert/mejoracrm  
**Última actualización:** 22 de abril de 2026

---

## 1. Visión General

CRM Mejora es una aplicación de gestión de relaciones con clientes diseñada para empresas del sector forestal, agropecuario e industrial. Permite gestionar clientes, registrar interacciones, visualizar el pipeline de ventas y generar reportes.

### Stack Tecnológico
- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui + Radix UI
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **Gráficos:** Recharts
- **Drag & Drop:** @hello-pangea/dnd (Kanban)
- **Deploy:** FTP (Hosting compartido)

---

## 2. Arquitectura

```
src/
├── components/
│   ├── ui/              # Componentes shadcn/ui (50+)
│   ├── AppLayout.tsx    # Layout principal con sidebar
│   ├── AppSidebar.tsx   # Navegación lateral
│   ├── NavLink.tsx      # Enlaces de navegación
│   └── NotificationsPanel.tsx
├── contexts/
│   └── AuthContext.tsx  # Contexto de autenticación
├── integrations/
│   └── supabase/
│       ├── client.ts    # Cliente Supabase configurado
│       └── types.ts     # Tipos generados del esquema DB
├── pages/
│   ├── Auth.tsx         # Login / Registro
│   ├── Dashboard.tsx    # KPIs y gráficos principales
│   ├── Clients.tsx      # CRUD de clientes
│   ├── Interactions.tsx # Registro de interacciones
│   ├── Pipeline.tsx     # Kanban de oportunidades
│   ├── Reports.tsx      # Reportes y análisis
│   └── NotFound.tsx     # Página 404
├── hooks/
│   └── use-mobile.tsx   # Hook de detección móvil
└── lib/
    └── utils.ts         # Utilidades (cn, etc.)
```

---

## 3. Módulos Funcionales

### 3.1 Dashboard (`/`)
- **KPIs:** Pipeline activo, ventas cerradas, tasa de conversión, seguimientos vencidos
- **Gráficos:** Pipeline por etapa (barra), motivos de pérdida (donut)
- **Alertas:** Seguimientos vencidos y leads sin contacto reciente

### 3.2 Clientes (`/clients`)
- **Tabla** con búsqueda por nombre/empresa y filtros por estado (Lead, Cliente, Inactivo)
- **Crear cliente:** Nombre, empresa, contacto, WhatsApp, email, segmento, canal, ubicación, notas
- **Detalle modal:** Info de contacto, oportunidades asociadas, historial de interacciones
- **Segmentos:** Forestal, Agropecuario, Industrial, Gobierno, Particular
- **Canales:** WhatsApp, Email, Redes sociales, Referido, Teléfono, Feria/Evento, Sitio web

### 3.3 Interacciones (`/interactions`)
- **Registro:** Cliente, medio, tipo, producto, resultado, próximo paso, fecha de seguimiento, notas
- **Medios:** WhatsApp, Email, Llamada, Redes, Reunión
- **Tipos:** Consulta, Cotización, Seguimiento, Cierre
- **Resultados:** Interés, Venta, Sin respuesta, Rechazo
- **Alertas:** Seguimientos vencidos (borde rojo + badge)

### 3.4 Pipeline (`/pipeline`)
- **Kanban drag-and-drop** con 6 etapas:
  - Prospecto → Contactado → Cotización → Negociación → Ganado / Perdido
- **Crear oportunidad:** Cliente, producto, monto estimado
- **Detección de estancamiento:** Oportunidades >7 días sin moverse
- **Motivo de pérdida:** Al mover a "Perdido", se requiere indicar el motivo

### 3.5 Reportes (`/reports`)
- **KPIs:** Ventas cerradas, pipeline activo, ventas perdidas, seguimientos vencidos
- **Gráficos:** Ventas por producto/zona, conversión por vendedor, motivos de pérdida, distribución por segmento

---

## 4. Base de Datos (Supabase)

### Tablas
| Tabla | Descripción | Campos clave |
|-------|-------------|--------------|
| `clients` | Clientes/prospectos | name, company, whatsapp, email, segment, channel, status |
| `interactions` | Registro de contactos | client_id, medium, type, result, follow_up_date |
| `opportunities` | Oportunidades de venta | client_id, product_id, stage, estimated_amount, loss_reason |
| `products` | Catálogo de productos | name, category, price, active |
| `profiles` | Perfiles de usuario | user_id, full_name, avatar_url |
| `user_roles` | Roles de usuario | user_id, role (admin/supervisor/vendedor) |

### Enums
- `client_status`: lead, cliente, inactivo
- `interaction_medium`: whatsapp, email, llamada, redes, reunion
- `interaction_type`: consulta, cotizacion, seguimiento, cierre
- `interaction_result`: interes, venta, sin_respuesta, rechazo
- `opportunity_stage`: prospecto, contactado, cotizacion, negociacion, cerrado_ganado, cerrado_perdido
- `app_role`: admin, supervisor, vendedor

### Seguridad
- **Row Level Security (RLS)** habilitada en todas las tablas
- Políticas de acceso basadas en roles (admin, supervisor, vendedor)
- Funciones: `get_user_role()`, `has_role()`

---

## 5. Configuración

### Variables de Entorno (`.env`)
```
VITE_SUPABASE_URL=https://shjzgxsqkhexuwyipdmd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_SUPABASE_PROJECT_ID=shjzgxsqkhexuwyipdmd
```

### Scripts npm
```bash
npm run dev        # Desarrollo (localhost:8080)
npm run build      # Build de producción → dist/
npm run preview    # Preview del build
npm run lint       # ESLint
npm run test       # Vitest
```

---

## 6. Deploy

### Hosting
- **Proveedor:** Hosting compartido (mejoraok.com)
- **Subdominio:** crm.mejoraok.com
- **FTP:** 185.212.70.250:21
- **Directorio:** `/home/u846064658/domains/mejoraok.com/public_html/crm`

### Proceso
1. `npm run build` → genera `dist/`
2. Subir contenido de `dist/` al directorio FTP
3. Configurar `.htaccess` para SPA routing

---

## 7. Repositorio GitHub
- **URL:** https://github.com/pabloeckert/mejoracrm
- **Rama principal:** main
- **Commits significativos:** 30+ commits desde la creación

---

## 8. Pendientes / Mejoras Futuras
- [ ] Autenticación completa (login/logout UI)
- [ ] Roles y permisos granulares por vista
- [ ] Exportación de datos (CSV/PDF)
- [ ] Notificaciones push/email para seguimientos vencidos
- [ ] Integración con WhatsApp Business API
- [ ] Vista móvil optimizada (PWA)
- [ ] Filtros avanzados en reportes (rango de fechas)
- [ ] Gráficos de tendencia temporal
