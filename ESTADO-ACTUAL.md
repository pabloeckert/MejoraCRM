# ESTADO-ACTUAL.md — Estado del Proyecto al 2026-05-13

Última sesión: 2026-05-13 06:38 GMT+8
Agente: OpenClaw
Usuario: Pablo

---

## Estado del Repo

- **Branch:** main
- **Último commit remoto:** `6399597` — refactor: extraer lógica de negocio compartida
- **Remote:** origin/main — sincronizado ✅
- **Commits totales:** 23+

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
  - Maneja comillas, comas internas, quotes escapados, UTF-8 BOM
  - Migrados Clients.tsx y Products.tsx
- **Lazy loading de rutas** — React.lazy + Suspense en App.tsx
  - Cada página es un chunk separado
- **Lógica de negocio compartida** — `src/lib/businessLogic.ts` (18 tests)
  - 12 funciones puras: KPIs, tendencias, rankings, filtros
  - Elimina duplicación OwnerViewV2/Reports
- **Tests:** 30 → 67 (+37 nuevos)
- **Build:** OK, pages como chunks separados

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
5. Archivos monolíticos (Clients 578L, Reports 490L, InteractionForm 400+L, OwnerViewV2 400+L)
6. ~~Cálculos duplicados~~ ✅ RESUELTO (src/lib/businessLogic.ts)

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
4. Descomponer archivos monolíticos (Clients, Reports, InteractionForm, OwnerViewV2)
5. Conectar Supabase real (credenciales + migraciones)
6. Edición de interacciones
7. Google Calendar sync

## Notas para Continuación
- Git configurado pero sin credenciales de push
- Para pushes autónomos: Pablo debe configurar acceso al repo
- `bun install` después de clonar (node_modules excluido del repo)
