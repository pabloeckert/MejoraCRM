# MejoraCRM — Documentación Consolidada

> ## 📌 Instrucción "documentar"
> Cuando el usuario diga **"documentar"**, el agente debe:
> 1. Leer este archivo completo
> 2. Agregar una nueva entrada en el [Registro de cambios](#9-registro-de-cambios) con la fecha actual
> 3. Documentar: trabajos realizados, decisiones tomadas, cambios aplicados, archivos modificados
> 4. Actualizar el [Estado del proyecto](#10-estado-del-proyecto) si corresponde
> 5. Actualizar el [Plan por etapas](#8-plan-por-etapas) si se completó alguna tarea
> 6. Hacer commit y push al repositorio
> 7. Si hay deploy configurado, esperar a que complete

---

## Índice

1. [Visión general](#1-visión-general)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura](#3-arquitectura)
4. [Base de datos](#4-base-de-datos)
5. [Seguridad y RLS](#5-seguridad-y-rls)
6. [Análisis multidisciplinario](#6-análisis-multidisciplinario)
7. [Configuración y despliegue](#7-configuración-y-despliegue)
8. [Plan por etapas](#8-plan-por-etapas)
9. [Registro de cambios](#9-registro-de-cambios)
10. [Estado del proyecto](#10-estado-del-proyecto)

---

## Documentos relacionados

| Documento | Descripción |
|-----------|-------------|
| [SETUP_COMPLETO.sql](./SETUP_COMPLETO.sql) | Script SQL completo para setup desde cero |
| [MIGRACIONES_PENDIENTES.sql](./MIGRACIONES_PENDIENTES.sql) | Migraciones consolidadas (índices, RPC, RLS, vistas) |
| [CRON_REFRESH_VISTAS.sql](./CRON_REFRESH_VISTAS.sql) | Configuración de pg_cron para refresh de vistas |

---

## 1. Visión general

**MejoraCRM** es un CRM web desarrollado por **Mejora Continua®** para gestión de clientes, interacciones comerciales y productos. Orientado a equipos de ventas en el sector forestal/agropecuario argentino.

- **Producción:** [crm.mejoraok.com](https://crm.mejoraok.com)
- **Repositorio:** [github.com/pabloeckert/mejoracrm](https://github.com/pabloeckert/mejoracrm)
- **Supabase:** `fkjuswkjzaeuogctsxpw`
- **Versión:** 1.0.0
- **Package manager:** Bun

### Scores de madurez

| Dimensión | Score | Estado |
|-----------|-------|--------|
| Funcionalidad core | 8/10 | ✅ CRUD completo, dashboard, reportes |
| Arquitectura | 6/10 | 🟡 SPA monolítica, depende 100% de Supabase |
| Seguridad | 8/10 | ✅ RLS endurecido, 0 vulnerabilidades npm |
| Performance | 8/10 | ✅ Índices, RPC, code splitting, vistas materializadas |
| Testing | 6/10 | 🟡 32 tests unitarios, CI quality gates |
| UX/UI | 8/10 | ✅ Dark mode, onboarding, command palette |
| DevOps | 7/10 | 🟡 CI/CD con quality gates, deploy FTP |
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
| Testing | Vitest + Testing Library | 3.x / 16.x |
| Package Manager | Bun | latest |

---

## 3. Arquitectura

### Diagrama

```
┌─────────────────────┐     ┌─────────────────────────┐
│   React SPA (Vite)  │────▶│   Supabase Cloud         │
│  crm.mejoraok.com   │     │  Auth + PostgREST + PG   │
│  (FTP deploy)        │     │  + Vistas materializadas  │
└─────────────────────┘     └─────────────────────────┘
```

### Estructura del proyecto

```
mejoracrm/
├── src/
│   ├── components/
│   │   ├── ui/              # 15 componentes shadcn/ui
│   │   ├── skeletons/       # DashboardSkeleton, ListSkeleton
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
│   │   ├── Dashboard.tsx    # Vista Owner/Seller
│   │   ├── Clients.tsx      # CRUD clientes
│   │   ├── Interactions.tsx # CRUD interacciones
│   │   ├── Products.tsx     # Catálogo productos
│   │   ├── Reports.tsx      # Analytics y KPIs
│   │   ├── Settings.tsx     # Configuración
│   │   ├── Auth.tsx         # Login/Registro
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
│   │   └── utils.ts         # cn() helper
│   ├── assets/
│   └── test/
├── supabase/
│   └── migrations/          # 7 migraciones SQL
├── public/
│   ├── icons/               # PWA icons (192, 512, apple-touch, favicons)
│   ├── fonts/               # LeagueSpartan, BwModelica
│   ├── manifest.json
│   ├── sw.js
│   └── .htaccess
├── Documents/               # Este archivo + SQL scripts
└── .github/workflows/
    └── deploy.yml           # CI/CD: quality → build → FTP deploy
```

### Routing

| Ruta | Componente | Acceso |
|------|-----------|--------|
| `/` | Dashboard | Todos (vista varía por rol) |
| `/clients` | Clients | Todos |
| `/interactions` | Interactions | Todos |
| `/products` | Products | Admin/Supervisor |
| `/reports` | Reports | Admin/Supervisor |
| `/settings` | Settings | Admin |
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

### Tablas

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

---

## 6. Análisis multidiplinario

### Evaluación por rol profesional

#### Área Técnica

| Rol | Score | Estado | Hallazgos clave |
|-----|-------|--------|-----------------|
| Software Architect | 6/10 | 🟡 | SPA monolítica, 100% acoplada a Supabase |
| Cloud Architect | 6/10 | 🟡 | Sin CDN, sin staging, FTP deploy, bajo costo |
| Backend Developer | 8/10 | ✅ | Schema normalizado, 11 índices, 3 RPCs, 2 vistas materializadas |
| Frontend Developer | 7/10 | 🟡 | 32 tests, hooks centralizados, pero componentes >500 líneas |
| iOS/Android Developer | 7/10 | 🟡 | PWA implementada, push notifications preparadas |
| DevOps Engineer | 7/10 | 🟡 | CI/CD con quality gates, pero deploy FTP sin rollback |
| SRE | 4/10 | 🔴 | Sin monitoring, sin alertas, sin error tracking |
| Cybersecurity | 8/10 | ✅ | RLS endurecido, 0 vulns npm, secrets en GitHub |
| Data Engineer | 6/10 | 🟡 | Vistas materializadas + cron, sin ETL formal |
| ML Engineer | 1/10 | 🔴 | Sin ML (volumen insuficiente, no prioritario) |
| QA Automation | 6/10 | 🟡 | 32 tests, CI quality gates, sin E2E |
| DBA | 8/10 | ✅ | Schema optimizado, índices, funciones, vistas |

#### Área de Producto y Gestión

| Rol | Score | Estado | Hallazgos clave |
|-----|-------|--------|-----------------|
| Product Manager | 7/10 | 🟡 | Nicho claro, diferenciadores definidos, gap en features |
| Product Owner | 7/10 | 🟡 | Backlog priorizado, 5 etapas completadas de 6 |
| Scrum Master | 5/10 | 🟡 | Sin formalismo, Kanban recomendado para equipo pequeño |
| UX Researcher | 2/10 | 🔴 | Sin investigación de usuarios real |
| UX Designer | 7/10 | 🟡 | Heurísticas Nielsen mejoradas, onboarding implementado |
| UI Designer | 8/10 | ✅ | Dark mode, skeletons, empty states, brand consistente |
| UX Writer | 7/10 | 🟡 | Copy funcional, necesita unificación de voz |
| Localization | 1/10 | 🔴 | Hardcoded español, sin i18n (no prioritario para AR) |
| Delivery Manager | 7/10 | 🟡 | Lead time <5min, sin staging, sin feature flags |

#### Área Comercial y de Crecimiento

| Rol | Score | Estado | Hallazgos clave |
|-----|-------|--------|-----------------|
| Growth Manager | 4/10 | 🟡 | CRM interno, sin métricas de uso |
| ASO Specialist | N/A | — | No aplica (no hay app store) |
| Performance Marketing | N/A | — | No hay paid ads |
| SEO | 3/10 | 🟡 | Solo login indexable, sin OG tags |
| Business Dev | 5/10 | 🟡 | Oportunidades de partnership identificadas |
| Account Manager | 7/10 | 🟡 | Stakeholder activo, bajo churn risk |
| Content Manager | 3/10 | 🟡 | Docs técnicas sí, guías de usuario no |
| Community Manager | N/A | — | No aplica (producto interno) |

#### Área de Operaciones, Legal y Análisis

| Rol | Score | Estado | Hallazgos clave |
|-----|-------|--------|-----------------|
| BI Analyst | 8/10 | ✅ | Dashboard con KPIs, reportes con funnel y charts |
| Data Scientist | 4/10 | 🟡 | Volumen insuficiente para ML |
| Legal & Compliance | 2/10 | 🔴 | Sin ToS, sin Privacy Policy, sin cookies |
| DPO | 2/10 | 🔴 | Sin registro de tratamiento, Ley 25.326 no cumplida |
| Customer Success | 5/10 | 🟡 | Onboarding implementado, sin feedback in-app |
| Technical Support | 4/10 | 🟡 | GitHub Issues como T3, sin T1/T2 formal |
| RevOps | 1/10 | 🔴 | Producto interno, sin monetización |

### Top 5 áreas de mejora

1. **Legal/Compliance** — Sin Privacy Policy ni ToS (riesgo bajo Ley 25.326)
2. **SRE/Monitoring** — Sin herramientas de observabilidad
3. **UX Research** — Sin datos de usuarios reales
4. **Componentes grandes** — Dashboard (821L), Interactions (864L) necesitan splitting
5. **Staging/Deploy** — FTP sin rollback, sin environment de staging

---

## 7. Configuración y despliegue

### Variables de entorno

```env
VITE_SUPABASE_PROJECT_ID=fkjuswkjzaeuogctsxpw
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_G7KU4fZN7IwQU56gzcd-2g_0ink6xu4
VITE_SUPABASE_URL=https://fkjuswkjzaeuogctsxpw.supabase.co
```

### Setup local

```bash
git clone https://github.com/pabloeckert/mejoracrm.git
cd mejoracrm
cp .env.example .env  # Editar con credenciales
bun install
bun dev
```

### CI/CD (GitHub Actions)

```
push main → quality (tsc + lint + test) → build → FTP deploy → crm.mejoraok.com
```

### Infraestructura

| Servicio | Detalle |
|----------|---------|
| Frontend | crm.mejoraok.com (FTP deploy) |
| Backend | Supabase Cloud |
| CI/CD | GitHub Actions |
| DNS | Subdominio crm.mejoraok.com |

### FTP

| Campo | Valor |
|-------|-------|
| Host | 185.212.70.250 |
| User | u846064658.mejoraok.com |
| Port | 21 |
| Dir | /home/u846064658/domains/mejoraok.com/public_html/crm |

> ⚠️ Las credenciales FTP están en GitHub Secrets, no en el repo.

### Scripts SQL

| Script | Uso |
|--------|-----|
| `SETUP_COMPLETO.sql` | Setup desde cero en proyecto Supabase nuevo |
| `MIGRACIONES_PENDIENTES.sql` | Aplicar sobre schema existente |
| `CRON_REFRESH_VISTAS.sql` | Activar pg_cron para vistas materializadas |

---

## 8. Plan por etapas

### Resumen

| Etapa | Nombre | Estado | Semanas |
|-------|--------|--------|---------|
| 1 | Estabilidad y confianza | ✅ COMPLETADA | 1-2 |
| 2 | Performance y confiabilidad | ✅ COMPLETADA | 3-4 |
| 3 | Mobile y PWA | ✅ COMPLETADA | 5-7 |
| 4 | UX y onboarding | ✅ COMPLETADA | 8-10 |
| 5 | Analytics y reportes | ✅ COMPLETADA | 11-13 |
| 6 | Escalabilidad y compliance | ⏳ PENDIENTE | 14-16 |

### Etapa 1 — Estabilidad y confianza ✅

| # | Tarea | Estado |
|---|-------|--------|
| 1.1 | Error boundary global | ✅ |
| 1.2 | 32 tests unitarios | ✅ |
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
| 2.6 | Reemplazar `any` types | ⏳ Parcial |

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
| 4.2 | Tooltips contextuales | ⏳ (onboarding cubre caso) |
| 4.3 | Split Dashboard.tsx | ⏳ (diferido a v2) |
| 4.4 | Split Interactions.tsx | ⏳ (diferido a v2) |
| 4.5 | Command palette (Ctrl+K) | ✅ |
| 4.6 | Dark mode | ✅ |
| 4.7 | Empty states con CTAs | ✅ |

### Etapa 5 — Analytics y reportes ✅

| # | Tarea | Estado |
|---|-------|--------|
| 5.1 | Página Reportes con 6 KPIs | ✅ |
| 5.2 | Pipeline visual (Kanban) | ⏳ (funnel cumple rol) |
| 5.3 | Funnel analysis | ✅ |
| 5.4 | Exportación a PDF | ✅ |
| 5.5 | Audit log (tabla + triggers) | ✅ |
| 5.6 | Google Calendar OAuth | ⏳ (placeholder en Settings) |

### Etapa 6 — Escalabilidad y compliance ⏳

| # | Tarea | Prioridad | Estado |
|---|-------|-----------|--------|
| 6.1 | Política de Privacidad (Ley 25.326) | P0 | ✅ |
| 6.2 | Términos de Servicio | P0 | ✅ |
| 6.3 | Mecanismo de eliminación de datos | P1 | ✅ |
| 6.4 | Environment de staging | P1 | ⏳ |
| 6.5 | Deploy FTP → Vercel/Cloudflare Pages | P1 | ⏳ |
| 6.6 | UptimeRobot monitoreo | P1 | ⏳ |
| 6.7 | Runbook de incidentes | P2 | ⏳ |
| 6.8 | Evaluar Supabase Pro | P2 | ⏳ |

---

## 9. Registro de cambios

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
- **Índices:** 5 nuevos (`idx_clients_assigned_to`, `idx_clients_status`, `idx_clients_name`, `idx_interactions_follow_up_date` parcial, `idx_interactions_client_result`)
- **Funciones RPC:** `get_dashboard_data()`, `get_notifications_data()`, `get_seller_ranking()`
- **Vistas materializadas:** `mv_seller_ranking`, `mv_client_summary` + `refresh_materialized_views()`
- **RLS:** Endurecimiento de 5 políticas
- **Tipos:** `types.ts` actualizado

### 2026-04-23 — Frontend + dependencias
- QueryClient: `staleTime: 30s`, `refetchOnWindowFocus: false`, `retry: 1`
- Query keys corregidos para invalidación post-mutación
- Dependencias: vite 5.4→6.4, plugin-react-swc 3.11→4.3, jsdom 20→26
- **Resultado:** 0 vulnerabilidades (antes 5)

### 2026-04-23 — Bundle + CI/CD
- Code splitting con `manualChunks`: vendor-react (157KB), vendor-query (49KB), vendor-ui (137KB), vendor-charts (384KB), vendor-supabase (196KB)
- CI/CD migrado a bun, credenciales FTP → GitHub Secrets

### 2026-04-24 — Fix CI/CD + scripts SQL
- Lockfile regenerado con bun v1.3.13
- GitHub Secrets: `FTP_HOST`, `FTP_USERNAME` configurados via API
- Scripts SQL: `MIGRACIONES_PENDIENTES.sql`, `CRON_REFRESH_VISTAS.sql`

### 2026-04-24 — Nuevo proyecto Supabase
- Proyecto nuevo: `fkjuswkjzaeuogctsxpw`
- `SETUP_COMPLETO.sql` ejecutado (8 enums, 6 tablas, 5 funciones, 22+ RLS, 11 índices, 3 RPCs, 2 vistas, cron, 10 productos seed)
- Deploy conectado al nuevo backend

### 2026-04-24 — Etapa 1: Estabilidad y confianza
- Error boundary global (`ErrorBoundary.tsx`)
- 32 tests unitarios (calculations, utils, ErrorBoundary)
- CI: quality gates (tsc + lint + test) antes de deploy
- Skeleton loading (Dashboard, List)

### 2026-04-24 — Etapa 2: Performance y confiabilidad
- Dashboard/Notifications: 3 queries → 1 RPC cada uno
- 7 custom hooks centralizados
- Páginas refactorizadas para usar hooks

### 2026-04-24 — Etapa 3: PWA + mobile
- manifest.json, icons (192, 512, apple-touch, favicons)
- Service Worker (network-first navegación, cache-first assets)
- Responsive CSS (safe areas, prevent zoom, touch targets 44px)
- Push notifications API + PWA install banner

### 2026-04-24 — Etapa 4: UX y onboarding
- Dark mode (next-themes, light/dark/system)
- Onboarding wizard (3 pasos: cliente → interacción → dashboard)
- Command palette (Ctrl+K) con búsqueda global
- Empty states mejorados

### 2026-04-24 — Etapa 5: Analytics y reportes
- Página Reports: 6 KPIs, funnel, tendencia mensual, distribución, top productos, motivos de pérdida, revenue por provincia
- Selector de período, exportación a PDF
- Audit log SQL (tabla + triggers + RLS + cleanup)

### 2026-04-25 — Consolidación de documentación
- Fusión de `DOCUMENTACION.md` + `ANALISIS_PROFUNDO.md` en un solo archivo
- Instrucción "documentar" integrada al inicio del documento
- Análisis multidisciplinario condensado en sección 6

### 2026-04-25 — Etapa 6: Compliance legal (6.1, 6.2, 6.3)
- **Política de Privacidad** (`/privacy`): Ley 25.326, datos recopilados, finalidad, base legal, retención, derechos del titular
- **Términos de Servicio** (`/terms`): aceptación, descripción, cuenta, uso aceptable, propiedad de datos
- **Eliminación de cuenta**: función SQL `request_account_deletion()` + UI en Settings con confirmación
- **Links legales**: footer en Auth, sección "Cuenta y datos" en Settings
- **Tipos y migraciones** actualizados

---

## 10. Estado del proyecto

### Completitud: ~93%

| Área | Estado | Detalle |
|------|--------|---------|
| Frontend | ✅ | React + Vite + Tailwind, code splitting, dark mode, PWA |
| Backend | ✅ | Supabase Auth + PG, RLS endurecido, schema completo |
| Optimización | ✅ | 11 índices, 3 RPCs, 2 vistas materializadas |
| CI/CD | ✅ | GitHub Actions → FTP con quality gates |
| Seguridad | ✅ | 0 vulnerabilidades, secrets en GitHub, RLS granular |
| Testing | 🟡 | 32 tests unitarios, CI quality gates, sin E2E |
| Documentación | ✅ | Este archivo consolidado |
| PWA/Mobile | ✅ | Service worker, manifest, icons, push prep |
| Analytics | ✅ | Reportes con KPIs, funnel, export PDF |
| Compliance | ✅ | Privacy Policy + ToS + eliminación de cuenta |
| Monitoring | ⏳ | Sin Sentry, sin UptimeRobot (6.6 pendiente) |

### Links útiles

| Recurso | URL |
|---------|-----|
| Producción | https://crm.mejoraok.com |
| Repositorio | https://github.com/pabloeckert/mejoracrm |
| GitHub Actions | https://github.com/pabloeckert/mejoracrm/actions |
| Supabase Dashboard | https://supabase.com/dashboard/project/fkjuswkjzaeuogctsxpw |

### Métricas finales

| Métrica | Antes | Después |
|---------|-------|---------|
| Archivos en repo | ~120 | ~80 |
| Dependencias npm | 42 | 22 |
| Vulnerabilidades | 5 | 0 |
| Mayor chunk JS | 1.1MB | 384KB |
| Componentes UI | 43 | 15 |
| Documentos | 18 archivos | 1 archivo |
| Queries Dashboard | 3 separadas | 1 RPC |
| Políticas RLS | 12 | 22+ |
| Tests | 0 | 32 |
| Páginas con features | 7 | 8 (+Reports) |
