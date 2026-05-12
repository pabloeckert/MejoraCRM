# ESTADO-ACTUAL.md — Estado del Proyecto al 2026-05-13

Última sesión: 2026-05-13 04:39 GMT+8
Agente: Pepe (OpenClaw)
Usuario: Pablo

---

## Estado del Repo

- **Branch:** main
- **Último commit:** `d52d786` — fix: InteractionForm use setValue instead of control._formValues hack
- **Remote:** origin/main — sincronizado ✅
- **Commits totales:** 20+

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

## Archivos Clave
- `CTO.md` — documentación técnica completa
- `CHANGELOG.md` — historial de cambios
- `SPRINT-1.md` — detalle sprint 1
- `SETUP.md` — guía de setup
- `.env.example` — template de variables de entorno

## Próximos Pasos
1. Configurar Supabase real (correr migraciones + seed)
2. Cambiar DEMO_MODE a false
3. Configurar dominio crm.mejoraok.com en Vercel
4. Google Calendar integration
5. Tests E2E (Playwright o similar)

## Notas para Continuación
- El token de GitHub fue compartido en chat — debe ser revocado y reemplazado
- Las credenciales de git NO quedaron guardadas en el server (se limpiaron después del push)
- Para futuros pushes autónomos: Pablo debe configurar `git config credential.helper store` en el server
- MejoraCRM tiene node_modules excluido del repo — ejecutar `bun install` después de clonar
