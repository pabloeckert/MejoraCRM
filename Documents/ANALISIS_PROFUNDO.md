# MejoraCRM — Análisis Profundo Multidisciplinario

> **Documento vivo.** Cuando el agente reciba la instrucción "documentar", actualizará este archivo con los trabajos realizados, decisiones tomadas y cambios aplicados.

**Fecha:** 2026-04-24
**Repo:** [github.com/pabloeckert/MejoraCRM](https://github.com/pabloeckert/MejoraCRM)
**Producción:** [crm.mejoraok.com](https://crm.mejoraok.com)
**Stack:** React 18 + TypeScript + Vite + Supabase (Auth + PostgreSQL) + Tailwind/shadcn

---

## Índice General

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Área Técnica](#2-área-técnica)
3. [Área de Producto y Gestión](#3-área-de-producto-y-gestión)
4. [Área Comercial y de Crecimiento](#4-área-comercial-y-de-crecimiento)
5. [Área de Operaciones, Legal y Análisis](#5-área-de-operaciones-legal-y-análisis)
6. [Plan Optimizado por Etapas](#6-plan-optimizado-por-etapas)
7. [Registro de Cambios](#7-registro-de-cambios)

---

## 1. Resumen Ejecutivo

### ¿Qué es MejoraCRM?

CRM web para gestión de clientes, interacciones comerciales y productos, desarrollado por **Mejora Continua®**. Orientado a equipos de ventas en el sector forestal/agropecuario argentino. Producción en `crm.mejoraok.com`.

### Estado Actual

| Dimensión | Score | Estado |
|-----------|-------|--------|
| Funcionalidad core | 8/10 | ✅ CRUD completo de clientes, interacciones, productos, dashboard |
| Arquitectura | 6/10 | 🟡 Monolito SPA, sin capa API, depende 100% de Supabase |
| Seguridad | 7/10 | 🟡 RLS activo, endurecido, pero sin rate limiting ni auditoría |
| Performance | 7/10 | 🟡 Optimizado recientemente (índices, RPC, code splitting) |
| Testing | 2/10 | 🔴 Solo un test placeholder, sin cobertura real |
| UX/UI | 7/10 | 🟡 Limpio, funcional, pero sin onboarding ni i18n |
| DevOps | 5/10 | 🟡 CI/CD funciona pero vía FTP, sin staging ni monitoring |
| Documentación | 8/10 | ✅ Consolidada en Documents/, schema actualizado |
| Mobile | 1/10 | 🔴 Sin app nativa, sin PWA, responsive limitado |
| Escalabilidad | 4/10 | 🔴 Queries sin paginación, sin caché distribuido, sin CDN |

### Hallazgos Críticos (Top 5)

1. **Sin testing automatizado** — 0% cobertura real, deploy sin validación
2. **Queries sin paginación** — Dashboard y NotificationsPanel cargan TODOS los registros
3. **Sin app móvil** — CRM sin móvil es limitante para vendedores en campo
4. **FTP deploy** — Sin rollback, sin staging, sin preview de PRs
5. **Componentes monolíticos** — Dashboard.tsx (821 líneas), Interactions.tsx (864 líneas)

---

## 2. Área Técnica

### 2.1 Software Architect

**Arquitectura actual:** SPA monolítica → Supabase BaaS

```
┌─────────────┐     ┌─────────────────┐
│   React SPA │────▶│   Supabase Cloud │
│  (Vite SSR  │     │  Auth + PostgREST│
│   none)     │     │  + PostgreSQL    │
└─────────────┘     └─────────────────┘
       │
       ▼
  crm.mejoraok.com
  (FTP deploy)
```

**Evaluación:**

| Aspecto | Estado | Comentario |
|---------|--------|------------|
| Separación de capas | 🟡 | No hay capa API propia; el frontend habla directo con PostgREST |
| Acoplamiento | 🔴 | 100% acoplado a Supabase; migrar requiere reescritura total |
| Patrón de estado | ✅ | TanStack Query + Context es correcto para este tamaño |
| Routing | ✅ | React Router v6 con guards por rol, bien estructurado |
| Code splitting | ✅ | Manual chunks configurados (máx 384KB) |
| Error handling | 🟡 | Toast en mutaciones, pero sin error boundaries globales |
| Logging/Monitoring | 🔴 | Sin herramientas de observabilidad |

**Recomendaciones arquitectónicas:**

1. **Corto plazo:** Agregar error boundaries por ruta y un logger (Sentry o similar)
2. **Mediano plazo:** Considerar una Edge Functions layer en Supabase para lógica de negocio compleja
3. **Largo plazo:** Evaluar si la dependencia total de Supabase es aceptable o si se necesita abstracción

---

### 2.2 Cloud Architect

**Infraestructura actual:**

| Componente | Servicio | Región | Costo estimado |
|------------|----------|--------|----------------|
| Frontend | Hosting compartido (FTP) | — | ~$2-5/mes |
| Backend | Supabase Cloud (Free/Pro) | — | $0-25/mes |
| Base de datos | PostgreSQL (Supabase) | — | Incluido |
| Auth | Supabase Auth | — | Incluido |
| DNS | Subdominio crm.mejoraok.com | — | — |
| CI/CD | GitHub Actions | — | Gratis (minutos) |
| CDN | Ninguno | — | — |

**Evaluación:**

| Aspecto | Estado | Comentario |
|---------|--------|------------|
| Multi-región | 🔴 | Single-region, sin redundancia |
| CDN | 🔴 | Sin CDN, assets servidos desde hosting compartido |
| Backup | 🟡 | Supabase maneja backups automáticos (plan Pro) |
| Escalabilidad horizontal | 🔴 | Hosting FTP no escala; Supabase sí |
| Disaster recovery | 🟡 | Depende del plan de Supabase |
| Costo/eficiencia | ✅ | Muy bajo costo para el volumen actual |
| SSL/TLS | ✅ | Supabase + hosting con HTTPS |

**Recomendaciones:**

1. **Migrar deploy de FTP a Vercel/Cloudflare Pages** — Preview de PRs, rollback automático, CDN global
2. **Habilitar Supabase Pro** si el volumen crece (backups diarios, mayor pool de conexiones)
3. **Considerar Cloudflare R2** para almacenamiento de adjuntos (presupuestos PDF)

---

### 2.3 Backend Developer

**Backend = Supabase (BaaS). No hay código backend propio.**

**Evaluación del schema SQL:**

| Aspecto | Estado | Comentario |
|---------|--------|------------|
| Normalización | ✅ | 3FN correcto, relaciones bien definidas |
| Enums | ✅ | 8 enums bien diseñados, cubren los casos de uso |
| Índices | ✅ | 11 índices, incluyendo parcial y compuesto |
| Funciones SQL | ✅ | 5 funciones + 3 RPCs optimizadas |
| Vistas materializadas | ✅ | 2 vistas (seller ranking, client summary) con cron de refresh |
| Triggers | ✅ | `updated_at` automático, `handle_new_user` en signup |
| RLS | ✅ | 22+ políticas, endurecidas, granulares por operación |
| Migraciones | 🟡 | Archivos en `supabase/migrations/` pero sin sistema formal de versionado |

**Problemas identificados:**

1. **`calculate_client_status()` no se usa** — Existe pero nunca se invoca desde el frontend
2. **RPCs creadas pero no adoptadas** — `get_dashboard_data()` y `get_notifications_data()` existen pero el frontend usa queries directas
3. **Sin paginación en queries** — `select("*")` sin `range()` ni cursor
4. **Sin soft delete** — Los DELETE son permanentes
5. **Sin audit log** — No se registra quién hizo qué

**Recomendaciones:**

1. Adoptar las RPCs existentes en el frontend (ya están creadas, solo falta integrarlas)
2. Implementar paginación con cursor en todas las listas
3. Agregar campo `deleted_at` para soft delete en clients e interactions
4. Crear tabla `audit_log` con trigger en tablas críticas

---

### 2.4 Frontend Developer

**Stack:** React 18 + TypeScript + Vite 6 + Tailwind 3 + shadcn/ui

**Evaluación por componente:**

| Componente | Líneas | Estado | Problemas |
|------------|--------|--------|-----------|
| Dashboard.tsx | 821 | 🟡 | Monolítico, toda la lógica en un archivo, `any` types |
| Clients.tsx | 730 | 🟡 | CRUD completo pero sin paginación, `any` types |
| Interactions.tsx | 864 | 🟡 | Formulario complejo sin react-hook-form, `any` types |
| Products.tsx | 312 | ✅ | Bien estructurado, el más limpio |
| Settings.tsx | 195 | ✅ | Simple, funcional, localStorage para persistencia |
| Auth.tsx | 122 | ✅ | Limpio, correcto |
| AuthContext.tsx | 84 | ✅ | Bien diseñado, paraleliza queries |
| NotificationsPanel.tsx | 167 | 🟡 | Duplica queries del Dashboard |

**Problemas transversales:**

| Problema | Impacto | Frecuencia |
|----------|---------|------------|
| Uso extensivo de `any` | 🔴 | ~50+ ocurrencias |
| Componentes >500 líneas | 🟡 | 3 de 7 páginas |
| Sin custom hooks para datos | 🟡 | Queries duplicadas entre componentes |
| Sin form library | 🟡 | Validación manual en cada formulario |
| Sin error boundaries | 🔴 | Un error crashea toda la app |
| Labels hardcodeados en español | 🟡 | Imposible traducir sin reescribir |
| Sin skeleton loading states | 🟡 | Solo spinner genérico en Auth |
| `localStorage` para settings | 🟡 | No se sincroniza entre dispositivos |

**Recomendaciones:**

1. Extraer custom hooks: `useClients()`, `useInteractions()`, `useProducts()`
2. Adoptar react-hook-form + zod para formularios
3. Dividir Dashboard.tsx en sub-componentes (`KPICards`, `SellerRanking`, `Charts`)
4. Reemplazar `any` con tipos derivados de `Database["public"]["Tables"]`
5. Agregar ErrorBoundary global en App.tsx

---

### 2.5 iOS Developer / Android Developer

**Estado actual: 0% nativo.**

No existe app móvil. El CRM es una SPA web accesible desde el navegador del teléfono.

**Evaluación de mobile-web:**

| Aspecto | Estado | Comentario |
|---------|--------|------------|
| Responsive design | 🟡 | Tailwind permite responsive, pero no fue diseñado mobile-first |
| Touch targets | 🟡 | Botones de 36px (mínimo recomendado: 44px) |
| Performance en móvil | 🔴 | Bundle de ~500KB+ en JS, carga lenta en 3G |
| Offline support | 🔴 | Sin Service Worker, sin caché |
| Push notifications | 🔴 | No implementadas |
| Acceso a cámara | 🔴 | No hay upload de fotos (presupuestos, productos) |
| Biometría | 🔴 | Solo email/password |

**Opciones para móvil:**

| Opción | Esfuerzo | Costo | Recomendación |
|--------|----------|-------|---------------|
| PWA (Progressive Web App) | 🟢 Bajo | Bajo | ✅ **Recomendado como primer paso** |
| React Native + Expo | 🟡 Medio | Medio | Para v2 si se necesita cámara/offline |
| Flutter | 🔴 Alto | Alto | No justificado para este proyecto |
| Capacitor/Ionic | 🟢 Bajo | Bajo | Alternativa a PWA con más acceso nativo |

**Recomendación inmediata:** Convertir a PWA con Service Worker + manifest.json. Cubre 80% de las necesidades mobile con ~20% del esfuerzo.

---

### 2.6 DevOps Engineer

**CI/CD actual:**

```yaml
Trigger: push to main
Steps: checkout → setup bun → install → build → FTP deploy
Deploy target: crm.mejoraok.com (FTP)
```

**Evaluación:**

| Aspecto | Estado | Comentario |
|---------|--------|------------|
| Build automatizado | ✅ | GitHub Actions funciona |
| Deploy automático | ✅ | Cada push a main → producción |
| Staging environment | 🔴 | No existe |
| Preview de PRs | 🔴 | No existe |
| Rollback | 🔴 | FTP no permite rollback fácil |
| Testing en CI | 🔴 | No se ejecutan tests |
| Linting en CI | 🔴 | No se ejecuta lint |
| Type checking en CI | 🔴 | No se ejecuta tsc |
| Environment separation | 🟡 | Un solo .env para dev y prod |
| Secrets management | ✅ | FTP creds en GitHub Secrets |
| Cache de dependencias | 🟡 | Bun es rápido pero sin cache de actions |

**Recomendaciones:**

1. **Agregar steps al CI:** `bun run lint` + `bun test` + `tsc --noEmit` antes del build
2. **Migrar de FTP a Vercel/Cloudflare Pages** — preview por PR, rollback instantáneo
3. **Crear environment `staging`** con su propio proyecto Supabase
4. **Agregar `bun run build --mode staging`** para builds diferenciados

---

### 2.7 Site Reliability Engineer (SRE)

**Observabilidad actual: NADA.**

| Capa | Herramienta | Estado |
|------|-------------|--------|
| Métricas de aplicación | — | 🔴 |
| Logging | console.log | 🔴 |
| Alertas | — | 🔴 |
| Tracing | — | 🔴 |
| Uptime monitoring | — | 🔴 |
| Error tracking | — | 🔴 |
| Performance monitoring | — | 🔴 |

**SLIs/SLOs sugeridos (si se establecen):**

| SLI | SLO | Método |
|-----|-----|--------|
| Disponibilidad | 99.5% | UptimeRobot / BetterStack |
| Latencia P95 | <2s | Supabase Dashboard + Sentry |
| Error rate | <1% | Sentry |
| Build success | >95% | GitHub Actions |

**Recomendaciones:**

1. **UptimeRobot o BetterStack** (gratis) — monitoreo de uptime con alertas
2. **Sentry** (plan gratuito) — error tracking + performance
3. **Supabase Dashboard** — métricas de queries, conexiones, storage
4. Crear runbook básico para incidentes comunes

---

### 2.8 Cybersecurity Architect

**Evaluación de seguridad:**

| Categoría | Estado | Detalle |
|-----------|--------|---------|
| Autenticación | ✅ | Supabase Auth con email/password |
| Autorización | ✅ | RLS con 22+ políticas granulares |
| Protección de datos | 🟡 | Datos en tránsito (HTTPS), reposo (Supabase) |
| Input validation | 🟡 | Frontend valida, pero no hay validación server-side |
| Rate limiting | 🔴 | No implementado (depende de Supabase tier) |
| CORS | ✅ | Supabase maneja CORS automáticamente |
| CSP | 🔴 | Sin Content Security Policy headers |
| XSS protection | 🟡 | React escapa por defecto, pero sin CSP |
| CSRF | ✅ | Supabase usa tokens, no cookies de sesión |
| Secrets exposure | ✅ | .env fuera de tracking, creds en GitHub Secrets |
| Audit trail | 🔴 | No se registra quién hizo qué |
| 2FA/MFA | 🔴 | No implementado |
| Session management | ✅ | Supabase maneja tokens JWT con expiración |
| Dependency vulnerabilities | ✅ | 0 vulnerabilidades conocidas |

**Riesgos identificados:**

1. **Sin rate limiting en Auth** — Vulnerable a brute-force de login
2. **Sin audit log** — Imposible rastrear cambios maliciosos o errores
3. **Sin CSP** — XSS persistente posible si se inyecta HTML
4. **Sin MFA** — Acceso con solo email/password
5. **RLS depende de `has_role()`** — Si esa función tiene bugs, toda la seguridad se compromete

**Recomendaciones:**

1. Habilitar MFA en Supabase Auth (disponible en Pro)
2. Agregar rate limiting vía Supabase Edge Functions o middleware
3. Implementar CSP headers en el hosting
4. Crear tabla `audit_log` con triggers
5. Considerar Auth0 o Clerk si se necesita más control

---

### 2.9 Data Engineer

**Pipeline de datos actual: NADA formal.**

El "pipeline" es: `Frontend → Supabase → PostgreSQL → Vistas materializadas (cron 30min)`

**Evaluación:**

| Aspecto | Estado | Comentario |
|---------|--------|------------|
| ETL/ELT | 🔴 | No existe |
| Data warehouse | 🔴 | No existe |
| Data lake | 🔴 | No existe |
| Orquestación | 🟡 | pg_cron para vistas materializadas |
| Calidad de datos | 🟡 | Validación mínima en frontend |
| Lineage | 🔴 | No se rastrea origen de datos |
| Backup strategy | 🟡 | Automático vía Supabase |

**Dato útil:** Las vistas materializadas (`mv_seller_ranking`, `mv_client_summary`) son un buen inicio para analytics precomputados.

**Recomendaciones:**

1. **Corto:** Usar las vistas materializadas existentes para reporting
2. **Mediano:** Si se necesita analytics avanzado, replicar a BigQuery/ClickHouse vía Supabase webhooks
3. **Largo:** Considerar herramientas como dbt para transformaciones si el volumen crece

---

### 2.10 Machine Learning Engineer

**Estado actual: 0% ML.**

Oportunidades de ML para este CRM:

| Caso de uso | Datos disponibles | Esfuerzo | Impacto |
|-------------|-------------------|----------|---------|
| Lead scoring | clients + interactions | 🟡 Medio | 🔴 Alto |
| Churn prediction | interactions (no_interesado) | 🟡 Medio | 🟡 Medio |
| Next best action | interactions (medium, result) | 🔴 Alto | 🟡 Medio |
| Sales forecasting | ventas históricas | 🟡 Medio | 🔴 Alto |
| NLP en notes | interactions.notes | 🟡 Medio | 🟢 Bajo |

**Recomendación:** No invertir en ML ahora. El volumen de datos es insuficiente. Priorizar funcionalidad core y cuando haya >1000 interacciones, considerar lead scoring básico con reglas (no ML).

---

### 2.11 QA Automation Engineer

**Testing actual:**

| Nivel | Estado | Detalle |
|-------|--------|---------|
| Unit tests | 🔴 | 1 test placeholder (`example.test.ts`) |
| Integration tests | 🔴 | Ninguno |
| E2E tests | 🔴 | Ninguno |
| Visual regression | 🔴 | Ninguno |
| Performance tests | 🔴 | Ninguno |
| Security tests | 🔴 | Ninguno |
| CI testing | 🔴 | No se ejecutan tests en CI |

**Stack de testing disponible:**

- Vitest + Testing Library (instalado, configurado, no usado)
- jsdom (instalado)
- No hay Playwright/Cypress

**Plan de testing prioritario:**

| Prioridad | Test | Tipo | Cobertura esperada |
|-----------|------|------|--------------------|
| P0 | Auth flow (login/logout) | Integration | Prevenir regresiones de auth |
| P0 | RLS policies | Unit | Verificar permisos por rol |
| P1 | CRUD de clientes | Integration | Validar formularios y mutaciones |
| P1 | Dashboard calculations | Unit | Verificar KPIs y cálculos |
| P2 | Form validation | Unit | WhatsApp, email, required fields |
| P2 | Navigation guards | Integration | Protected routes por rol |

**Recomendación:** Empezar con tests unitarios de lógica de negocio (cálculos del Dashboard, validaciones de formulario). Luego integration tests con mocked Supabase.

---

### 2.12 Database Administrator (DBA)

**Evaluación de PostgreSQL (vía Supabase):**

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Schema design | ✅ | Normalizado, relaciones correctas |
| Indexes | ✅ | 11 índices, incluyendo parcial y compuesto |
| RLS | ✅ | 22+ políticas, granulares |
| Triggers | ✅ | updated_at, handle_new_user |
| Functions | ✅ | 5 funciones + 3 RPCs |
| Materialized views | ✅ | 2 vistas con refresh automático |
| Connection pooling | 🟡 | Supabase maneja esto (PgBouncer) |
| Query performance | 🟡 | Sin EXPLAIN ANALYZE visible, pero índices ayudan |
| Vacuum/maintenance | ✅ | Supabase maneja autovacuum |
| Backup/recovery | 🟡 | Automático vía Supabase (plan dependiente) |

**Queries problemáticas identificadas:**

```sql
-- Dashboard: carga TODAS las interactions sin filtro
SELECT * FROM interactions ORDER BY interaction_date DESC;
-- Problema: full table scan a medida que crece

-- NotificationsPanel: misma query duplicada
SELECT * FROM interactions SELECT *, clients(name);
-- Problema: duplica el tráfico

-- Clients: sin paginación
SELECT * FROM clients ORDER BY name;
-- Problema: crece linealmente con datos
```

**Recomendaciones:**

1. Adoptar las RPCs existentes (`get_dashboard_data()`, `get_notifications_data()`)
2. Implementar paginación con `LIMIT/OFFSET` o cursor-based
3. Ejecutar `EXPLAIN ANALYZE` en las queries principales para verificar uso de índices
4. Monitorear `pg_stat_statements` para identificar queries lentas

---

## 3. Área de Producto y Gestión

### 3.1 Product Manager

**Visión de producto:** CRM para equipos de ventas en sector forestal/agropecuario argentivo.

**Mercado objetivo:** PyMEs argentinas con equipos de 2-20 vendedores que necesitan organizar su pipeline comercial.

**Análisis competitivo:**

| CRM | Target | Precio | Fortalezas | Debilidades vs MejoraCRM |
|-----|--------|--------|------------|--------------------------|
| HubSpot CRM | Global | Gratis-$450/mes | Completo, ecosistema | Genérico, no habla español argentino |
| Salesforce | Enterprise | $25+/usuario | Escalabilidad | Complejo, caro |
| Pipedrive | PyMEs | $14+/usuario | Simple, visual | Sin personalización sectorial |
| Zoho CRM | PyMEs | $14+/usuario | Suite completa | Complejo |
| **MejoraCRM** | **Sector forestal AR** | **Propio** | **Nicho, adaptado** | **Funcionalidad limitada** |

**Diferenciadores de MejoraCRM:**

1. Diseñado para el sector forestal/agropecuario argentino
2. Moneda local (ARS) + multi-moneda
3. Interacción por WhatsApp (canal dominante en Argentina)
4. Sin costo por usuario
5. Control total de datos

**Funcionalidades faltantes (gap analysis):**

| Feature | Importancia | Estado | Esfuerzo |
|---------|-------------|--------|----------|
| Mobile app / PWA | 🔴 Crítico | 🔴 | 🟡 |
| Reportes / Analytics | 🔴 Crítico | 🟡 Parcial | 🟡 |
| Calendar sync | 🟡 Importante | 🟡 Placeholder | 🟡 |
| Email integration | 🟡 Importante | 🔴 | 🔴 |
| WhatsApp integration | 🟡 Importante | 🟡 Manual | 🔴 |
| Pipeline visual (Kanban) | 🟡 Importante | 🔴 | 🟡 |
| Importación masiva | ✅ Implementado | ✅ | — |
| Exportación CSV/PDF | ✅ Implementado | ✅ | — |

---

### 3.2 Product Owner

**Backlog estimado (por prioridad):**

**Sprint 1-2 (Fundacional):**
- [ ] P0: Agregar tests unitarios mínimos (Dashboard calcs, form validation)
- [ ] P0: Error boundaries por ruta
- [ ] P0: PWA manifest + Service Worker básico

**Sprint 3-4 (Core improvements):**
- [ ] P1: Adoptar RPCs existentes en Dashboard y Notifications
- [ ] P1: Paginación en listas (Clients, Interactions)
- [ ] P1: Custom hooks para queries duplicadas

**Sprint 5-6 (Growth):**
- [ ] P2: Pipeline visual (Kanban) para interacciones
- [ ] P2: Reportes avanzados con charts
- [ ] P2: Onboarding flow para nuevos usuarios

**Sprint 7-8 (Scale):**
- [ ] P3: Calendar integration (Google Calendar OAuth)
- [ ] P3: Email integration
- [ ] P3: Audit log

---

### 3.3 Scrum Master / Agile Coach

**Observaciones sobre el proceso actual:**

| Aspecto | Estado | Comentario |
|---------|--------|------------|
| Methodology | 🟡 | No hay formalismo visible, trabajo por features |
| Sprint cadence | 🔴 | No hay sprints definidos |
| Retrospectives | 🔴 | No hay registro |
| Definition of Done | 🔴 | No hay criterios explícitos |
| Estimation | 🔴 | No hay estimación visible |
| Documentation | ✅ | DOCUMENTACION.md consolidado |

**Recomendación:** Para un equipo pequeño (1-3 devs), Scrum formal es overkill. Adoptar **Kanban con WIP limits** es más apropiado. Mantener el DOCUMENTACION.md como "single source of truth".

---

### 3.4 UX Researcher

**Investigación realizada: 0 (no visible).**

**Hipótesis de usuarios:**

| Persona | Rol | Necesidades | Pain points |
|---------|-----|-------------|-------------|
| "Carlos" | Dueño/Supervisor | Ver performance del equipo, pipeline global | No puede ver todo desde el celular |
| "María" | Vendedora | Registrar interacciones rápido, no perder seguimientos | Formulario de interacción es complejo |
| "Admin IT" | Admin | Configurar usuarios, mantener datos | Sin herramientas de bulk management |

**Recomendaciones:**

1. Entrevistar 3-5 usuarios reales antes de priorizar features
2. Medir tiempo de carga de una interacción (task completion time)
3. Identificar qué canal usan más (WhatsApp probablemente) y optimizar para eso

---

### 3.5 UX Designer

**Evaluación heurística (Nielsen):**

| Heurística | Score | Comentario |
|------------|-------|------------|
| Visibilidad del estado del sistema | 🟡 | Loading spinner genérico, sin skeletons |
| Correspondencia con el mundo real | ✅ | Terminología correcta (presupuesto, seguimiento) |
| Control del usuario y libertad | 🟡 | Editar/borrar existe, pero sin undo |
| Consistencia y estándares | ✅ | shadcn/ui provee consistencia |
| Prevención de errores | 🟡 | Validación básica, sin confirmación en deletes |
| Reconocimiento vs recuerdo | ✅ | Badges, labels, icons ayudan |
| Flexibilidad y eficiencia | 🟡 | Sin shortcuts, sin búsqueda global |
| Estética y diseño minimalista | ✅ | Limpio, no sobrecargado |
| Ayuda a reconocer/diagnosticar errores | 🟡 | Toast messages, sin detalles técnicos |
| Ayuda y documentación | 🔴 | Sin onboarding, sin tooltips contextuales |

**Problemas UX específicos:**

1. **Formulario de interacción** — Demasiados campos condicionales, confuso sin guía
2. **Dashboard** — Información densa sin jerarquía clara para diferentes roles
3. **Sin onboarding** — Usuario nuevo no sabe qué hacer primero
4. **Sin búsqueda global** — No puede buscar "todo lo de Juan" rápido
5. **Mobile** — Tablas horizontales no funcionan en pantallas pequeñas

---

### 3.6 UI Designer

**Evaluación visual:**

| Aspecto | Estado | Comentario |
|---------|--------|------------|
| Design system | ✅ | shadcn/ui + tokens CSS consistentes |
| Color palette | ✅ | Azul #495F93 + Dorado #E5C34B, profesional |
| Typography | ✅ | LeagueSpartan (títulos) + BwModelica (cuerpo), bien elegidas |
| Spacing/grid | ✅ | Tailwind spacing system, consistente |
| Iconography | ✅ | Lucide React, set completo y consistente |
| Dark mode | 🔴 | No implementado (next-themes instalado pero no usado) |
| Animations | 🟡 | `animate-fade-in` básico, sin transiciones entre rutas |
| Responsive | 🟡 | Funciona pero no fue diseñado mobile-first |
| Loading states | 🔴 | Solo spinner genérico |
| Empty states | 🟡 | Hay algunos (Products), pero no todos |

**Recomendaciones:**

1. Activar dark mode (next-themes ya está instalado)
2. Agregar skeleton loading states para cada página
3. Mejorar empty states con CTAs claros
4. Animaciones de transición entre rutas (framer-motion)

---

### 3.7 UX Writer

**Copy actual evaluado:**

| Texto | Calidad | Problema |
|-------|---------|----------|
| "Envié un presupuesto" | 🟡 | Confuso — ¿el usuario envió o recibió? |
| "Cerré una venta" | ✅ | Claro, primera persona |
| "No le interesó" | 🟡 | Informal, podría ser más profesional |
| "Sin respuesta" | ✅ | Claro |
| "Mostrar inactivos" | ✅ | Claro |
| "Tipo de cambio de referencia" | ✅ | Técnico pero apropiado |
| Toast messages | ✅ | Cortos y claros |
| Empty states | 🟡 | "Sin productos encontrados" podría sugerir crear uno |

**Recomendación:** Unificar voz y tono. Usar segunda persona ("Enviaste un presupuesto" en vez de "Envié un presupuesto") o tercera impersonal. Elegir uno y ser consistente.

---

### 3.8 Localization Manager

**Estado actual: Hardcoded español argentino.**

| Aspecto | Estado |
|---------|--------|
| i18n framework | 🔴 No existe |
| Translation files | 🔴 No existen |
| Date formatting | 🟡 date-fns con locale `es` |
| Currency formatting | 🟡 `toLocaleString()` sin locale explícito |
| RTL support | 🔴 No |
| Pluralization | 🔴 Hardcoded |

**Idiomas potenciales:** Español (AR), Portugués (BR si se expande), Inglés (si se exporta).

**Recomendación:** No invertir en i18n ahora. El mercado es Argentina. Cuando haya necesidad real de expansión, adoptar `react-i18next`. Por ahora, mantener todo en español.

---

### 3.9 Delivery Manager

**Evaluación del delivery pipeline:**

```
Developer → git push main → GitHub Actions → bun install → bun build → FTP upload → crm.mejoraok.com
```

| Métrica | Valor | Target |
|---------|-------|--------|
| Lead time (commit→prod) | ~3-5 min | <5 min ✅ |
| Deploy frequency | Bajo (1-2/semana) | Diario ideal |
| Change failure rate | Desconocido (sin tests) | <5% |
| MTTR | Desconocido (sin monitoring) | <30 min |

**Riesgos del pipeline actual:**

1. Sin tests = deploy a ciegas
2. FTP = sin rollback instantáneo
3. Sin staging = bugs van directo a producción
4. Sin feature flags = todo o nada

---

## 4. Área Comercial y de Crecimiento

### 4.1 Growth Manager

**Métricas de growth (estimadas):**

| Métrica | Valor estimado | Notas |
|---------|----------------|-------|
| Usuarios activos | <50 | CRM interno de Mejora Continua |
| DAU/MAU | Desconocido | Sin analytics |
| Activation rate | Desconocido | Sin onboarding tracking |
| Retention | Desconocido | Sin métricas |
| NPS | Desconocido | Sin surveys |

**Estrategia de growth:**

1. **Internamente:** Optimizar para que los vendedores lo usen diariamente (mobile es clave)
2. **Externamente (si se comercializa):** Modelo freemium con features premium
3. **Canal:** LinkedIn + referidos en el sector forestal

---

### 4.2 ASO Specialist

**No aplica directamente** (no hay app en App Store/Play Store). Si se convierte a PWA:

- **PWA installability** — Agregar manifest.json, icons, service worker
- **Push notifications** — Para seguimientos vencidos (requiere service worker)
- **Offline mode** — Cache de datos críticos

---

### 4.3 Performance Marketing Manager

**Canal principal:** Orgánico (SEO) + referidos. No hay paid ads visible.

**Recomendación:** No invertir en paid ads hasta que el producto tenga más features y un onboarding sólido. El ROI de ads para un CRM nicho es bajo sin una propuesta de valor clara.

---

### 4.4 SEO Specialist

**Estado SEO del sitio:**

| Aspecto | Estado |
|---------|--------|
| Meta tags | 🟡 Básicos (Vite default) |
| Open Graph | 🔴 No configurado |
| Structured data | 🔴 No |
| Sitemap | 🔴 No (SPA, no indexable) |
| robots.txt | ✅ Presente |
| Performance (LCP) | 🟡 ~2-3s estimado |

**Nota:** Siendo una app autenticada, el SEO tiene impacto mínimo (las páginas protegidas no son indexables). La landing page de login es la única indexable.

---

### 4.5 Business Development Manager

**Oportunidades de partnership:**

| Partner | Tipo | Valor |
|---------|------|-------|
| Empresas forestales | Cliente directo | Usuarios del CRM |
| Consultoras agro | Revendedor | Distribución |
| Supabase | Technology | Credits/descuentos |
| WhatsApp Business API | Integration | Automatización de mensajes |

**Modelo de monetización (si se comercializa):**

| Tier | Precio | Features |
|------|--------|----------|
| Gratis | $0 | 1 usuario, 50 clientes, básico |
| Pro | $15/mes | 5 usuarios, ilimitado, reportes |
| Enterprise | $50/mes | Ilimitado, API, custom |

---

### 4.6 Account Manager

**Cuenta principal:** Mejora Continua® (empresa propietaria).

**Relationship health:**

| Aspecto | Estado |
|---------|--------|
| Stakeholder engagement | ✅ Activo (desarrollo continuo) |
| Feature requests | 🟡 Documentados pero sin priorización formal |
| Satisfaction | 🟡 Desconocida (sin survey) |
| Churn risk | ✅ Bajo (es producto propio) |

---

### 4.7 Content Manager

**Contenido existente:**

| Tipo | Cantidad | Calidad |
|------|----------|---------|
| README | 1 | ✅ Básico pero claro |
| DOCUMENTACION.md | 1 | ✅ Completo |
| Blog/articles | 0 | 🔴 |
| Help center | 0 | 🔴 |
| Video tutorials | 0 | 🔴 |
| In-app guidance | 0 | 🔴 |

**Recomendación:** Crear 3-5 guías de usuario básicas (Cómo crear un cliente, cómo registrar una venta, cómo leer el dashboard). Pueden ser screenshots con texto.

---

### 4.8 Community Manager

**No aplica actualmente.** Si se comercializa:

- Comunidad en Discord/Slack para usuarios
- Canal de WhatsApp para soporte rápido
- LinkedIn para contenido B2B

---

## 5. Área de Operaciones, Legal y Análisis

### 5.1 Business Intelligence Analyst

**Dashboards disponibles:**

| Dashboard | Estado | KPIs |
|-----------|--------|------|
| Owner view | ✅ | Ventas, presupuestos, ranking, conversión |
| Seller view | ✅ | Mis ventas, mis clientes, seguimientos |
| Reportes | 🔴 | No existen |

**KPIs faltantes recomendados:**

| KPI | Fórmula | Importancia |
|-----|---------|-------------|
| Pipeline value | SUM(presupuestos abiertos) | 🔴 |
| Sales cycle length | AVG(días presupuesto→venta) | 🟡 |
| Win rate | ventas / (ventas + perdidos) | 🔴 |
| Revenue per seller | ingresos / vendedores activos | 🟡 |
| Client lifetime value | ingresos totales / cliente | 🟡 |
| Follow-up compliance | seguimientos a tiempo / total | 🔴 |

---

### 5.2 Data Scientist

**Dataset disponible:**

| Tabla | Registros estimados | Potencial analítico |
|-------|--------------------|--------------------|
| clients | <500 | Segmentación, clustering |
| interactions | <2000 | Análisis de funnel, predicción |
| products | <20 | Cross-sell analysis |
| interaction_lines | <1000 | Basket analysis |

**Análisis recomendados (cuando haya volumen):**

1. **Funnel analysis:** presupuesto → venta (tasa de conversión por segmento)
2. **Cohort analysis:** retención de clientes por mes de adquisición
3. **Time series:** estacionalidad de ventas
4. **Clustering:** segmentación de clientes por comportamiento

---

### 5.3 Legal & Compliance Officer

**Evaluación legal:**

| Aspecto | Estado | Comentario |
|---------|--------|------------|
| Terms of Service | 🔴 | No visibles |
| Privacy Policy | 🔴 | No visible |
| Cookie consent | 🔴 | No implementado |
| Data retention policy | 🔴 | No definida |
| GDPR/Ley 25.326 | 🔴 | No se cumple |
| Contrato de servicio | 🔴 | No visible |
| Propiedad de datos | 🟡 | Implícita (empresa propietaria) |

**Riesgo:** Si se comercializa o maneja datos de terceros, la falta de política de privacidad es un problema legal serio bajo Ley 25.326 (Protección de Datos Personales, Argentina).

**Recomendaciones:**

1. Crear Política de Privacidad (obligatorio bajo Ley 25.326)
2. Crear Términos de Servicio
3. Agregar banner de cookies si se usa analytics
4. Definir política de retención de datos (cuánto tiempo se guardan)

---

### 5.4 Data Protection Officer (DPO)

**Registro de tratamiento de datos:**

| Dato | Finalidad | Base legal | Retención |
|------|-----------|------------|-----------|
| Nombre | Identificación | Consentimiento/Contrato | Indefinido |
| Email | Contacto | Consentimiento | Indefinido |
| WhatsApp | Contacto comercial | Consentimiento | Indefinido |
| Empresa | Contexto comercial | Interés legítimo | Indefinido |
| Interacciones | Gestión comercial | Interés legítimo | Indefinido |

**Acciones requeridas:**

1. Registrar el tratamiento ante la AAIP (si se comercializa)
2. Implementar mecanismo de eliminación de datos (derecho al olvido)
3. Implementar exportación de datos del usuario (portabilidad)
4. Agregar consentimiento explícito en registro

---

### 5.5 Customer Success Manager

**Journey del usuario actual:**

```
Registro → Login → ??? → Uso diario
         (no hay onboarding)
```

**Puntos de fricción:**

1. **Día 0:** No hay onboarding, usuario no sabe qué hacer
2. **Semana 1:** No hay guía de "primeros pasos"
3. **Mes 1:** No hay check-in de satisfaction
4. **Ongoing:** No hay canal de feedback in-app

**Recomendaciones:**

1. Crear wizard de onboarding (3 pasos: crear primer cliente, registrar primera interacción, ver dashboard)
2. Agregar tooltip contextual en primera visita
3. Implementar NPS survey periódico
4. Crear canal de feedback (botón flotante)

---

### 5.6 Technical Support (Tier 1, 2 & 3)

**Soporte actual: ¿?**

| Tier | Herramienta | Estado |
|------|-------------|--------|
| T1 (FAQ) | — | 🔴 |
| T2 (Ticketing) | — | 🔴 |
| T3 (Engineering) | GitHub Issues | 🟡 |

**Recomendación:** Para un CRM interno, un canal de WhatsApp + GitHub Issues es suficiente. Si se comercializa, considerar Intercom o Crisp (plan gratuito).

---

### 5.7 Revenue Operations (RevOps)

**Modelo de revenue (si se comercializa):**

| Componente | Estado |
|------------|--------|
| Pricing strategy | 🔴 No definida |
| Billing system | 🔴 No existe |
| Subscription management | 🔴 No existe |
| Revenue tracking | 🔴 No existe |
| Churn tracking | 🔴 No existe |

**Nota:** Actualmente es un producto interno. Si se comercializa, se necesita Stripe/LemonSqueezy + subscription management.

---

## 6. Plan Optimizado por Etapas

### Metodología

El plan se organiza en **6 etapas** de 2-4 semanas cada una. Cada etapa es independiente y entrega valor. El orden refleja prioridad técnica y de negocio.

---

### Etapa 1 — Estabilidad y Confianza (Semanas 1-2)

**Objetivo:** Que el deploy sea seguro y el código sea confiable.

| # | Tarea | Responsable | Prioridad | Esfuerzo |
|---|-------|-------------|-----------|----------|
| 1.1 | Agregar error boundary global en App.tsx | Frontend Dev | P0 | 2h |
| 1.2 | Crear 5 tests unitarios mínimos (calcs Dashboard, validaciones) | QA | P0 | 1 día |
| 1.3 | Agregar lint + typecheck + test al CI (antes del build) | DevOps | P0 | 2h |
| 1.4 | Activar Sentry para error tracking | SRE | P0 | 2h |
| 1.5 | Agregar skeleton loading en Dashboard, Clients, Interactions | UI Designer | P1 | 1 día |

**Entregable:** Deploy con tests, error tracking activo, loading states.

---

### Etapa 2 — Performance y Confiabilidad (Semanas 3-4)

**Objetivo:** Que la app sea rápida y no falle con datos reales.

| # | Tarea | Responsable | Prioridad | Esfuerzo |
|---|-------|-------------|-----------|----------|
| 2.1 | Adoptar RPCs existentes en Dashboard (reemplazar 3 queries) | Backend Dev | P1 | 1 día |
| 2.2 | Adoptar RPCs en NotificationsPanel (reemplazar 3 queries) | Backend Dev | P1 | 0.5 días |
| 2.3 | Implementar paginación con cursor en Clients | Backend Dev | P1 | 1 día |
| 2.4 | Implementar paginación con cursor en Interactions | Backend Dev | P1 | 1 día |
| 2.5 | Extraer custom hooks: useClients, useInteractions, useProducts | Frontend Dev | P1 | 1 día |
| 2.6 | Reemplazar `any` types con tipos de Database | Frontend Dev | P2 | 1 día |

**Entregable:** Queries optimizadas, paginación, código tipado.

---

### Etapa 3 — Mobile y PWA (Semanas 5-7)

**Objetivo:** Que funcione bien en el celular.

| # | Tarea | Responsable | Prioridad | Esfuerzo |
|---|-------|-------------|-----------|----------|
| 3.1 | Agregar manifest.json con icons | Frontend Dev | P0 | 2h |
| 3.2 | Implementar Service Worker básico (cache de assets) | Frontend Dev | P0 | 1 día |
| 3.3 | Revisar y mejorar responsive design en todas las páginas | UI Designer | P1 | 2 días |
| 3.4 | Aumentar touch targets a 44px mínimo | UI Designer | P1 | 0.5 días |
| 3.5 | Implementar push notifications para seguimientos vencidos | Frontend Dev | P2 | 2 días |
| 3.6 | Agregar offline básico (cache de última vista) | Frontend Dev | P2 | 2 días |

**Entregable:** PWA instalable, funcional en mobile, push notifications.

---

### Etapa 4 — UX y Onboarding (Semanas 8-10)

**Objetivo:** Que un usuario nuevo sepa qué hacer.

| # | Tarea | Responsable | Prioridad | Esfuerzo |
|---|-------|-------------|-----------|----------|
| 4.1 | Crear wizard de onboarding (3 pasos) | UX Designer | P1 | 2 días |
| 4.2 | Agregar tooltips contextuales en primera visita | UX Designer | P1 | 1 día |
| 4.3 | Dividir Dashboard.tsx en sub-componentes | Frontend Dev | P1 | 1 día |
| 4.4 | Dividir Interactions.tsx en sub-componentes | Frontend Dev | P1 | 1 día |
| 4.5 | Agregar búsqueda global (command palette) | Frontend Dev | P2 | 2 días |
| 4.6 | Activar dark mode (next-themes ya instalado) | UI Designer | P2 | 1 día |
| 4.7 | Mejorar empty states con CTAs | UX Writer | P2 | 0.5 días |

**Entregable:** Onboarding completo, componentes divididos, dark mode.

---

### Etapa 5 — Analytics y Reportes (Semanas 11-13)

**Objetivo:** Que los dueños tengan visibilidad del negocio.

| # | Tarea | Responsable | Prioridad | Esfuerzo |
|---|-------|-------------|-----------|----------|
| 5.1 | Crear página de Reportes con KPIs avanzados | Frontend Dev | P1 | 3 días |
| 5.2 | Agregar pipeline visual (Kanban) | Frontend Dev | P1 | 3 días |
| 5.3 | Implementar funnel analysis (presupuesto→venta) | Data Analyst | P2 | 2 días |
| 5.4 | Agregar exportación de reportes a PDF | Frontend Dev | P2 | 1 día |
| 5.5 | Implementar audit log (tabla + triggers) | Backend Dev | P2 | 1 día |
| 5.6 | Integrar Google Calendar OAuth | Backend Dev | P2 | 2 días |

**Entregable:** Reportes avanzados, pipeline visual, audit trail.

---

### Etapa 6 — Escalabilidad y Compliance (Semanas 14-16)

**Objetivo:** Que el sistema escale y cumpla requisitos legales.

| # | Tarea | Responsable | Prioridad | Esfuerzo |
|---|-------|-------------|-----------|----------|
| 6.1 | Crear Política de Privacidad (Ley 25.326) | Legal | P0 | 1 día |
| 6.2 | Crear Términos de Servicio | Legal | P0 | 1 día |
| 6.3 | Implementar mecanismo de eliminación de datos | Backend Dev | P1 | 1 día |
| 6.4 | Crear environment de staging con Supabase separado | DevOps | P1 | 1 día |
| 6.5 | Migrar deploy de FTP a Vercel/Cloudflare Pages | DevOps | P1 | 0.5 días |
| 6.6 | Agregar UptimeRobot para monitoreo de uptime | SRE | P1 | 1h |
| 6.7 | Crear runbook de incidentes | SRE | P2 | 1 día |
| 6.8 | Evaluar Supabase Pro según volumen | Cloud Architect | P2 | — |

**Entregable:** Compliance legal, staging, deploy moderno, monitoreo.

---

### Resumen del Plan

| Etapa | Semanas | Entregable clave | Dependencias |
|-------|---------|-------------------|--------------|
| 1 | 1-2 | Deploy seguro con tests | Ninguna |
| 2 | 3-4 | Performance optimizado | Etapa 1 |
| 3 | 5-7 | PWA + mobile | Etapa 2 |
| 4 | 8-10 | UX + onboarding | Etapa 3 |
| 5 | 11-13 | Analytics + reportes | Etapa 4 |
| 6 | 14-16 | Escalabilidad + legal | Etapa 5 |

**Duración total estimada:** 16 semanas (4 meses) con 1-2 desarrolladores.

---

## 7. Registro de Cambios

### 2026-04-24 — Análisis profundo multidisciplinario

**Realizado:**
- Análisis completo desde 30 perspectivas profesionales
- Evaluación de arquitectura, seguridad, UX, legal, comercial
- Identificación de 5 hallazgos críticos
- Plan de optimización en 6 etapas (16 semanas)
- Consolidación de toda la documentación en este documento

---

> **Instrucción de actualización:** Cuando se diga "documentar", actualizar este archivo (Sección 7) con los trabajos realizados, decisiones tomadas y cambios aplicados. Siempre mantener el índice actualizado.
