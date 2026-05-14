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

Copiar `.env.example` → `.env` y completar:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
VITE_DEMO_MODE=true   # false para conectar Supabase real
```

Con `VITE_DEMO_MODE=true` (valor por defecto), la app carga datos de `src/demo/demoData.ts` sin necesitar credenciales Supabase.

## Arquitectura general

**Stack:** React 18 + TypeScript + Vite · Supabase (Auth + PostgreSQL) · TanStack Query · shadcn/ui + Tailwind · Recharts · Vitest

**Path alias:** `@/` apunta a `src/`.

### Flujo de autenticación y roles

`AuthContext` (`src/contexts/AuthContext.tsx`) es el núcleo de auth. Expone `user`, `session`, `role` (`admin` | `vendedor`) y `profile`. Todos los hooks de datos lo consumen para saber si están en demo mode.

- En **demo mode** (`DEMO_MODE = true`), el contexto inyecta un usuario ficticio y devuelve datos de `src/demo/demoData.ts`. No se hace ninguna llamada a Supabase.
- En **modo real**, llama a `supabase.rpc("get_user_role")` para obtener el rol del usuario desde la DB.

El sidebar (`AppSidebar`) filtra items según `role`: las rutas `/reports`, `/products`, `/whatsapp-link`, `/settings` solo son visibles para `admin`/`supervisor`.

### Patrón de hooks de datos

Cada hook de datos (ej. `useClients`, `useInteractions`, `useDashboard`) sigue el mismo patrón:

```ts
if (DEMO_MODE) return DEMO_DATA;
// else → llamada a Supabase
```

Esto permite desarrollar sin credenciales y correr tests sin mocks de Supabase.

- **Dashboard:** usa `supabase.rpc("get_dashboard_data")` — una sola llamada RPC que retorna interacciones, clientes y perfiles juntos.
- **Interacciones:** paginación infinita con `useInfiniteQuery`, 50 registros por página (`src/hooks/useInteractions.ts`).

### Lógica de negocio

`src/lib/businessLogic.ts` contiene **funciones puras** para calcular KPIs, rankings, tendencias y agrupaciones. No tiene side effects ni llama a Supabase. Es el archivo más testeable del proyecto.

`src/lib/constants.ts` es la única fuente de verdad para labels, estilos CSS, enums y opciones de formularios (rubros, provincias, países, monedas, etc.).

### Tipos

- `src/integrations/supabase/types.ts` — generado automáticamente desde el schema de Supabase. **No editar a mano.**
- `src/lib/types.ts` — tipos de aplicación que componen sobre los de Supabase (ej. `Interaction` extiende la row de DB con los joins de `clients` e `interaction_lines`).

### Validación de formularios

`src/lib/schemas.ts` define los schemas Zod para formularios. Los enums (`interaction_result`, `interaction_medium`) se importan directamente desde `Constants` del tipo generado de Supabase para mantener sincronía.

### Base de datos

Migraciones en `supabase/migrations/`. Las tablas principales son:

- `clients` — clientes con provincia, segmento (rubro), país, estado
- `interactions` — interacciones con resultado (`venta`, `presupuesto`, `seguimiento`, `sin_respuesta`, `no_interesado`), medio, moneda y monto
- `interaction_lines` — líneas de productos dentro de una interacción (many-to-many con `products`)
- `products` — catálogo de productos/servicios con unidad y precio
- `profiles` — perfil de cada usuario con rol (`app_role` enum: `admin`, `vendedor`)

RPC functions de Supabase usadas: `get_dashboard_data`, `get_user_role`.

### Tests

Vitest + Testing Library. Setup en `src/test/setup.ts` (solo importa `@testing-library/jest-dom/vitest`). Los tests de lógica pura (businessLogic, calculations, constants, schemas, csvParser) no requieren mocks. Los tests de componentes usan helpers en `src/test/test-utils.tsx`.
