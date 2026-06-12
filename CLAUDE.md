# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
bun install          # instalar dependencias
bun dev              # servidor de desarrollo en http://localhost:8080
bun build            # build de producción
bun build:dev        # build en modo development
bun preview          # preview del build de producción
bun lint             # ESLint
bun test             # tests unitarios (Vitest, modo CI — run once)
bun test:watch       # tests en modo watch interactivo
npx tsc --noEmit    # typecheck (sin script dedicado; CI usa npx tsc --noEmit)
bun test:e2e        # tests E2E (Playwright, requiere servidor corriendo)
bun test:e2e:ui     # tests E2E con interfaz visual
```

Para correr un test individual:
```bash
bun test src/lib/businessLogic.test.ts
```

## Variables de entorno

Copiar `.env.example` → `.env`:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
VITE_DEMO_MODE=true         # false para conectar Supabase real
VITE_GOOGLE_CLIENT_ID=...   # opcional — habilita sync con Google Calendar
```

Con `VITE_DEMO_MODE=true` (valor por defecto) la app usa datos de `src/demo/demoData.ts` sin necesitar Supabase.

**Importante:** `DEMO_MODE` es una constante evaluada en la carga del módulo (`import.meta.env.VITE_DEMO_MODE !== "false"`), no es reactiva. Cambiarla requiere reiniciar el servidor de desarrollo.

## Identidad visual — Mejora Continua®

**Paleta de colores real:**
| Color | Hex | Uso |
|---|---|---|
| Azul marino | `#020659` | Primary, sidebar background |
| Azul medio | `#1C4D8C` | Hover states, sidebar accent |
| Amarillo | `#F2BB16` | Accent, highlights |
| Rojo | `#D9072D` | Destructive, alertas |
| Negro | `#0D0D0D` | Texto principal |

**Logos en uso:**
- `src/assets/branding/MC_Logo.png` — ícono cuadrado (sidebar, collapsed/expanded)
- `src/assets/logo.png` — usado en página de Auth

**Fuentes:** Bw Modelica (body, en `public/fonts/`), League Spartan (display/tagline).

## Arquitectura general

**Stack:** React 18 + TypeScript strict + Vite · Supabase (Auth + PostgreSQL) · TanStack Query · shadcn/ui + Tailwind · Recharts · Vitest

**Path alias:** `@/` apunta a `src/`.

### Flujo de autenticación y roles

`AuthContext` (`src/contexts/AuthContext.tsx`) expone `user`, `session`, `role` (`admin` | `vendedor`), `profile` y `organizationId`. En **demo mode** inyecta un usuario ficticio y devuelve datos de `src/demo/demoData.ts` sin llamar a Supabase.

El sidebar (`src/components/AppSidebar.tsx`) filtra ítems según `role` — cada ítem puede tener un array `roles: ["admin", "supervisor"]`; si el campo está ausente, el ítem es visible para todos. Rutas con `roles: ["admin", "supervisor"]`: `/reports`, `/products`, `/whatsapp-link`, `/settings`.

En demo mode, `DemoRoleToggle` aparece en el header para cambiar entre `admin` y `vendedor` en caliente. El estado se guarda internamente en `AuthContext` vía `demoRole`. El contexto también expone `isDemo: boolean`. `DEMO_MODE` es una constante exportada desde `AuthContext` que todos los hooks importan directamente — no existe un módulo de config separado.

> **Nota:** el enum de BD `app_role` incluye `supervisor`, pero en demo mode solo se alterna entre `admin` y `vendedor`.

### Patrón de hooks de datos

Cada hook sigue el mismo patrón:
```ts
if (DEMO_MODE) return DEMO_DATA;
// else → Supabase
```

- **Dashboard:** `supabase.rpc("get_dashboard_data")` — una sola llamada que retorna interacciones, clientes y perfiles.
- **Interacciones:** paginación infinita con `useInfiniteQuery`, 50 registros por página.
- **Clientes:** paginación infinita igual.
- **Notificaciones:** `supabase.rpc("get_notifications_data")` — misma forma que dashboard.

TanStack Query global: `staleTime: 30_000`, `refetchOnWindowFocus: false`, `retry: 1`.

**Query keys en uso:**
- `["clients-infinite", "demo" | "live"]`
- `["clients", "demo" | "live"]` — lista completa (useAllClients)
- `["clients-min", "demo" | "live"]` — id+name mínimo
- `["interactions-infinite", "demo" | "live"]`
- `["interactions", "demo" | "live"]` — lista completa (useAllInteractions)
- `["interactions-presupuestos", clientId, "demo" | "live"]` — useClientPresupuestos
- `["dashboard-data", "demo" | "live"]`
- `["notifications-data", "demo" | "live"]`
- `["products", "demo" | "live"]`, `["products-active", "demo" | "live"]`
- `["profiles", "demo" | "live"]` — useProfiles (id + nombre de vendedores)
- `["organization", orgId | "demo"]` — useOrganization (nombre + plan de la org)

Las mutaciones invalidan todas las query keys relacionadas (ej. `useDeactivateClient` invalida `clients`, `clients-infinite` y `dashboard-data`).

Las páginas de infinite query se aplanan con `flattenClientPages(data)` / `flattenInteractionPages(data)` antes de renderizar. `InfiniteScrollTrigger` (`src/components/InfiniteScrollTrigger.tsx`) dispara `fetchNextPage` vía IntersectionObserver.

**Demo mode con mutaciones en memoria:** en demo mode, los hooks de clientes e interacciones usan stores en memoria (`MEMORY_DEMO_CLIENTS`, `MEMORY_DEMO_INTERACTIONS`) inicializados desde `demoData.ts`. Las funciones `addDemoClient` / `addDemoInteraction` (exportadas desde los hooks) agregan al store en memoria, lo que permite "crear y ver" durante la sesión sin persistencia. Al recargar la página, vuelve a los datos originales de `demoData.ts`.

El mismo patrón aplica a `MEMORY_DEMO_PROFILES` + `setDemoTarget` para cuotas mensuales, y `MEMORY_DEMO_ORG` + `useUpdateOrganization` para el nombre de la organización.

### Estructura de páginas y subcomponentes

Todas las páginas se cargan con `React.lazy` + `Suspense` (code splitting automático).

```
src/pages/Dashboard.tsx        → selecciona OwnerViewV2 o SellerViewV2 según role
src/components/dashboard/
  OwnerViewV2.tsx              → vista admin/supervisor: KPIs, gráficas, ranking vendedores
  SellerViewV2.tsx             → vista vendedor: mis métricas personales
  KPICard.tsx                  → tarjeta reutilizable con delta y trend

src/components/skeletons/
  DashboardSkeleton.tsx
  ListSkeleton.tsx

src/pages/Clients.tsx          → orquestador (~180L)
src/components/clients/
  ClientsTable.tsx             → tabla con soft delete (UserX → status=inactivo)
  ClientFormDialog.tsx         → formulario crear/editar
  ClientDetailDialog.tsx       → detalle + historial de interacciones
  ClientImportDialog.tsx       → preview importación CSV

src/pages/Products.tsx         → orquestador (~150L)
src/components/products/
  ProductsTable.tsx
  ProductFormDialog.tsx
  ProductImportDialog.tsx

src/components/interactions/
  InteractionForm.tsx          → wizard orquestador (~130L)
  steps/StepCliente.tsx        → paso 1
  steps/StepResultado.tsx      → paso 2
  steps/StepDetalles.tsx       → paso 3 (condicional por resultado)
  steps/StepMedio.tsx          → paso 4
  ProductLines.tsx             → líneas de producto dentro del form
  ProformaUpload.tsx           → adjunto de proforma
  InteractionCard.tsx          → card con edit + delete inline + badge de envejecimiento (8-30d ámbar, >30d rojo)
  PipelineKanban.tsx           → vista Kanban de pipeline (5 columnas por estado, ordenadas por urgencia)
```

### Lógica de negocio

Dos archivos de lógica pura — ninguno depende de React ni Supabase:

- `src/lib/businessLogic.ts` — KPIs comparativos por período (`PeriodKPIs`, `TrendData`), rankings de vendedores, cálculo de `Period` (hoy/semana/mes/trimestre/semestre/año). Usa `date-fns`.
- `src/lib/calculations.ts` — helpers más simples: `calculateKPIs`, `filterByPeriod`, `getOverdueFollowups`, `isValidWhatsapp`, `calculateSellerRanking`.

### Utilidades

- `src/lib/schemas.ts` — esquemas Zod para validar `InteractionForm`. La forma condicional del formulario (campos visibles por resultado) se refleja en los refinements.
- `src/lib/csvParser.ts` — parser CSV propio (sin deps externas): maneja quotes, BOM UTF-8, CRLF. Usado por los dialogs de importación.
- `src/lib/excelExport.ts` — exporta clientes, interacciones y productos a `.xlsx` (lib: `xlsx`). Pre-built functions: `exportClientsExcel`, `exportInteractionsExcel`, `exportProductsExcel`.
- `src/lib/notifications.ts` — helpers para Push API del navegador. `VAPID_PUBLIC_KEY` está vacío (push server no configurado aún); `showLocalNotification` sí funciona sin servidor.
- `src/lib/constants.ts` — fuente única de verdad para labels, estilos, enums, colores de brand y chart, opciones de formularios. Agregar aquí cualquier nuevo enum o label.

### Tipos

- `src/integrations/supabase/types.ts` — generado automáticamente. **No editar.**
- `src/lib/types.ts` — tipos de app que componen sobre los de Supabase. `Interaction` incluye joins de `clients` e `interaction_lines`. `ProfileWithTarget` y `TargetMap` para cuotas mensuales (no en types.ts auto-generado).

### Funcionalidades globales de la app

- **CommandPalette** (`src/components/CommandPalette.tsx`): abre con `Ctrl+K` / `Cmd+K`. Busca clientes e interacciones en tiempo real, y permite navegar a cualquier sección.
- **OnboardingWizard** (`src/components/OnboardingWizard.tsx`): se muestra al primer ingreso. Persiste el estado en `localStorage` bajo la clave `onboarding_dismissed`.
- **Google Calendar** (`src/hooks/useGoogleCalendar.ts`): OAuth implícito via Google Identity Services (sin backend). Token guardado en `localStorage` bajo `mejoracrm_google_access_token` y `mejoracrm_google_token_expiry`. Requiere `VITE_GOOGLE_CLIENT_ID`. Si no está configurado, la feature queda silenciada.
- **ThemeProvider**: usa `next-themes`, tema por defecto `light`, con soporte `system`.
- **PWA**: hay service worker + `PWAInstallBanner`. Los íconos (`public/icons/`) son placeholders — reemplazar con logo MC real.
- **Drag & Drop**: `@dnd-kit/core` + `@dnd-kit/sortable` disponibles (en uso en alguna vista de productos).
- **BottomNav** (`src/components/BottomNav.tsx`): barra de navegación mobile (`md:hidden`), fija en la parte inferior. Incluye un FAB central que navega a `/interactions`. Muestra un punto rojo en "Historial" si hay seguimientos vencidos. No se renderiza en `/auth`, `/privacy` ni `/terms`.
- **PipelineKanban** (`src/components/interactions/PipelineKanban.tsx`): vista alternativa en `/interactions`, toggle list/kanban persistido en `localStorage["interactions_view"]`. 5 columnas: presupuesto / seguimiento / sin_respuesta / venta / no_interesado.
- **Cuotas mensuales** (`useProfiles` + `useUpdateTarget`): campo `monthly_target` en `profiles`. Admin las gestiona en Settings. Dashboard admin muestra barra de progreso en ranking; vendedor ve 4ª card "Tu cuota". Semáforo: ≥100% verde · 60-99% ámbar · <60% rojo.
- **Multi-organización** (`useOrganization` + `useUpdateOrganization`): cada cuenta tiene su propia `organization` en DB. `organizationId` expuesto en `AuthContext`. Admin puede editar el nombre de la empresa en Settings → card "Organización". El signup pide "Nombre de empresa" → se crea la org automáticamente via trigger `handle_new_user`. Demo mode usa `DEMO_ORG_ID = "demo-org-001"` y `MEMORY_DEMO_ORG`.

### Base de datos

Tablas principales: `organizations`, `clients`, `interactions`, `interaction_lines`, `products`, `profiles`.

Enums clave: `app_role` (admin, vendedor, supervisor), `interaction_result` (presupuesto, venta, seguimiento, sin_respuesta, no_interesado).

RPC functions: `get_dashboard_data()`, `get_user_role()`, `get_notifications_data()`, `request_account_deletion()`, `create_organization_with_admin(org_name)`.

Helper functions: `current_org_id()` — retorna el `organization_id` del usuario autenticado (usado en RLS y RPCs). `has_role(_user_id, _role)` — org-aware, filtra por `organization_id`.

**Multitenancy:** todas las tablas de datos tienen columna `organization_id UUID`. Las RLS policies filtran por `organization_id = current_org_id()`. El trigger `set_organization_id` auto-asigna el org_id en inserts. El trigger `handle_new_user` crea una organización nueva en cada signup.

Migraciones en `supabase/migrations/` (14 archivos). Las últimas:
- `20260610120000_add_monthly_target_to_profiles.sql` — agrega `monthly_target`
- `20260612000001_create_organizations.sql` — tabla organizations, columnas org_id, helpers
- `20260612000002_update_rls_multitenancy.sql` — RLS policies org-aware
- `20260612000003_update_rpcs_multitenancy.sql` — RPCs con filtro de org

**Supabase project ref:** `fkjuswkjzaeuogctsxpw` (sa-east-1). `supabase/seed.sql` tiene datos de ejemplo con UUIDs placeholder — reemplazar con UUIDs reales antes de usar en producción.

### Tests unitarios

Vitest + Testing Library. Setup en `src/test/setup.ts`. Tests de lógica pura no requieren mocks. Tests de hooks en `src/hooks/*.test.ts`. Helpers de render en `src/test/test-utils.tsx`.

`src/lib/brandColors.test.ts` es un guard de marca — falla si se introducen colores violeta/púrpura (`#8B2D6B`, `hsl(325`, etc.) en `constants.ts`, `index.css`, `index.html` o `manifest.json`. Correr antes de cambiar tokens de color.

### Tests E2E (Playwright)

Corren contra la app en demo mode (sin Supabase). Requieren el servidor de desarrollo activo en `http://localhost:8080`.

```
e2e/crm-flow.spec.ts             # flujo principal: crear cliente, interacción, verificar
e2e/crm-additional-flows.spec.ts # desactivar cliente, tipo de cambio
e2e/pom/CRMApp.ts               # Page Object Model — todos los selectores/acciones centralizados aquí
```

Para agregar casos: extender `CRMApp` con nuevos métodos en lugar de usar selectores ad-hoc en los specs.

## Deploy

- **Producción:** `crm.mejoraok.com` (Vercel, auto-deploy en push a main)
- **CI:** `.github/workflows/ci.yml` — lint → typecheck → test → build
- **Env vars en Vercel:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_DEMO_MODE=false`
- **Supabase Auth → URL Configuration:** Site URL debe ser `https://crm.mejoraok.com`

## Pendiente para próximas sesiones

### Infraestructura / assets
- [ ] Íconos PWA (`public/icons/icon-192.png`, `icon-512.png`) — reemplazar con logo MC real
- [ ] Favicon (`public/favicon.ico`) — reemplazar con logo MC
- [ ] `supabase/seed.sql` — actualizar UUIDs con los reales de producción (incluir organization_id)
- [ ] Google Calendar sync — registrar `VITE_GOOGLE_CLIENT_ID` en Google Cloud Console y configurar en Vercel
- [ ] Push notifications servidor — configurar VAPID keys en `src/lib/notifications.ts`

### UX/UI — Plan de 8 PRs (brief completo en memoria del proyecto)

**Completados:**
- [x] **PR2** — Auth split-screen + OnboardingWizard como Sheet lateral (commit `3d3fc9c`, en prod)

**Features PM entregadas (fuera del roadmap UX):**
- [x] Deal aging badge en InteractionCard (8-30d ámbar, >30d rojo) → ajustado a 48h/120h con tooltip
- [x] WhatsApp/email clickables en ClientDetailDialog → evolucionado a plantillas dinámicas
- [x] Dashboard: persistencia de período en localStorage, card "Activos fríos 30d+"
- [x] Pipeline Kanban en /interactions (toggle list/kanban) → con totales por moneda y sort financiero
- [x] Cuotas mensuales por vendedor (migration + Settings admin + dashboard progress bars)
- [x] **AGING_THRESHOLDS** en `constants.ts` (48h ámbar / 120h rojo) — centralizados y fáciles de ajustar
- [x] **Mi Foco de Hoy** (`FocusDayWidget.tsx`) — primera sección del dashboard vendedor, top 5 oportunidades priorizadas
- [x] **InteractionForm single-page** — wizard de 4 pasos reemplazado por formulario compacto en una pantalla, combobox de cliente con búsqueda
- [x] **WhatsApp Templates** (`WhatsAppTemplates.tsx`) — picker de plantillas dinámicas con variables de cliente/vendedor/monto; plantilla "SUGERIDA" según última interacción
- [x] **Multi-organización** — tabla `organizations`, RLS org-aware, `organizationId` en AuthContext, `useOrganization` hook, campo empresa en signup, card "Organización" en Settings (commit `dfa1b2a`, en prod)

**Pendientes UX (orden sugerido):**
- [ ] **PR1** — AppLayout max-w-screen-2xl, AppSidebar con grupos y collapse persistente, BottomNav pulido, CommandPalette con grupos
- [ ] **PR3** — Dashboard: grid 12-col, KPIs compactos con delta, funnel izq + seguimientos der, Recharts unificado, empty states
- [ ] **PR4** — Listados: toolbar unificada, tabla h-12 con bulk-actions, InfiniteScroll + contador, cards mobile con swipe
- [ ] **PR6** — Feedback: Toaster unificado, Skeletons revisados, ErrorBoundary con retry, NotificationsPanel por día
- [ ] **PR7** — Dark mode: auditar `.dark` en `:root`, switch en Settings
- [ ] **PR8** — Microinteracciones: transiciones 150ms, focus ring, loading buttons, PWAInstallBanner como toast

**Restricciones de marca (nunca tocar):**
- Tokens de color en `:root` de `src/index.css` y aliases `brand.*` en `tailwind.config.ts`
- Tipografías: League Spartan (display) y Bw Modelica (body)
- Logo, favicon y assets en `/assets/branding/`
- `--radius: 0.625rem` y sistema shadcn/ui

### Convenciones UX establecidas en este brief
- Una sola acción primaria por vista (navy sólido). Secundarias en outline navy.
- Amarillo (`accent`) solo como acento puntual — nunca botón estándar.
- Inputs `h-9` en toda la app.
- Sombras unificadas a `shadow-sm`.
- Focus: `ring-2 ring-ring ring-offset-2` en todos los interactivos.
- Transiciones: `150ms ease-out` hover/focus, `200ms` Sheet/Dialog.

## Directiva de Producto y Visión Comercial (Segunda Opinión)

Para maximizar el impacto de conversión del pipeline y eliminar fricción operativa de los vendedores, consultar el archivo detallado de especificaciones en:
*   [COMMERCIAL_ROADMAP.md](file:///C:/Github/MejoraCRM/COMMERCIAL_ROADMAP.md)

### Tareas Prioritarias de Negocio (estado):
1.  ~~**Rediseñar el Formulario de Interacciones**~~ ✅ entregado 2026-06-11
2.  ~~**Visibilidad Financiera en Kanban**~~ ✅ entregado 2026-06-11
3.  ~~**Ajuste del Deal Aging**~~ ✅ entregado 2026-06-11
4.  ~~**Automatización de WhatsApp**~~ ✅ entregado 2026-06-11

