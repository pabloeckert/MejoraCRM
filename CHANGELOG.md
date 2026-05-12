# Changelog — MejoraCRM

## 2026-05-13

### Auditoría Técnica Profunda ✅

**Fase 1: Análisis completo del código fuente**
- Revisión de ~75 archivos TS/TSX (~8,500 líneas)
- Documentación de toda la arquitectura del proyecto
- Identificación de 16 issues de deuda técnica (4 críticas, 4 altas, 4 medias, 4 bajas)
- Análisis de seguridad, rendimiento, testing
- Recomendaciones priorizadas para próximos pasos

**Archivos creados/actualizados:**
- `AUDITORIA-PROFUNDA.md` — Documento de análisis de 14KB
- `ESTADO-ACTUAL.md` — Actualizado con nuevo estado
- `CONTINUACION.md` — Actualizado con flag de continuación

### Fase 2: Fix Issues Críticos ✅

**Fix 1: CSV Parser robusto**
- Nuevo archivo: `src/lib/csvParser.ts`
- Parser correcto que maneja comillas, comas internas, quotes escapados
- UTF-8 BOM support
- Funciones helper: parseCSV, findHeader, getField
- 19 tests unitarios
- Migrados Clients.tsx y Products.tsx al nuevo parser
- Fix fileInputRef: useState → useRef en Clients.tsx

**Fix 2: Lazy loading de rutas**
- React.lazy + Suspense en App.tsx para todas las páginas
- Cada página es un chunk separado en el build
- PageLoader spinner para loading states

**Fix 3: Lógica de negocio compartida**
- Nuevo archivo: `src/lib/businessLogic.ts`
- 12 funciones puras y testables
- Elimina duplicación entre OwnerViewV2.tsx y Reports.tsx
- 18 tests unitarios

**Métricas:**
- Tests: 30 → 67 (+37 nuevos)
- Build: OK con chunks separados
- TypeScript: 0 errores

### Fase 4: Mejoras de Código ✅

**Refactor: Reports.tsx y OwnerViewV2.tsx**
- Migrados a usar businessLogic.ts
- Reports.tsx: 490L → ~320L (-170L)
- OwnerViewV2.tsx: ~400L → ~300L (-100L)
- Neto: -312 líneas de código duplicado eliminadas

**Error handling en páginas**
- Dashboard.tsx: estado de error con UI
- Interactions.tsx: estado de error con UI
- Clients.tsx: estado de error con UI
- Patrón consistente: AlertCircle + mensaje + botón reintentar

### Fase 5: Edición de Interacciones ✅

**Feature: CRUD completo de interacciones**
- InteractionForm: modo edición con prop 'interaction'
- Pre-fill de formulario con datos existentes
- Carga de líneas de productos existentes
- Mutación: INSERT (crear) / UPDATE (editar)
- Reemplazo de líneas: DELETE old + INSERT new
- InteractionCard: botón lápiz para editar
- Interactions.tsx: estado editingInteraction
- Wizard salta paso 'cliente' en edición (no se puede cambiar)

### Fase 7: Paginación Real ✅

**Feature: Infinite scroll en Clientes e Interacciones**
- InfiniteScrollTrigger.tsx: componente reutilizable con IntersectionObserver
- useClientsInfinite(): useInfiniteQuery con paginación de 50 registros
- useInteractionsInfinite(): useInfiniteQuery con paginación de 50 registros
- Auto-carga cuando el usuario scrollea cerca del final
- En modo DEMO: carga todo (sin paginación)
- Hooks originales mantenidos para compatibilidad

### DEMO_MODE Configurable ✅

**DEMO_MODE ahora es variable de entorno:**
- Lee `VITE_DEMO_MODE` env var (default: true)
- Para activar Supabase real: `VITE_DEMO_MODE=false`
- .env.example actualizado
- SETUP.md actualizado

### Tests Ampliados (67 → 87) ✅

**Nuevos archivos de test:**
- `src/lib/constants.test.ts` — 14 tests (status, channels, rubros, provincias, units, currencies, brand colors)
- `src/components/interactions/InteractionCard.test.ts` — 6 tests (exports, consistencia)

---

## 2026-05-12

### Sesión completa: Sprints 1, 2 y 3 parcial

**Sprint 1 — Identidad y Lenguaje** ✅
- Paleta MC 2026: púrpura #8B2D6B, dorado #F2BC1B, blanco puro
- Logo MC isotipo en sidebar
- Tipografía: Bw Modelica + Inter (Google Fonts)
- Pipeline eliminado de sidebar y rutas
- Lenguaje humano en toda la app

**Sprint 2 — Core de Interacciones** ✅
- InteractionForm → wizard 4 pasos (Cliente → Resultado → Detalles → Medio)
- Filtros de período en Interacciones (hoy/semana/mes/trimestre/semestre/año)
- CSV import en Productos con plantilla descargable
- Upload de proforma (JPG/PNG/PDF drag & drop)
- Validaciones: loss_reason obligatorio, followup_scenario obligatorio

**Sprint 3 — Conexión y Producción** 🔄
- Tests unitarios: 30 tests (Vitest + Testing Library)
- CI/CD: GitHub Actions (lint → typecheck → test → build)
- WhatsApp link generator
- Pendiente: Supabase real, Google Calendar, Excel export

Commits: `90e238c` → `27cd6d7` (9 commits)

---

## 2026-05-05

### Limpieza del repositorio
**Commit:** `de801f3` — cleanup: remove unused files for Vercel deploy

Archivos eliminados:
- `MejoraCRM-P0-fixes.zip` — ZIP suelto en el repo
- `.github/workflows/deploy.yml` — deploy FTP a crm.mejoraok.com (reemplazado por Vercel)
- `public/.htaccess` — config Apache (Vercel maneja SPA routing automáticamente)
- `src/demo/demoData.ts` — **tenía contraseñas hardcodeadas** (riesgo de seguridad)
- `src/test/example.test.ts`, `src/test/setup.ts` — tests de ejemplo
- `src/lib/__tests__/` — tests de calculations, schemas, utils
- `src/components/__tests__/ErrorBoundary.test.tsx` — test de ErrorBoundary
- `vitest.config.ts` — config de testing

Dependencias eliminadas de `package.json`:
- `vitest`, `@testing-library/jest-dom`, `@testing-library/react`, `jsdom`

Scripts eliminados: `test`, `test:watch`

URLs actualizadas:
- `src/pages/Terms.tsx` — crm.mejoraok.com → mejoracrm.vercel.app
- `src/pages/Privacy.tsx` — crm.mejoraok.com → mejoracrm.vercel.app

### Modo Demo (bypass login)
**Commit:** `4721d58` — feat: add demo mode — bypass login with mock data

Archivos creados:
- `src/demo/demoData.ts` — datos mock: 8 clientes, 19 interacciones, 5 productos, 2 perfiles
- `src/components/DemoRoleToggle.tsx` — botón toggle Dueño/Vendedor en el header

Archivos modificados:
- `src/contexts/AuthContext.tsx` — flag `DEMO_MODE = true`, auto-login con usuario mock, soporte para cambio de rol
- `src/hooks/useDashboard.ts` — retorna datos demo cuando `DEMO_MODE = true`
- `src/hooks/useClients.ts` — idem
- `src/hooks/useInteractions.ts` — idem
- `src/hooks/useProducts.ts` — idem
- `src/hooks/useProfiles.ts` — idem
- `src/hooks/useNotifications.ts` — idem
- `src/App.tsx` — sin cambios funcionales (AuthProvider ya maneja demo mode)
- `src/components/AppLayout.tsx` — agrega DemoRoleToggle en el header

### Deploy a Vercel
- Proyecto: `mejoracrm` en cuenta `mejoraok-7590s-projects`
- Dominio: https://mejoracrm.vercel.app
- Env vars configuradas en Vercel:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- Tokens almacenados fuera del repo (ver prompt de sesión)

### Estado actual
- **DEMO_MODE = true** en `src/contexts/AuthContext.tsx`
- Login deshabectivado, se entra directo al dashboard
- Toggle Dueño/Vendedor funcional en el header
- Datos mock reales (nombres argentinos, montos en ARS/USD, provincias reales)
- Para activar Supabase real: cambiar `DEMO_MODE` a `false` y las queries vuelven a Supabase

---

## Próximos pasos sugeridos
1. Cargar datos reales en Supabase (correr migraciones + seed)
2. Cambiar `DEMO_MODE` a `false` cuando las credenciales estén configuradas
3. Configurar dominio personalizado en Vercel (si se quiere)
4. Agregar tests y CI/CD pipeline
