# ESTADO-ACTUAL.md — Estado del Proyecto al 2026-05-13

Última sesión: 2026-05-13 06:38 GMT+8
Agente: OpenClaw
Usuario: Pablo

---

## Estado del Repo

- **Branch:** main
- **Último commit remoto:** `dffbd46` — feat: error handling en páginas principales
- **Remote:** origin/main — sincronizado ✅
- **Commits totales:** 26+

## Trabajo Realizado (Esta Sesión)

### Fase 1: Auditoría Técnica Profunda ✅
- Análisis completo de todo el código fuente (~75 archivos, ~8,500 líneas)
- Documentación de arquitectura, módulos, base de datos
- Identificación de deuda técnica (16 issues)
- Análisis de seguridad, rendimiento, testing
- Recomendaciones priorizadas para próximos pasos
- **Archivo creado:** `AUDITORIA-PROFUNDA.md`

### Fase 2: Fix Issues Críticos ✅
- **CSV Parser robusto** — `src/lib/csvParser.ts` (19 tests)
- **Lazy loading de rutas** — React.lazy + Suspense en App.tsx
- **Lógica de negocio compartida** — `src/lib/businessLogic.ts` (18 tests)
- **Tests:** 30 → 67 (+37 nuevos)

### Fase 4: Mejoras de Código ✅
- **Reports.tsx** migrado a businessLogic.ts (490L → ~320L)
- **OwnerViewV2.tsx** migrado a businessLogic.ts (~400L → ~300L)
- **Error handling** en Dashboard, Interactions, Clients
- **Neto:** -312 líneas de código duplicado eliminadas

## Sprints Completados

### Sprint 1 — Identidad y Lenguaje ✅
- Paleta MC 2026: púrpura #8B2D6B, dorado #F2BC1B
- Logo MC en sidebar
- Tipografía: Bw Modelica + Inter
- Pipeline eliminado de sidebar y rutas
- Lenguaje humano en toda la app

### Sprint 2 — Core de Interacciones ✅
- InteractionForm wizard 4 pasos
- Filtros de período
- CSV import en Productos
- Upload de proforma

### Sprint 3 — Conexión y Producción 🔄
- Tests unitarios: 30 tests ✅
- CI/CD: GitHub Actions ✅
- WhatsApp link generator ✅
- Exportación Excel ✅
- **Pendiente:** Supabase real, Google Calendar

## Stack Técnico
- Frontend: React 18 + TypeScript + Vite
- UI: Tailwind CSS + shadcn/ui
- Backend: Supabase (Auth + PostgreSQL + RLS)
- Deploy: Vercel → mejoracrm.vercel.app
- Dominio prod: crm.mejoraok.com (pendiente configurar)
- Package Manager: Bun

## Modo Actual
- **DEMO_MODE = true** (en `src/contexts/AuthContext.tsx`)
- Login bypass con datos mock
- Toggle Dueño/Vendedor en header

## Deuda Técnica Crítica
1. ~~CSV parser roto~~ ✅ RESUELTO (src/lib/csvParser.ts)
2. Sin paginación real (carga todo en memoria)
3. Sin edición de interacciones (solo crear)
4. DEMO_MODE hardcodeado (debe ser env var)
5. ~~Archivos monolíticos~~ ✅ PARCIAL (Reports y OwnerViewV2 reducidos, Clients y InteractionForm pendientes)
6. ~~Cálculos duplicados~~ ✅ RESUELTO (src/lib/businessLogic.ts)
7. ~~Sin error handling~~ ✅ RESUELTO (UI de error en páginas principales)

## Archivos Clave
- `AUDITORIA-PROFUNDA.md` — Análisis completo (NUEVO)
- `CTO.md` — Documentación técnica completa
- `CHANGELOG.md` — Historial de cambios
- `SPRINT-1.md` — Detalle sprint 1
- `SETUP.md` — Guía de setup
- `.env.example` — Template de variables de entorno

## Próximos Pasos (Priorizado)
1. ~~Fix CSV parser~~ ✅
2. ~~Lazy loading de rutas~~ ✅
3. ~~Extraer cálculos compartidos~~ ✅
4. ~~Descomponer Reports y OwnerViewV2~~ ✅
5. ~~Error handling en páginas~~ ✅
6. Edición de interacciones (CRUD completo)
7. Conectar Supabase real (credenciales + migraciones)
8. Google Calendar sync
9. Paginación real

## Notas para Continuación
- Git configurado pero sin credenciales de push
- Para pushes autónomos: Pablo debe configurar acceso al repo
- `bun install` después de clonar (node_modules excluido del repo)
