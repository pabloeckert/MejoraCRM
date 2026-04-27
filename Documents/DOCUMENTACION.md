# MejoraCRM — Documentación Consolidada

> ## 📌 Instrucción "documentar"
> Cuando el usuario diga **"documentar"**, el agente debe:
> 1. Leer este archivo completo
> 2. Agregar una nueva entrada en el [Registro de cambios](#12-registro-de-cambios) con la fecha actual
> 3. Documentar: trabajos realizados, decisiones tomadas, cambios aplicados, archivos modificados
> 4. Actualizar el [Estado del proyecto](#13-estado-del-proyecto) si corresponde
> 5. Actualizar el [Plan por etapas](#9-plan-por-etapas) si se completó alguna tarea
> 6. Hacer commit y push al repositorio
> 7. Si hay deploy configurado, esperar a que complete

---

## Índice

1. [Visión general](#1-visión-general)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura](#3-arquitectura)
4. [Base de datos](#4-base-de-datos)
5. [Seguridad y RLS](#5-seguridad-y-rls)
6. [Infraestructura y hosting](#6-infraestructura-y-hosting)
7. [Configuración y despliegue](#7-configuración-y-despliegue)
8. [Análisis multidisciplinario](#8-análisis-multidisciplinario)
9. [Plan por etapas](#9-plan-por-etapas)
10. [Runbook de incidentes](#10-runbook-de-incidentes)
11. [Guía de staging](#11-guía-de-staging)
12. [Registro de cambios](#12-registro-de-cambios)
13. [Estado del proyecto](#13-estado-del-proyecto)

---

## Documentos relacionados

| Documento | Descripción |
|-----------|-------------|
| `SETUP_COMPLETO.sql` | Script SQL completo para setup desde cero |
| `MIGRACIONES_PENDIENTES.sql` | Migraciones consolidadas (índices, RPC, RLS, vistas) |
| `CRON_REFRESH_VISTAS.sql` | Configuración de pg_cron para refresh de vistas |

---

## 1. Visión general

**MejoraCRM** es un CRM web desarrollado por **Mejora Continua®** para gestión de clientes, interacciones comerciales y productos. Orientado a equipos de ventas en el sector forestal/agropecuario argentino.

- **Producción:** [crm.mejoraok.com](https://crm.mejoraok.com)
- **Repositorio:** [github.com/pabloeckert/MejoraCRM](https://github.com/pabloeckert/MejoraCRM)
- **Supabase:** `fkjuswkjzaeuogctsxpw`
- **Email:** hola@mejoraok.com
- **Versión:** 1.0.0
- **Package manager:** Bun

### Contexto de infraestructura

- **Hosting anterior:** Hostinger (FTP deploy) — **dado de baja**
- **Email activo:** hola@mejoraok.com (único servicio conservado)
- **Dominio:** mejoraok.com — requiere reconfiguración DNS apuntando a nuevo hosting
- **Backend:** Supabase Cloud (sin cambios, independiente del hosting frontend)

### Scores de madurez

| Dimensión | Score | Estado |
|-----------|-------|--------|
| Funcionalidad core | 8/10 | ✅ CRUD completo, dashboard, reportes |
| Arquitectura | 6/10 | 🟡 SPA monolítica, depende 100% de Supabase |
| Seguridad | 8/10 | ✅ RLS endurecido, 0 vulnerabilidades npm |
| Performance | 8/10 | ✅ Índices, RPC, code splitting, vistas materializadas |
| Testing | 6/10 | 🟡 46 tests unitarios, CI quality gates |
| UX/UI | 8/10 | ✅ Dark mode, onboarding, command palette |
| DevOps | 5/10 | 🔴 FTP deploy caído con Hostinger, sin hosting activo |
| Documentación | 9/10 | ✅ Consolidada en este documento |
| Mobile (PWA) | 7/10 | 🟡 PWA instalable, service worker, push prep |
| Analytics | 8/10 | ✅ Reportes con 6 KPIs, funnel, export PDF |

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | React | 18.3 |
| Language | TypeScript | 5.8 |
| Bundler | Vite | 6.4 |
| UI | Tailwind CSS + shadcn/ui | 3.4 |
| Backend | Supabase (Auth + PostgreSQL) | Cloud |
| State | TanStack React Query | 5.x |
| Charts | Recharts | 3.x |
| Routing | React Router DOM | 6.x |
| Icons | Lucide React | 0.462 |
| Toasts | Sonner | 1.7 |
| Forms | react-hook-form + zod | 7.x / 4.x |
| Testing | Vitest + Testing Library | 3.x / 16.x |
| Package Manager | Bun | latest |

---

## 3. Arquitectura

### Diagrama

```
┌─────────────────────┐     ┌─────────────────────────┐
│   React SPA (Vite)  │────▶│   Supabase Cloud         │
│  crm.mejoraok.com   │     │  Auth + PostgREST + PG   │
│  (nuevo hosting)     │     │  + Vistas materializadas  │
└─────────────────────┘     └─────────────────────────┘
```

### Estructura del proyecto

```
MejoraCRM/
├── src/
│   ├── components/
│   │   ├── ui/              # 15 componentes shadcn/ui
│   │   ├── skeletons/       # DashboardSkeleton, ListSkeleton
│   │   ├── dashboard/       # KPICard, OwnerView, SellerView
│   │   ├── interactions/    # InteractionCard, InteractionForm, ProductLines
│   │   ├── AppLayout.tsx    # Layout principal con sidebar
│   │   ├── AppSidebar.tsx   # Navegación lateral
│   │   ├── CommandPalette.tsx  # Ctrl+K búsqueda global
│   │   ├── ErrorBoundary.tsx   # Error boundary global
│   │   ├── NavLink.tsx
│   │   ├── NotificationsPanel.tsx
│   │   ├── OnboardingWizard.tsx
│   │   ├── PWAInstallBanner.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── ThemeToggle.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx    # Vista Owner/Seller (orquestador)
│   │   ├── Clients.tsx      # CRUD clientes
│   │   ├── Interactions.tsx # CRUD interacciones (orquestador)
│   │   ├── Products.tsx     # Catálogo productos
│   │   ├── Pipeline.tsx     # Kanban de ventas
│   │   ├── Reports.tsx      # Analytics y KPIs
│   │   ├── Settings.tsx     # Configuración
│   │   ├── Auth.tsx         # Login/Registro
│   │   ├── Privacy.tsx      # Política de privacidad
│   │   ├── Terms.tsx        # Términos de servicio
│   │   └── NotFound.tsx     # 404
│   ├── contexts/
│   │   └── AuthContext.tsx   # Auth + roles
│   ├── hooks/               # 8 custom hooks centralizados
│   │   ├── useClients.ts
│   │   ├── useDashboard.ts
│   │   ├── useInteractions.ts
│   │   ├── useNotifications.ts
│   │   ├── useProducts.ts
│   │   ├── useProfiles.ts
│   │   ├── usePWAInstall.ts
│   │   └── index.ts
│   ├── integrations/supabase/
│   │   ├── client.ts
│   │   └── types.ts
│   ├── lib/
│   │   ├── calculations.ts  # Lógica de negocio (KPIs, ranking)
│   │   ├── notifications.ts # Push notifications API
│   │   ├── schemas.ts       # Zod schemas para formularios
│   │   ├── types.ts         # Tipos compartidos
│   │   └── utils.ts         # cn() helper
│   ├── assets/
│   └── test/
├── supabase/
│   └── migrations/          # 7 migraciones SQL
├── public/
│   ├── icons/               # PWA icons
│   ├── fonts/               # LeagueSpartan, BwModelica
│   ├── manifest.json
│   ├── sw.js
│   └── .htaccess
├── Documents/               # Este archivo + SQL scripts
└── .github/workflows/
    └── deploy.yml           # CI/CD: quality → build → deploy
```

### Routing

| Ruta | Componente | Acceso |
|------|-----------|--------|
| `/` | Dashboard | Todos (vista varía por rol) |
| `/clients` | Clients | Todos |
| `/interactions` | Interactions | Todos |
| `/pipeline` | Pipeline | Todos |
| `/products` | Products | Admin/Supervisor |
| `/reports` | Reports | Admin/Supervisor |
| `/settings` | Settings | Admin |
| `/privacy` | Privacy | Público |
| `/terms` | Terms | Público |
| `/auth` | Auth | Público |
| `*` | NotFound | Público |

### Sistema de autenticación

- **AuthContext** provee: `user`, `session`, `role`, `profile`, `loading`, `signOut`
- Al login: `get_user_role` RPC + `profiles` select en paralelo
- Roles: `admin`/`supervisor` → OwnerView, `vendedor` → SellerView

### Sistema de colores (brand Mejora Continua)

```css
--primary: #495F93;        /* Azul principal */
--accent: #E5C34B;         /* Dorado */
--destructive: #C64E4A;    /* Rojo */
--success: hsl(142,60%,40%); /* Verde */
--muted: #656565;          /* Gris */
--background: #000000;     /* Negro (sidebar oscuro) */
```

---

## 4. Base de datos

### Diagrama de entidades

```
auth.users (Supabase Auth)
    │
    ├── 1:1 ── profiles (nombre, avatar)
    ├── 1:N ── user_roles (admin/supervisor/vendedor)
    │
    └── 1:N ── clients (asignado a vendedor)
                   │
                   └── 1:N ── interactions
                                  │
                                  └── 1:N ── interaction_lines ─── products
```

### Enums

```sql
app_role:           admin, supervisor, vendedor
client_status:      activo, potencial, inactivo
interaction_result: presupuesto, venta, seguimiento, sin_respuesta, no_interesado
interaction_medium: whatsapp, llamada, email, reunion_presencial, reunion_virtual,
                    md_instagram, md_facebook, md_linkedin, visita_campo
currency_code:      ARS, USD, EUR
quote_path:         catalogo, adjunto
followup_scenario:  vinculado, independiente, historico
negotiation_state:  con_interes, sin_respuesta, revisando, pidio_cambios
```

### Tablas principales

#### profiles
| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users, UNIQUE |
| full_name | TEXT | Nombre completo |
| avatar_url | TEXT | URL del avatar |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Trigger automático |

#### user_roles
| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users |
| role | app_role | admin/supervisor/vendedor |

#### clients
| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| name | TEXT | Nombre/empresa (obligatorio) |
| company | TEXT | Empresa |
| contact_name | TEXT | Persona de contacto |
| segment | TEXT | Rubro/segmento |
| location | TEXT | Ubicación |
| province | TEXT | Provincia |
| address | TEXT | Dirección |
| whatsapp | TEXT | WhatsApp |
| email | TEXT | Email |
| channel | TEXT | Canal de ingreso |
| first_contact_date | DATE | Primer contacto |
| status | client_status | activo/potencial/inactivo |
| notes | TEXT | Observaciones |
| assigned_to | UUID | FK → auth.users (vendedor) |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Trigger automático |

#### interactions
| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| client_id | UUID | FK → clients (CASCADE) |
| user_id | UUID | FK → auth.users |
| interaction_date | TIMESTAMPTZ | Fecha del contacto |
| result | interaction_result | presupuesto/venta/seguimiento/sin_respuesta/no_interesado |
| medium | interaction_medium | Canal utilizado |
| quote_path | quote_path | catálogo o adjunto |
| total_amount | NUMERIC(14,2) | Monto total |
| currency | currency_code | Moneda |
| attachment_url | TEXT | URL del adjunto |
| reference_quote_id | UUID | FK → interactions |
| followup_scenario | followup_scenario | Tipo de seguimiento |
| negotiation_state | negotiation_state | Estado de negociación |
| followup_motive | TEXT | Motivo del seguimiento |
| historic_quote_amount | NUMERIC(14,2) | Monto del presupuesto histórico |
| historic_quote_date | DATE | Fecha del presupuesto histórico |
| loss_reason | TEXT | Motivo de pérdida |
| estimated_loss | NUMERIC(14,2) | Monto estimado perdido |
| next_step | TEXT | Próximo paso |
| follow_up_date | DATE | Fecha de seguimiento programado |
| notes | TEXT | Observaciones |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Trigger automático |

#### interaction_lines
| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| interaction_id | UUID | FK → interactions (CASCADE) |
| product_id | UUID | FK → products (RESTRICT) |
| quantity | NUMERIC(14,3) | Cantidad |
| unit_price | NUMERIC(14,2) | Precio unitario |
| line_total | NUMERIC(14,2) | Total de la línea |
| created_at | TIMESTAMPTZ | Auto |

#### products
| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| name | TEXT | Nombre |
| category | TEXT | Categoría |
| price | NUMERIC(12,2) | Precio base |
| unit | TEXT | Unidad de medida (default: 'u') |
| unit_label | TEXT | Etiqueta de unidad |
| currency | currency_code | Moneda (default: ARS) |
| description | TEXT | Descripción |
| active | BOOLEAN | Activo/inactivo |
| created_at | TIMESTAMPTZ | Auto |

### Índices (11 total)

```sql
-- Clients
idx_clients_assigned_to  ON clients(assigned_to)
idx_clients_status       ON clients(status)
idx_clients_name         ON clients(name)

-- Interactions
idx_interactions_client          ON interactions(client_id)
idx_interactions_user            ON interactions(user_id)
idx_interactions_date            ON interactions(interaction_date DESC)
idx_interactions_result          ON interactions(result)
idx_interactions_follow_up_date  ON interactions(follow_up_date) WHERE follow_up_date IS NOT NULL
idx_interactions_client_result   ON interactions(client_id, result)

-- Interaction lines
idx_interaction_lines_interaction ON interaction_lines(interaction_id)
idx_interaction_lines_product     ON interaction_lines(product_id)
```

### Funciones SQL

| Función | Tipo | Descripción |
|---------|------|-------------|
| `update_updated_at_column()` | Trigger | Actualiza `updated_at` automáticamente |
| `has_role(user_id, role)` | SECURITY DEFINER | Verifica si el usuario tiene un rol |
| `get_user_role(user_id)` | SECURITY DEFINER | Obtiene el rol principal del usuario |
| `handle_new_user()` | Trigger | Crea perfil + rol al registrarse |
| `calculate_client_status(client_id)` | SECURITY DEFINER | Calcula estado del cliente |
| `get_dashboard_data()` | RPC | Consolida datos del Dashboard en 1 llamada |
| `get_notifications_data()` | RPC | Consolida datos de notificaciones en 1 llamada |
| `get_seller_ranking(period_start)` | RPC | Ranking pre-computado por período |
| `refresh_materialized_views()` | Admin | Refresca vistas materializadas |
| `request_account_deletion()` | RPC | Elimina datos del usuario (GDPR) |

### Vistas materializadas

| Vista | Descripción | Refresh |
|-------|-------------|---------|
| `mv_seller_ranking` | Ranking mensual de vendedores con ingresos y pipeline | pg_cron cada 30 min |
| `mv_client_summary` | Resumen de clientes con última interacción e inactividad | pg_cron cada 30 min |

### Productos semilla

| Producto | Categoría | Precio |
|----------|-----------|--------|
| Plantines de Eucalipto | Forestal | $150 |
| Plantines de Pino | Forestal | $120 |
| Servicio de Poda | Servicios | $5,000 |
| Servicio de Raleo | Servicios | $8,000 |
| Madera Aserrada | Productos | $25,000 |
| Chips de Madera | Productos | $15,000 |
| Consultoría Forestal | Servicios | $10,000 |
| Fertilizantes | Insumos | $3,500 |
| Herbicidas | Insumos | $4,200 |
| Maquinaria (alquiler) | Servicios | $20,000 |

---

## 5. Seguridad y RLS

Todas las tablas tienen Row Level Security activado con 22+ políticas granulares.

### Políticas por tabla

**profiles:** SELECT todos, INSERT/UPDATE solo propio usuario, DELETE admin
**user_roles:** SELECT todos, INSERT/UPDATE/DELETE solo admin
**products:** SELECT todos, INSERT/UPDATE/DELETE admin o supervisor
**clients:** SELECT assigned_to o admin/supervisor, INSERT admin/supervisor/vendedor-asignado, UPDATE assigned_to o admin/supervisor, DELETE admin o supervisor
**interactions:** SELECT user_id o admin/supervisor, INSERT user_id = uid, UPDATE user_id o admin/supervisor, DELETE user_id propio o admin
**interaction_lines:** SELECT hereda de interaction padre, INSERT dueño de interaction, UPDATE/DELETE dueño o admin
**audit_log:** SELECT solo admin

### Audit log

Tabla `audit_log` con trigger genérico en clients, interactions, products, user_roles. Registra old/new data y changed_fields. Cleanup automático de logs > 90 días.

### Eliminación de cuenta

Función `request_account_deletion()` que elimina datos del usuario y anonimiza el perfil. Cumple con derecho de supresión (Ley 25.326 / GDPR).

---

## 6. Infraestructura y hosting

### Situación actual

| Servicio | Estado | Detalle |
|----------|--------|---------|
| Dominio mejoraok.com | ⚠️ Reconfigurar | DNS debe apuntar al nuevo hosting |
| Email hola@mejoraok.com | ✅ Activo | Único servicio conservado de Hostinger |
| Frontend CRM | 🔴 Sin hosting | Hostinger dado de baja, FTP caído |
| Backend Supabase | ✅ Activo | Cloud, independiente del hosting |
| CI/CD GitHub Actions | ⚠️ Pendiente | Workflow existe pero FTP target caído |

### Recomendación de hosting

Para un SPA estático (React/Vite) con backend en Supabase, las mejores opciones son:

#### Opción A: Vercel ⭐ RECOMENDADA

| Aspecto | Detalle |
|---------|---------|
| Costo | Free (Hobby) — 100GB bandwidth/mes |
| Deploy | Git push automático (main → prod, branches → preview) |
| CDN | Global edge network |
| SSL | Automático (Let's Encrypt) |
| Custom domain | ✅ crm.mejoraok.com |
| Rollback | Instantáneo (1 click) |
| Preview deploys | ✅ Automático por PR |
| Analytics | Incluido (Core Web Vitals) |
| Config | Framework: Vite, Build: `bun run build`, Output: `dist` |

**Ventajas:** Deploy más simple, preview por PR, analytics incluido, rollback instantáneo, sin mantener secrets FTP.

**Pasos:**
1. Crear cuenta en vercel.com con GitHub
2. Importar repo `pabloeckert/MejoraCRM`
3. Configurar: Framework = Vite, Build = `bun run build`, Output = `dist`
4. Agregar env vars: `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`
5. Custom domain: agregar `crm.mejoraok.com` en Vercel
6. DNS: crear CNAME `crm` → `cname.vercel-dns.com`

#### Opción B: Cloudflare Pages

| Aspecto | Detalle |
|---------|---------|
| Costo | Free — requests ilimitados, 500MB bandwidth/mes (suficiente) |
| Deploy | Git push automático |
| CDN | Cloudflare global (el más rápido) |
| SSL | Automático |
| Custom domain | ✅ |
| Rollback | ✅ |
| Preview deploys | ✅ Por branch |

**Ventajas:** CDN de Cloudflare (el más rápido del mundo), requests ilimitados gratis.

**Pasos:**
1. Crear cuenta en dash.cloudflare.com
2. Pages → Create → Connect to Git
3. Configurar: Framework = Vite, Build = `bun run build`, Output = `dist`
4. Custom domain: agregar crm.mejoraok.com
5. DNS automático si el dominio está en Cloudflare

#### Opción C: Netlify

| Aspecto | Detalle |
|---------|---------|
| Costo | Free — 100GB bandwidth/mes |
| Deploy | Git push automático |
| CDN | Global |
| SSL | Automático |
| Preview deploys | ✅ |

Similar a Vercel. Menos popular para proyectos nuevos pero igualmente sólido.

#### Comparativa rápida

| Criterio | Vercel | Cloudflare Pages | Netlify |
|----------|--------|-----------------|---------|
| Free tier | 100GB | requests ∞ | 100GB |
| Deploy speed | ~30s | ~20s | ~30s |
| CDN | Global | Cloudflare (top) | Global |
| Preview por PR | ✅ | ✅ | ✅ |
| Rollback | ✅ | ✅ | ✅ |
| Analytics | ✅ Incluido | ✅ Web Analytics | ❌ (pagar) |
| DX (Developer Experience) | Excelente | Bueno | Bueno |
| Edge functions | ✅ | ✅ Workers | ✅ Functions |

**Veredicto:** **Vercel** es la opción recomendada por DX, analytics incluido, y ecosistema React. Cloudflare Pages es la segunda opción si se prioriza rendimiento de CDN.

### Plan de migración DNS

```
1. Elegir hosting (Vercel recomendado)
2. Conectar repo GitHub
3. Configurar env vars de Supabase
4. Agregar custom domain crm.mejoraok.com
5. Actualizar DNS:
   - crm → CNAME → cname.vercel-dns.com
   - (o el registro que indique Vercel)
6. Verificar SSL automático
7. Probar https://crm.mejoraok.com
8. Actualizar deploy.yml (remover FTP, agregar Vercel/CF)
```

---

## 7. Configuración y despliegue

### Variables de entorno

```env
VITE_SUPABASE_PROJECT_ID=fkjuswkjzaeuogctsxpw
VITE_SUPABASE_PUBLISHABLE_KEY=<en .env, no commitear>
VITE_SUPABASE_URL=https://fkjuswkjzaeuogctsxpw.supabase.co
```

### Setup local

```bash
git clone https://github.com/pabloeckert/MejoraCRM.git
cd MejoraCRM
cp .env.example .env  # Editar con credenciales
bun install
bun dev
```

### CI/CD (GitHub Actions)

Estado actual: workflow apunta a FTP de Hostinger (caído).

**Nuevo flujo recomendado (con Vercel):**
```
push main → quality (tsc + lint + test) → Vercel deploy automático
push branch → quality → preview URL automática
```

El workflow de quality checks se mantiene. El deploy lo maneja Vercel directamente (no necesita GitHub Actions para deploy).

### Scripts SQL

| Script | Uso |
|--------|-----|
| `SETUP_COMPLETO.sql` | Setup desde cero en proyecto Supabase nuevo |
| `MIGRACIONES_PENDIENTES.sql` | Aplicar sobre schema existente |
| `CRON_REFRESH_VISTAS.sql` | Activar pg_cron para vistas materializadas |

---

## 8. Análisis multidisciplinario

Evaluación completa del proyecto desde la perspectiva de cada rol profesional. Score: 1-10.

### Área Técnica

| Rol | Score | Estado | Hallazgos | Acciones prioritarias |
|-----|-------|--------|-----------|----------------------|
| **Software Architect** | 6/10 | 🟡 | SPA monolítica, 100% acoplada a Supabase, sin abstracción de backend | Estraña interfaz para desacoplar Supabase (preparar migración futura). Separar lógica de negocio de hooks. |
| **Cloud Architect** | 6/10 | 🟡 | Sin CDN propio, FTP caído, bajo costo actual | Migrar a Vercel/CF Pages. Evaluar Supabase Pro si crece el uso. |
| **Backend Developer** | 8/10 | ✅ | Schema normalizado, 11 índices, 3 RPCs, 2 vistas materializadas | Optimizar RPCs con `json_build_object` más eficiente. Considerar Edge Functions para lógica compleja. |
| **Frontend Developer** | 7/10 | 🟡 | 46 tests, hooks centralizados, componentes splitteados | Reducir 38 `any` restantes. Migrar Clients/Products a react-hook-form. |
| **iOS Developer** | 7/10 | 🟡 | PWA implementada, push notifications preparadas | Testear PWA en iOS Safari. Implementar push notifications reales. |
| **Android Developer** | 7/10 | 🟡 | PWA + manifest correcto | Testear en Chrome Android. Implementar share target. |
| **DevOps Engineer** | 5/10 | 🔴 | FTP caído, sin hosting activo, CI parcial | Migrar a Vercel. Agregar staging environment. Automatizar backups de Supabase. |
| **SRE** | 4/10 | 🔴 | Sin monitoring, sin alertas, sin error tracking | Sentry para errores. UptimeRobot para uptime. Dashboard de métricas Supabase. |
| **Cybersecurity Architect** | 8/10 | ✅ | RLS endurecido, 0 vulns npm, secrets en GitHub | Rotar anon key (expuesta en commit histórico). Auditoría RLS periódica. |
| **Data Engineer** | 6/10 | 🟡 | Vistas materializadas + cron, sin ETL formal | Considerar Airbyte/Fivetran si necesita integrar fuentes externas. |
| **ML Engineer** | 1/10 | 🔴 | Sin ML (volumen insuficiente) | No prioritario. Cuando haya 1000+ clientes: scoring de leads, churn prediction. |
| **QA Automation** | 6/10 | 🟡 | 46 tests, CI quality gates, sin E2E | Agregar Playwright/Cypress para flujos críticos (login, crear interacción). |
| **DBA** | 8/10 | ✅ | Schema optimizado, índices, funciones, vistas | Monitorear uso de índices. Considerar partición si audit_log crece mucho. |

### Área de Producto y Gestión

| Rol | Score | Estado | Hallazgos | Acciones prioritarias |
|-----|-------|--------|-----------|----------------------|
| **Product Manager** | 7/10 | 🟡 | Nicho claro (forestal AR), diferenciadores definidos | Definir roadmap Q3/Q4. Investigar competidores (HubSpot, Pipedrive para AR). |
| **Product Owner** | 7/10 | 🟡 | Backlog priorizado, 5/6 etapas completadas | Cerrar etapa 6. Definir criterios de aceptación para v2. |
| **Scrum Master** | 5/10 | 🟡 | Sin formalismo de procesos | Kanban con WIP limits para equipo pequeño. Daily async si crece el equipo. |
| **UX Researcher** | 2/10 | 🔴 | Sin investigación de usuarios real | Entrevistar 5 usuarios alpha. Crear user personas. Mapa de empatía. |
| **UX Designer** | 7/10 | 🟡 | Heurísticas Nielsen mejoradas, onboarding implementado | Test de usabilidad con 3-5 usuarios. Revisar flujos de error. |
| **UI Designer** | 8/10 | ✅ | Dark mode, skeletons, empty states, brand consistente | Microinteracciones. Animaciones de transición entre páginas. |
| **UX Writer** | 7/10 | 🟡 | Copy funcional, necesita unificación de voz | Crear guía de tono. Unificar mensajes de error. Mejorar tooltips. |
| **Localization Manager** | 1/10 | 🔴 | Hardcoded español, sin i18n | No prioritario para AR. Si expandir a otros países: react-i18next. |
| **Delivery Manager** | 7/10 | 🟡 | Lead time <5min, sin staging, sin feature flags | Staging environment. Feature flags con LaunchDarkly/Unleash (self-hosted). |

### Área Comercial y de Crecimiento

| Rol | Score | Estado | Hallazgos | Acciones prioritarias |
|-----|-------|--------|-----------|----------------------|
| **Growth Manager** | 4/10 | 🟡 | CRM interno, sin métricas de uso | Analytics de uso (PostHog/Mixpanel). Tracking de activación. |
| **ASO Specialist** | N/A | — | No aplica (no hay app nativa) | Si se lanza app nativa: optimizar listing. |
| **Performance Marketing** | N/A | — | No hay paid ads | No prioritario (producto interno). |
| **SEO Specialist** | 3/10 | 🟡 | Solo login indexable, sin OG tags | Agregar meta tags, OG image, sitemap básico. |
| **Business Dev** | 5/10 | 🟡 | Oportunidades de partnership identificadas | Contactar distribuidores forestales. Partnership con consultoras. |
| **Account Manager** | 7/10 | 🟡 | Stakeholder activo, bajo churn risk | Feedback mensual con usuario principal. Roadmap compartido. |
| **Content Manager** | 3/10 | 🟡 | Docs técnicas sí, guías de usuario no | Crear guía de usuario con screenshots. Video tutorial básico. |
| **Community Manager** | N/A | — | No aplica (producto interno) | — |

### Área de Operaciones, Legal y Análisis

| Rol | Score | Estado | Hallazgos | Acciones prioritarias |
|-----|-------|--------|-----------|----------------------|
| **BI Analyst** | 8/10 | ✅ | Dashboard con KPIs, reportes con funnel y charts | Agregar export a Excel. Dashboard personalizable por usuario. |
| **Data Scientist** | 4/10 | 🟡 | Volumen insuficiente para ML | Cuando haya datos: predicción de ventas, detección de churn. |
| **Legal & Compliance** | 5/10 | 🟡 | Privacy Policy + ToS implementados | Revisar con abogado local. Agregar política de cookies. |
| **DPO** | 4/10 | 🟡 | Eliminación de cuenta implementada | Registro de actividades de tratamiento. Evaluación de impacto. |
| **Customer Success** | 5/10 | 🟡 | Onboarding implementado, sin feedback in-app | NPS survey in-app. Health score por cliente. |
| **Technical Support** | 4/10 | 🟡 | GitHub Issues como T3, sin T1/T2 formal | Crear canal de soporte (email hola@mejoraok.com). FAQ in-app. |
| **RevOps** | 1/10 | 🔴 | Producto interno, sin monetización | No prioritario. Si se comercializa: pricing, tiers, billing. |

### Top 5 áreas de mejora (global)

1. **Hosting/DevOps** — Sin hosting activo, migrar a Vercel/CF Pages (P0)
2. **SRE/Monitoring** — Sin herramientas de observabilidad (P1)
3. **UX Research** — Sin datos de usuarios reales (P1)
4. **QA E2E** — Sin tests end-to-end (P1)
5. **Legal** — Privacy Policy necesita revisión profesional (P2)

---

## 9. Plan por etapas

### Resumen

| Etapa | Nombre | Estado | Semanas | Foco |
|-------|--------|--------|---------|------|
| 0 | Infraestructura base | ⏳ PENDIENTE | 0-1 | Hosting, DNS, deploy |
| 1 | Estabilidad y confianza | ✅ COMPLETADA | 1-2 | Error handling, tests, CI |
| 2 | Performance y confiabilidad | ✅ COMPLETADA | 3-4 | RPCs, hooks, paginación |
| 3 | Mobile y PWA | ✅ COMPLETADA | 5-7 | PWA, responsive, push |
| 4 | UX y onboarding | ✅ COMPLETADA | 8-10 | Onboarding, dark mode, UX |
| 5 | Analytics y reportes | ✅ COMPLETADA | 11-13 | KPIs, funnel, export |
| 6 | Escalabilidad y compliance | ⏳ PARCIAL | 14-16 | Legal, staging, monitoring |
| 7 | Crecimiento y profesionalización | 🔜 NUEVA | 17-22 | UX Research, marketing, soporte |
| 8 | Escala y automatización | 🔜 NUEVA | 23-30 | ML, integraciones, multi-tenant |

---

### Etapa 0 — Infraestructura base ⏳

> **Roles involucrados:** Cloud Architect, DevOps Engineer, SRE, Cybersecurity

| # | Tarea | Prioridad | Rol | Estado |
|---|-------|-----------|-----|--------|
| 0.1 | Migrar hosting a Vercel o Cloudflare Pages | P0 | Cloud Architect | ⏳ |
| 0.2 | Configurar DNS: crm.mejoraok.com → nuevo hosting | P0 | DevOps | ⏳ |
| 0.3 | Configurar env vars en nuevo hosting | P0 | DevOps | ⏳ |
| 0.4 | Actualizar GitHub Actions (remover FTP) | P0 | DevOps | ⏳ |
| 0.5 | Verificar SSL y PWA en nuevo hosting | P1 | SRE | ⏳ |
| 0.6 | Rotar anon key de Supabase (expuesta en commit) | P0 | Cybersecurity | ⏳ |
| 0.7 | Staging environment (Vercel preview o subdominio) | P1 | DevOps | ⏳ |

### Etapa 1 — Estabilidad y confianza ✅

| # | Tarea | Estado |
|---|-------|--------|
| 1.1 | Error boundary global | ✅ |
| 1.2 | 46 tests unitarios | ✅ |
| 1.3 | CI: lint + typecheck + test | ✅ |
| 1.4 | Sentry error tracking | ⏳ (requiere cuenta Sentry) |
| 1.5 | Skeleton loading states | ✅ |

### Etapa 2 — Performance y confiabilidad ✅

| # | Tarea | Estado |
|---|-------|--------|
| 2.1 | Dashboard: 3 queries → 1 RPC | ✅ |
| 2.2 | Notifications: 3 queries → 1 RPC | ✅ |
| 2.3 | Paginación en Clients | ✅ |
| 2.4 | Paginación en Interactions | ✅ |
| 2.5 | 7 custom hooks centralizados | ✅ |
| 2.6 | Reemplazar `any` types | 🟡 Parcial (38 restantes) |

### Etapa 3 — Mobile y PWA ✅

| # | Tarea | Estado |
|---|-------|--------|
| 3.1 | manifest.json con icons | ✅ |
| 3.2 | Service Worker (cache assets) | ✅ |
| 3.3 | Responsive design | ✅ |
| 3.4 | Touch targets 44px | ✅ |
| 3.5 | Push notifications (infra) | ✅ |
| 3.6 | Offline básico | ✅ |

### Etapa 4 — UX y onboarding ✅

| # | Tarea | Estado |
|---|-------|--------|
| 4.1 | Onboarding wizard (3 pasos) | ✅ |
| 4.2 | Command palette (Ctrl+K) | ✅ |
| 4.3 | Dark mode | ✅ |
| 4.4 | Empty states con CTAs | ✅ |
| 4.5 | Split Dashboard.tsx (803→322 líneas) | ✅ |
| 4.6 | Split Interactions.tsx (835→273 líneas) | ✅ |

### Etapa 5 — Analytics y reportes ✅

| # | Tarea | Estado |
|---|-------|--------|
| 5.1 | Página Reportes con 6 KPIs | ✅ |
| 5.2 | Funnel analysis | ✅ |
| 5.3 | Exportación a PDF | ✅ |
| 5.4 | Audit log (tabla + triggers) | ✅ |
| 5.5 | Pipeline Kanban (5 columnas) | ✅ |
| 5.6 | react-hook-form + zod en InteractionForm | ✅ |

### Etapa 6 — Escalabilidad y compliance ⏳

| # | Tarea | Prioridad | Rol | Estado |
|---|-------|-----------|-----|--------|
| 6.1 | Política de Privacidad (Ley 25.326) | P0 | Legal | ✅ |
| 6.2 | Términos de Servicio | P0 | Legal | ✅ |
| 6.3 | Eliminación de cuenta | P1 | DPO | ✅ |
| 6.4 | Staging environment | P1 | DevOps | ⏳ |
| 6.5 | Deploy moderno (Vercel/CF Pages) | P0 | DevOps | ⏳ |
| 6.6 | Sentry error tracking | P1 | SRE | ⏳ |
| 6.7 | UptimeRobot monitoreo | P1 | SRE | ⏳ |
| 6.8 | Runbook de incidentes | P2 | SRE | ✅ (en este doc) |
| 6.9 | Evaluar Supabase Pro | P2 | DBA | ⏳ |
| 6.10 | Backup automático Supabase | P1 | DBA | ⏳ |

### Etapa 7 — Crecimiento y profesionalización 🔜

> **Roles involucrados:** UX Researcher, UX Designer, Content Manager, Growth Manager, Customer Success, Technical Support, SEO, Business Dev

| # | Tarea | Prioridad | Rol | Estado |
|---|-------|-----------|-----|--------|
| 7.1 | Entrevistar 5 usuarios alpha | P0 | UX Researcher | ⏳ |
| 7.2 | User personas (3 perfiles) | P1 | UX Researcher | ⏳ |
| 7.3 | Test de usabilidad (3-5 usuarios) | P1 | UX Designer | ⏳ |
| 7.4 | Guía de usuario con screenshots | P1 | Content Manager | ⏳ |
| 7.5 | Video tutorial básico (3 min) | P2 | Content Manager | ⏳ |
| 7.6 | NPS survey in-app | P1 | Customer Success | ⏳ |
| 7.7 | Canal de soporte (email + FAQ in-app) | P1 | Tech Support | ⏳ |
| 7.8 | Meta tags + OG image + sitemap | P2 | SEO | ⏳ |
| 7.9 | Analytics de uso (PostHog) | P1 | Growth Manager | ⏳ |
| 7.10 | Tracking de activación (funnel onboarding) | P1 | Growth Manager | ⏳ |
| 7.11 | Migrar Clients.tsx a react-hook-form + zod | P2 | Frontend | ⏳ |
| 7.12 | Migrar Products.tsx a react-hook-form + zod | P2 | Frontend | ⏳ |
| 7.13 | Tests E2E con Playwright (flujos críticos) | P1 | QA Automation | ⏳ |
| 7.14 | Google Calendar OAuth (Settings) | P2 | Backend | ⏳ |

### Etapa 8 — Escala y automatización 🔜

> **Roles involucrados:** ML Engineer, Data Engineer, Backend, Business Dev, RevOps

| # | Tarea | Prioridad | Rol | Estado |
|---|-------|-----------|-----|--------|
| 8.1 | Scoring de leads (ML) | P2 | ML Engineer | ⏳ |
| 8.2 | Predicción de churn de clientes | P2 | ML Engineer | ⏳ |
| 8.3 | Integración con WhatsApp Business API | P1 | Backend | ⏳ |
| 8.4 | Integración con email marketing | P2 | Data Engineer | ⏳ |
| 8.5 | Multi-tenant (si se comercializa) | P2 | Software Architect | ⏳ |
| 8.6 | Pricing tiers y billing | P2 | RevOps | ⏳ |
| 8.7 | API pública para integraciones | P2 | Backend | ⏳ |
| 8.8 | App nativa (iOS/Android) | P3 | Mobile | ⏳ |

---

## 10. Runbook de incidentes

### Contactos

| Rol | Responsable | Contacto |
|-----|------------|----------|
| Admin Supabase | — | Supabase Dashboard |
| Admin Hosting | — | Vercel/CF Dashboard |
| Admin DNS | — | Panel de dominio |
| Email | — | hola@mejoraok.com |

### URLs clave

| Servicio | URL |
|----------|-----|
| Producción | https://crm.mejoraok.com |
| Supabase Dashboard | https://supabase.com/dashboard/project/fkjuswkjzaeuogctsxpw |
| GitHub Actions | https://github.com/pabloeckert/MejoraCRM/actions |
| Vercel Dashboard | https://vercel.com/dashboard (una vez configurado) |

### Escenario 1: La app no carga (página en blanco)

**Diagnóstico:**
1. DevTools → Console → errores rojos
2. Verificar si `https://crm.mejoraok.com` responde
3. Verificar Supabase status: https://status.supabase.com

**Causas posibles:**
- Error de JS → revertir deploy
- Supabase caído → esperar o contactar soporte
- CORS → verificar allowed origins en Supabase
- Env vars → verificar en dashboard de hosting

**Resolución:**
```bash
# Revertir (Vercel: instant rollback desde dashboard)
# O revertir código:
git revert HEAD && git push origin main
```

### Escenario 2: Error de autenticación

**Diagnóstico:**
1. Supabase Dashboard → Authentication → Users
2. Verificar usuario exista y esté confirmado
3. Verificar RLS no bloquee

**Resolución:** Confirmar email manualmente si necesario. Verificar `handle_new_user()` trigger.

### Escenario 3: Datos no aparecen (listas vacías)

**Diagnóstico:**
1. Verificar RLS en Supabase Dashboard
2. Verificar datos en Table Editor
3. Console del navegador para errores de red

**Resolución:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'clients';
SELECT COUNT(*) FROM clients;
SELECT get_dashboard_data();
```

### Escenario 4: Deploy fallido

**Diagnóstico:**
1. GitHub Actions → run fallido → revisar step

**Causas comunes:**
- `tsc --noEmit` → error de TypeScript
- `eslint` → error de linting
- `vitest run` → test roto
- `bun install` → regenerar lockfile

### Escenario 5: Supabase — Límites alcanzados

**Límites plan Free:** 500MB storage, 2GB transfer/mes, 50K usuarios activos/mes.

**Resolución:** Upgrade a Supabase Pro ($25/mes).

### Escenario 6: Rendimiento lento

**Diagnóstico:**
```sql
EXPLAIN ANALYZE SELECT * FROM clients WHERE assigned_to = '<user_id>';
SELECT refresh_materialized_views();
SELECT * FROM pg_stat_user_tables WHERE schemaname = 'public';
```

### Escenario 7: Datos corruptos o eliminados

**Diagnóstico:**
```sql
SELECT * FROM audit_log ORDER BY changed_at DESC LIMIT 50;
```

**Prevención:** Audit log activo. Considerar soft delete para datos críticos.

### Checklist post-incidente

- [ ] Causa raíz identificada
- [ ] Tiempo de degradación medido
- [ ] Usuarios afectados cuantificados
- [ ] Medidas preventivas definidas
- [ ] Runbook actualizado
- [ ] Test preventivo creado

---

## 11. Guía de staging

### Opción 1: Vercel Preview Deploys (recomendada)

Vercel genera un preview URL automáticamente por cada PR. No necesita configuración adicional.

- `main` → producción (crm.mejoraok.com)
- Cualquier branch → preview URL única

### Opción 2: Staging manual

1. Crear segundo proyecto Supabase: `mejoracrm-staging`
2. Ejecutar `SETUP_COMPLETO.sql` en el nuevo proyecto
3. Crear `.env.staging` con credenciales del proyecto staging
4. Build: `bun run build --mode staging`
5. Deploy a subdominio: `staging.crm.mejoraok.com`

### Opción 3: Cloudflare Pages branches

Similar a Vercel: cada branch genera un preview URL automático.

---

## 12. Registro de cambios

### 2026-04-23 — Limpieza inicial del repositorio
- Eliminado `.env` del tracking, creado `.env.example`
- Merge de `Documents/` + `documents/` → `Documents/`
- Eliminados 3 lockfiles redundantes, 28 componentes UI sin uso, 17 dependencias @radix-ui
- Versión → `1.0.0`, `packageManager: "bun@latest"` agregado
- **Resultado:** 61 archivos modificados, ~11,000 líneas eliminadas

### 2026-04-23 — Consolidación de documentación
- Eliminados 18 archivos de docs desactualizados
- Creado `Documents/DOCUMENTACION.md` como documento vivo consolidado

### 2026-04-23 — Optimización backend (Etapas 2-6 del plan original)
- **Índices:** 5 nuevos
- **Funciones RPC:** `get_dashboard_data()`, `get_notifications_data()`, `get_seller_ranking()`
- **Vistas materializadas:** `mv_seller_ranking`, `mv_client_summary` + `refresh_materialized_views()`
- **RLS:** Endurecimiento de 5 políticas

### 2026-04-23 — Frontend + dependencias
- QueryClient: `staleTime: 30s`, `refetchOnWindowFocus: false`, `retry: 1`
- Dependencias: vite 5.4→6.4, plugin-react-swc 3.11→4.3, jsdom 20→26
- **Resultado:** 0 vulnerabilidades (antes 5)

### 2026-04-23 — Bundle + CI/CD
- Code splitting con `manualChunks`: vendor-react (157KB), vendor-query (49KB), vendor-ui (137KB), vendor-charts (384KB), vendor-supabase (196KB)
- CI/CD migrado a bun, credenciales FTP → GitHub Secrets

### 2026-04-24 — Fix CI/CD + scripts SQL
- Lockfile regenerado con bun v1.3.13
- Scripts SQL: `MIGRACIONES_PENDIENTES.sql`, `CRON_REFRESH_VISTAS.sql`

### 2026-04-24 — Nuevo proyecto Supabase
- Proyecto nuevo: `fkjuswkjzaeuogctsxpw`
- `SETUP_COMPLETO.sql` ejecutado
- Deploy conectado al nuevo backend

### 2026-04-24 — Etapa 1: Estabilidad y confianza
- Error boundary global, 32 tests unitarios, CI quality gates, skeleton loading

### 2026-04-24 — Etapa 2: Performance
- Dashboard/Notifications → 1 RPC cada uno, 7 custom hooks, páginas refactorizadas

### 2026-04-24 — Etapa 3: PWA + mobile
- manifest.json, service worker, responsive CSS, push notifications API, PWA install banner

### 2026-04-24 — Etapa 4: UX y onboarding
- Dark mode, onboarding wizard, command palette, empty states

### 2026-04-24 — Etapa 5: Analytics y reportes
- Reports con 6 KPIs, funnel, export PDF, audit log SQL

### 2026-04-25 — Compliance legal (6.1-6.3)
- Privacy Policy, ToS, eliminación de cuenta

### 2026-04-25 — Documentación operativa
- Runbook de incidentes, guía de staging

### 2026-04-25 — Split de componentes grandes
- Dashboard: 803→322 líneas, Interactions: 835→273 líneas

### 2026-04-25 — Pipeline Kanban
- Vista Kanban con 5 columnas, cards con monto/productos/next_step

### 2026-04-25 — react-hook-form + zod
- InteractionForm migrado, 14 tests nuevos → total 46

### 2026-04-25 — Limpieza de tipos any
- 107 → 38 `any` types, nuevo `src/lib/types.ts`

### 2026-04-27 — Re-análisis y consolidación
- Salida de Hostinger, solo email hola@mejoraok.com conservado
- Documentación re-consolidada en un solo archivo
- Análisis multidisciplinario actualizado (37 roles evaluados)
- Plan por etapas reestructurado (8 etapas, etapa 0 añadida)
- Comparativa de hosting: Vercel vs Cloudflare Pages vs Netlify
- Eliminación de docs redundantes (GUIA_STAGING, RUNBOOK, PROMPT → integrados)

---

## 13. Estado del proyecto

### Completitud: ~85% (infraestructura pendiente)

| Área | Estado | Detalle |
|------|--------|---------|
| Frontend | ✅ | React + Vite + Tailwind, code splitting, dark mode, PWA, Kanban |
| Backend | ✅ | Supabase Auth + PG, RLS endurecido, schema completo |
| Optimización | ✅ | 11 índices, 3 RPCs, 2 vistas materializadas |
| CI/CD | ⚠️ | Quality gates OK, deploy FTP caído (Hostinger) |
| Hosting | 🔴 | Sin hosting activo — migrar a Vercel/CF Pages |
| Seguridad | ✅ | 0 vulnerabilidades, secrets en GitHub, RLS granular |
| Testing | ✅ | 46 tests unitarios, CI quality gates |
| Tipos | 🟡 | 38 any restantes |
| Documentación | ✅ | Este archivo consolidado |
| PWA/Mobile | ✅ | Service worker, manifest, icons, push prep |
| Analytics | ✅ | Reportes con KPIs, funnel, export PDF |
| Compliance | ✅ | Privacy Policy + ToS + eliminación de cuenta |
| Monitoring | ⏳ | Sin Sentry, sin UptimeRobot |

### Links útiles

| Recurso | URL |
|---------|-----|
| Producción | https://crm.mejoraok.com (pendiente migración) |
| Repositorio | https://github.com/pabloeckert/MejoraCRM |
| GitHub Actions | https://github.com/pabloeckert/MejoraCRM/actions |
| Supabase Dashboard | https://supabase.com/dashboard/project/fkjuswkjzaeuogctsxpw |
| Email | hola@mejoraok.com |

### Métricas

| Métrica | Valor |
|---------|-------|
| Archivos en repo | ~80 |
| Dependencias npm | 22 |
| Vulnerabilidades | 0 |
| Mayor chunk JS | 384KB |
| Componentes UI | 15 |
| Tests | 46 |
| Páginas | 11 |
| Políticas RLS | 22+ |
| `any` types | 38 |
| Índices DB | 11 |
| RPCs | 4 |
| Vistas materializadas | 2 |
