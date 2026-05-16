# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
bun install          # instalar dependencias
bun dev              # servidor de desarrollo en http://localhost:8080
bun build            # build de producción
bun preview          # preview del build de producción
bun lint             # ESLint
bun test             # tests (Vitest, modo CI — run once)
bun test:watch       # tests en modo watch interactivo
bun x tsc --noEmit  # typecheck (no hay script dedicado en package.json)
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
VITE_DEMO_MODE=true   # false para conectar Supabase real
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

`AuthContext` (`src/contexts/AuthContext.tsx`) expone `user`, `session`, `role` (`admin` | `vendedor`) y `profile`. En **demo mode** inyecta un usuario ficticio y devuelve datos de `src/demo/demoData.ts` sin llamar a Supabase.

El sidebar (`src/components/AppSidebar.tsx`) filtra ítems según `role` — cada ítem puede tener un array `roles: ["admin", "supervisor"]`; si el campo está ausente, el ítem es visible para todos. Rutas admin-only: `/reports`, `/products`, `/whatsapp-link`, `/settings`.

En demo mode, `DemoRoleToggle` aparece en el header para cambiar entre `admin` y `vendedor` en caliente. El estado se guarda internamente en `AuthContext` vía `demoRole`.

### Patrón de hooks de datos

Cada hook sigue el mismo patrón:
```ts
if (DEMO_MODE) return DEMO_DATA;
// else → Supabase
```

- **Dashboard:** `supabase.rpc("get_dashboard_data")` — una sola llamada que retorna interacciones, clientes y perfiles.
- **Interacciones:** paginación infinita con `useInfiniteQuery`, 50 registros por página.
- **Clientes:** paginación infinita igual.
- **Notificaciones:** `supabase.rpc("get_notifications_data")` — seguimientos vencidos y próximos.

TanStack Query global: `staleTime: 30_000`, `refetchOnWindowFocus: false`, `retry: 1`.

**Query keys en uso:**
- `["clients-infinite", "demo" | "live"]`
- `["clients", "demo" | "live"]` — lista completa (useAllClients)
- `["clients-min", "demo" | "live"]` — id+name mínimo
- `["interactions-infinite", "demo" | "live"]`
- `["dashboard-data"]`
- `["products", ...]`, `["notifications"]`, `["profiles"]`

Las mutaciones invalidan todas las query keys relacionadas (ej. deactivateClient invalida `clients`, `clients-infinite` y `dashboard-data`).

Las páginas de infinite query se aplanan con `flattenClientPages(data)` / `flattenInteractionPages(data)` antes de renderizar. `InfiniteScrollTrigger` (`src/components/InfiniteScrollTrigger.tsx`) dispara `fetchNextPage` vía IntersectionObserver.

### Estructura de páginas y subcomponentes

Todas las páginas se cargan con `React.lazy` + `Suspense` (code splitting automático).

```
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
  InteractionCard.tsx          → card con edit + delete inline
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
- `src/lib/types.ts` — tipos de app que componen sobre los de Supabase. `Interaction` incluye joins de `clients` e `interaction_lines`.

### Funcionalidades globales de la app

- **CommandPalette** (`src/components/CommandPalette.tsx`): abre con `Ctrl+K` / `Cmd+K`. Busca clientes e interacciones en tiempo real, y permite navegar a cualquier sección.
- **OnboardingWizard** (`src/components/OnboardingWizard.tsx`): se muestra al primer ingreso. Persiste el estado en `localStorage` bajo la clave `onboarding_dismissed`.
- **ThemeProvider**: usa `next-themes`, tema por defecto `light`, con soporte `system`.
- **PWA**: hay service worker + `PWAInstallBanner`. Los íconos (`public/icons/`) son placeholders — reemplazar con logo MC real.
- **Drag & Drop**: `@dnd-kit/core` + `@dnd-kit/sortable` disponibles (en uso en alguna vista de productos).

### Base de datos

Tablas principales: `clients`, `interactions`, `interaction_lines`, `products`, `profiles`.

Enums clave: `app_role` (admin, vendedor, supervisor), `interaction_result` (presupuesto, venta, seguimiento, sin_respuesta, no_interesado).

RPC functions: `get_dashboard_data()`, `get_user_role()`, `get_notifications_data()`, `request_account_deletion()`.

Migraciones en `supabase/migrations/` (10 archivos). `supabase/seed.sql` tiene datos de ejemplo con UUIDs placeholder — reemplazar con UUIDs reales antes de usar en producción.

### Tests

Vitest + Testing Library. Setup en `src/test/setup.ts`. Tests de lógica pura no requieren mocks. Tests de hooks en `src/hooks/*.test.ts`. Helpers de render en `src/test/test-utils.tsx`.

## Deploy

- **Producción:** `crm.mejoraok.com` (Vercel, auto-deploy en push a main)
- **CI:** `.github/workflows/ci.yml` — lint → typecheck → test → build
- **Env vars en Vercel:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_DEMO_MODE=false`
- **Supabase Auth → URL Configuration:** Site URL debe ser `https://crm.mejoraok.com`

## Pendiente para próximas sesiones

- [ ] Íconos PWA (`public/icons/icon-192.png`, `icon-512.png`) — reemplazar con logo MC real
- [ ] Favicon (`public/favicon.ico`) — reemplazar con logo MC
- [ ] `supabase/seed.sql` — actualizar UUIDs con los reales de producción
- [ ] Tests E2E (Playwright) — login → cliente → interacción → verificar
- [ ] Google Calendar sync — requiere OAuth en Google Cloud Console
- [ ] Push notifications servidor — configurar VAPID keys en `src/lib/notifications.ts`
