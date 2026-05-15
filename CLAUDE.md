# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
bun install          # instalar dependencias
bun dev              # servidor de desarrollo en http://localhost:8080
bun build            # build de producción
bun lint             # ESLint
bun test             # tests (Vitest, modo CI)
bun test:watch       # tests en modo watch interactivo
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

El sidebar filtra ítems según `role`: `/reports`, `/products`, `/whatsapp-link`, `/settings` solo visibles para `admin`/`supervisor`.

### Patrón de hooks de datos

Cada hook sigue el mismo patrón:
```ts
if (DEMO_MODE) return DEMO_DATA;
// else → Supabase
```

- **Dashboard:** `supabase.rpc("get_dashboard_data")` — una sola llamada que retorna interacciones, clientes y perfiles.
- **Interacciones:** paginación infinita con `useInfiniteQuery`, 50 registros por página.
- **Clientes:** paginación infinita igual.

### Estructura de páginas y subcomponentes

Las páginas grandes están descompuestas en subcomponentes:

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
  InteractionCard.tsx          → card con edit + delete inline
```

### Lógica de negocio

`src/lib/businessLogic.ts` — funciones puras para KPIs, rankings, tendencias. Testeable sin mocks.

`src/lib/constants.ts` — fuente única de verdad para labels, estilos, enums, colores de brand y chart, opciones de formularios.

### Tipos

- `src/integrations/supabase/types.ts` — generado automáticamente. **No editar.**
- `src/lib/types.ts` — tipos de app que componen sobre los de Supabase.

### Base de datos

Tablas principales: `clients`, `interactions`, `interaction_lines`, `products`, `profiles`.

Enums clave: `app_role` (admin, vendedor, supervisor), `interaction_result` (presupuesto, venta, seguimiento, sin_respuesta, no_interesado).

RPC functions: `get_dashboard_data()`, `get_user_role()`, `request_account_deletion()`.

Migraciones en `supabase/migrations/` (10 archivos). `supabase/seed.sql` tiene datos de ejemplo con UUIDs placeholder — reemplazar con UUIDs reales antes de usar en producción.

### Tests

Vitest + Testing Library. Setup en `src/test/setup.ts`. Tests de lógica pura no requieren mocks. Tests de hooks en `src/hooks/*.test.ts`.

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
