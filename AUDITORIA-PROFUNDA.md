# AUDITORIA-PROFUNDA.md — Análisis Técnico Completo de MejoraCRM

**Fecha:** 2026-05-13
**Analista:** OpenClaw Agent
**Repo:** https://github.com/pabloeckert/MejoraCRM
**Commit base:** `9565f91`

---

## 1. RESUMEN EJECUTIVO

MejoraCRM es un CRM para pymes familiares de la región NEA/Argentina (forestal, yerbatero, agro, servicios). Diseñado para equipos de 1-5 vendedores sin área comercial formal.

**Estado actual:** Funcional en modo DEMO (datos mock). Sprint 3 parcialmente completado. Backend Supabase preparado pero no conectado en producción.

**Veredicto general:** Código bien estructurado, arquitectura sólida para un MVP. Hay deuda técnica acumulada y oportunidades claras de mejora antes de escalar.

---

## 2. STACK TÉCNICO COMPLETO

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | React | 18.3.1 |
| Lenguaje | TypeScript | 5.8.3 |
| Bundler | Vite | 6.4.2 |
| UI | Tailwind CSS + shadcn/ui | 3.4.17 |
| State | React Context + TanStack Query | 5.83.0 |
| Routing | react-router-dom | 6.30.1 |
| Backend | Supabase (Auth + PostgreSQL + RLS) | 2.103.0 |
| Charts | Recharts | 3.8.1 |
| Forms | react-hook-form + Zod | 7.73.1 / 4.3.6 |
| DnD | @dnd-kit | 6.3.1 |
| Export | xlsx (SheetJS) | 0.18.5 |
| Testing | Vitest + Testing Library | 4.1.6 |
| CI/CD | GitHub Actions | — |
| Deploy | Vercel | — |
| Package Mgr | Bun | latest |

---

## 3. ESTRUCTURA DEL CÓDIGO

```
src/
├── App.tsx                    # Router principal, providers
├── main.tsx                   # Entry point
├── index.css                  # CSS variables, animaciones, PWA styles
├── vite-env.d.ts
│
├── components/
│   ├── AppLayout.tsx          # Layout con sidebar + header
│   ├── AppSidebar.tsx         # Sidebar navegación (roles)
│   ├── CommandPalette.tsx     # Cmd+K búsqueda global
│   ├── DemoRoleToggle.tsx     # Toggle Dueño/Vendedor (demo)
│   ├── ErrorBoundary.tsx      # Catch errores React
│   ├── NavLink.tsx            # Link con active state
│   ├── NotificationsPanel.tsx # Panel de notificaciones
│   ├── OnboardingWizard.tsx   # Wizard primer uso
│   ├── PWAInstallBanner.tsx   # Banner instalación PWA
│   ├── ThemeProvider.tsx      # Dark/light theme
│   ├── ThemeToggle.tsx        # Toggle tema
│   │
│   ├── dashboard/
│   │   ├── index.ts
│   │   ├── KPICard.tsx
│   │   ├── OwnerView.tsx      # Vista dueño (v1)
│   │   ├── OwnerViewV2.tsx    # Vista dueño (actual)
│   │   ├── SellerView.tsx     # Vista vendedor (v1)
│   │   └── SellerViewV2.tsx   # Vista vendedor (actual)
│   │
│   ├── interactions/
│   │   ├── index.ts
│   │   ├── InteractionCard.tsx # Card de interacción
│   │   ├── InteractionForm.tsx # Wizard 4 pasos
│   │   ├── ProductLines.tsx   # Líneas de productos
│   │   └── ProformaUpload.tsx # Upload drag & drop
│   │
│   ├── skeletons/
│   │   ├── index.ts
│   │   ├── DashboardSkeleton.tsx
│   │   └── ListSkeleton.tsx
│   │
│   └── ui/                    # shadcn/ui components (14)
│       badge, button, card, dialog, input, label,
│       popover, select, separator, sheet, sidebar,
│       skeleton, sonner, switch, table, textarea, tooltip
│
├── contexts/
│   └── AuthContext.tsx        # Auth + DEMO_MODE toggle
│
├── demo/
│   └── demoData.ts            # Mock data (8 clientes, 19 interacciones, 5 productos)
│
├── hooks/
│   ├── index.ts
│   ├── useClients.ts          # CRUD clientes (paginado + all + minimal)
│   ├── useDashboard.ts        # Dashboard data (RPC o demo)
│   ├── useInteractions.ts     # CRUD interacciones (paginado + all + presupuestos)
│   ├── use-mobile.tsx         # Detect mobile
│   ├── useNotifications.ts    # Notificaciones
│   ├── useProducts.ts         # CRUD productos (all + active)
│   ├── useProfiles.ts         # Perfiles
│   └── usePWAInstall.ts       # PWA install prompt
│
├── integrations/supabase/
│   ├── client.ts              # createClient con env vars
│   └── types.ts               # Auto-generated DB types
│
├── lib/
│   ├── calculations.ts        # KPIs, ranking, filtros (pure functions)
│   ├── calculations.test.ts   # 30 tests
│   ├── constants.ts           # Labels, estilos, opciones
│   ├── excelExport.ts         # Export XLSX
│   ├── notifications.ts       # Push API utilities
│   ├── schemas.ts             # Zod schemas
│   ├── schemas.test.ts        # Schema validation tests
│   ├── types.ts               # TypeScript types
│   └── utils.ts               # cn() utility
│
├── pages/
│   ├── Auth.tsx               # Login (Supabase Auth)
│   ├── Clients.tsx            # CRUD Clientes (578 líneas)
│   ├── Dashboard.tsx          # Router Owner/Seller
│   ├── Interactions.tsx       # Lista + filtros + wizard
│   ├── NotFound.tsx           # 404
│   ├── Privacy.tsx            # Política privacidad
│   ├── Products.tsx           # CRUD Productos (485 líneas)
│   ├── Reports.tsx            # Charts + KPIs (490 líneas)
│   ├── Settings.tsx           # Configuración
│   ├── Terms.tsx              # Términos
│   └── WhatsAppLink.tsx       # Generador link wa.me
│
└── test/
    └── setup.ts               # Vitest setup
```

**Total archivos TypeScript/TSX:** ~75
**Total líneas de código (estimado):** ~8,500

---

## 4. ANÁLISIS POR MÓDULO

### 4.1 Autenticación (AuthContext.tsx)
- **DEMO_MODE = true** hardcodeado
- Bypass login con mock users (Pablo=admin, Sindy=vendedor)
- Toggle Dueño/Vendedor en header
- Supabase Auth preparado pero no activo
- **Issue:** `DEMO_MODE` es constante, no se puede cambiar sin modificar código
- **Issue:** No hay refresh de sesión automático en modo real

### 4.2 Clientes (Clients.tsx)
- CRUD completo con formulario dialog
- Import CSV con detección de duplicados
- Export CSV, PDF, Excel
- Filtros: búsqueda, estado, provincia
- Detalle de cliente con historial de interacciones
- Validación WhatsApp
- **Issue:** 578 líneas — demasiado en un solo archivo
- **Issue:** `fileInputRef` usa `useState` en vez de `useRef`
- **Issue:** CSV parser no maneja comillas correctamente (split por coma falla con comas dentro de campos)
- **Issue:** No hay paginación visual (carga todo)

### 4.3 Interacciones (Interactions.tsx + InteractionForm.tsx)
- Wizard 4 pasos: Cliente → Resultado → Detalles → Medio
- 5 resultados: presupuesto, venta, seguimiento, sin_respuesta, no_interesado
- Campos condicionales según resultado
- ProductLines para múltiples productos
- ProformaUpload con drag & drop
- Filtros de período (hoy/semana/mes/trimestre/semestre/año)
- **Issue:** `InteractionForm.tsx` tiene 400+ líneas — complejo de mantener
- **Issue:** El wizard no persiste estado si se cierra accidentalmente
- **Issue:** No hay edición de interacciones existentes

### 4.4 Dashboard (OwnerViewV2.tsx + SellerViewV2.tsx)
- **Dueño:** 3 bloques (Resultados, Gestión+Equipo, Análisis)
  - KPIs con tendencias vs período anterior
  - Ranking vendedores
  - Seguimientos vencidos
  - Charts: motivos pérdida, productos, zonas, rubros
- **Vendedor:** 4 secciones (Ventas, Tareas, Resumen mes, Ritmo)
  - Seguimientos hoy/vencidos
  - Mensaje de ritmo automático
- **Issue:** OwnerViewV2.tsx tiene ~400 líneas — debería descomponerse
- **Issue:** Cálculos de tendencias duplicados entre OwnerViewV2 y Reports

### 4.5 Reportes (Reports.tsx)
- KPIs: ventas logradas, en curso, win rate, ciclo promedio, éxito, pérdida
- Funnel de ventas
- Tendencia mensual (AreaChart)
- Distribución resultados (PieChart)
- Top productos (BarChart)
- Motivos de pérdida (PieChart)
- Revenue por provincia
- Export PDF + Excel
- **Issue:** 490 líneas en un solo componente
- **Issue:** Cálculos de KPIs duplicados con OwnerViewV2

### 4.6 Productos (Products.tsx)
- CRUD completo
- Import CSV con plantilla descargable
- Filtros búsqueda + activo/inactivo
- Acceso por rol (admin edita, vendedor consume)
- **Issue:** No hay categorías predefinidas (campo libre)

### 4.7 Configuración (Settings.tsx)
- Tipo de cambio de referencia
- Integraciones (Calendar, Contacts) — stubs
- Notificaciones push
- PWA install
- Eliminación de cuenta
- **Issue:** Estado de integraciones se pierde al recargar (localStorage)

### 4.8 Otros módulos
- **WhatsAppLink:** Generador de link wa.me con formulario prellenado
- **CommandPalette:** Cmd+K búsqueda global de clientes, interacciones, páginas
- **OnboardingWizard:** 3 pasos para primer uso
- **PWAInstallBanner:** Banner instalación app
- **ErrorBoundary:** Catch errores con UI de fallback

---

## 5. BASE DE DATOS (Supabase)

### 5.1 Tablas
- `clients` — 18 campos (name, company, whatsapp, email, segment, province, country, status, etc.)
- `interactions` — 20+ campos (client_id, user_id, result, medium, total_amount, currency, loss_reason, etc.)
- `interaction_lines` — 6 campos (interaction_id, product_id, quantity, unit_price, line_total)
- `products` — 10 campos (name, description, category, unit, unit_label, currency, price, active)
- `profiles` — 4 campos (user_id, full_name, avatar_url, role)

### 5.2 Enums
- `app_role`: admin, vendedor, supervisor
- `client_status`: activo, potencial, inactivo
- `interaction_result`: presupuesto, venta, seguimiento, sin_respuesta, no_interesado
- `interaction_medium`: whatsapp, llamada, email, reunion_presencial, reunion_virtual, md_instagram, md_facebook, md_linkedin, visita_campo

### 5.3 Migraciones (11 archivos)
1. `20260414232059` — Schema inicial (clients, interactions, products, profiles)
2. `20260414232115` — RLS policies
3. `20260422130107` — interaction_lines + quote fields
4. `20260423130000` — Performance indexes
5. `20260423131000` — Dashboard RPC functions
6. `20260423132000` — Harden RLS policies
7. `20260423133000` — Materialized views
8. `20260424220000` — Audit log
9. `20260425120000` — Account deletion RPC
10. `20260502120000` — Country field to clients
11. `seed.sql` — Datos de ejemplo

### 5.4 RPC Functions
- `get_dashboard_data()` — Devuelve interactions, clients, profiles en una sola llamada
- `get_user_role()` — Rol del usuario
- `request_account_deletion()` — Eliminación de cuenta

---

## 6. TESTING

### 6.1 Tests existentes (30 tests)
- `calculations.test.ts` — 15 tests (KPIs, filterByPeriod, getOverdueFollowups, isValidWhatsapp, calculateSellerRanking)
- `schemas.test.ts` — 15 tests (interactionSchema, lineSchema)

### 6.2 Cobertura
- ✅ Lógica de negocio pura (calculations.ts)
- ✅ Validación de schemas (schemas.ts)
- ❌ Componentes React (0 tests)
- ❌ Hooks (0 tests)
- ❌ Integración (0 tests)
- ❌ E2E (0 tests)

### 6.3 Config testing
- Vitest + jsdom + Testing Library
- Setup file: `src/test/setup.ts`
- Coverage reporter: text + lcov

---

## 7. CI/CD

### 7.1 GitHub Actions
```yaml
Pipeline: lint → typecheck → test → build
Trigger: push/PR a main
Runner: ubuntu-latest
Runtime: Bun
```

### 7.2 Deploy
- **Producción:** Vercel (mejoracrm.vercel.app)
- **Dominio:** crm.mejoraok.com (pendiente configurar)
- **Auto-deploy:** push a main → Vercel build automático

---

## 8. DEUDA TÉCNICA IDENTIFICADA

### 8.1 Críticas (afectan funcionalidad)
1. ~~**CSV parser roto** — `split(",")` no maneja comas dentro de campos entrecomillados~~ ✅ RESUELTO
2. **Sin paginación real** — Carga todos los registros en memoria
3. **Sin edición de interacciones** — Solo se pueden crear, no editar
4. **DEMO_MODE hardcodeado** — Debe ser variable de entorno

### 8.2 Altas (afectan mantenibilidad)
5. **Archivos monolíticos** — Clients.tsx (578), Reports.tsx (490), InteractionForm.tsx (400+), OwnerViewV2.tsx (400+)
6. ~~**Cálculos duplicados** — KPIs calculados en OwnerViewV2 Y Reports separadamente~~ ✅ RESUELTO
7. **No hay state management** — Todo local, sin forma de compartir estado entre componentes
8. **Tests insuficientes** — 0% cobertura en componentes y hooks

### 8.3 Medias (afectan UX)
9. **Sin lazy loading** — Todos los módulos se cargan al inicio
10. **Sin error handling en hooks** — Errores de red no se manejan gracefully
11. **Sin optimistic updates** — Mutaciones esperan respuesta del servidor
12. **Animaciones CSS hardcodeadas** — Deberían ser más dinámicas

### 8.4 Bajas (nice to have)
13. **Sin i18n** — Todo hardcodeado en español
14. **Sin analytics** — No se trackea uso
15. **Sin offline support** — PWA básica sin cache de datos
16. **Stubs de integraciones** — Calendar, Contacts sin implementar

---

## 9. SEGURIDAD

### 9.1 ✅ Correcto
- RLS habilitado en todas las tablas
- Auth via Supabase Auth
- Variables de entorno para credenciales
- `.env.example` sin secrets
- demoData.ts no tiene passwords hardcodeadas (se limpió)

### 9.2 ⚠️ Pendiente
- Token de GitHub fue compartido en chat (debe ser revocado)
- Credenciales de git no guardadas en server
- Sin rate limiting en API
- Sin CSP headers
- Sin sanitización de inputs CSV

---

## 10. RENDIMIENTO

### 10.1 ✅ Correcto
- Vite con code splitting (manualChunks)
- Lazy loading de Recharts y Supabase
- QueryClient con staleTime 30s
- Tailwind purga CSS no usado

### 10.2 ⚠️ Pendiente
- Sin lazy loading de rutas (React.lazy)
- Sin memoización de componentes pesados
- Sin virtualización de listas largas
- Sin service worker para cache

---

## 11. PRÓXIMOS PASOS RECOMENDADOS (priorizado)

### Prioridad 1: Estabilizar para producción
1. Conectar Supabase real (DEMO_MODE = false)
2. Fix CSV parser (usar Papa Parse o similar)
3. Agregar paginación real (infinite scroll o pagination)
4. Lazy loading de rutas

### Prioridad 2: Mejorar código
5. Descomponer archivos monolíticos
6. Extraer cálculos compartidos a hooks
7. Agregar tests de componentes críticos
8. Error handling en hooks

### Prioridad 3: Features nuevas
9. Edición de interacciones
10. Google Calendar sync
11. Dashboard vendedor refinamiento
12. Búsqueda full-text

### Prioridad 4: Escalabilidad
13. Multi-tenant
14. Sistema de planes/trial
15. Admin panel
16. Facturación

---

## 12. ARCHIVOS DE REFERENCIA

| Archivo | Contenido |
|---|---|
| `CTO.md` | Documentación técnica completa + roadmap |
| `ESTADO-ACTUAL.md` | Estado resumido del proyecto |
| `CONTINUACION.md` | Flag para retomar sesión |
| `CHANGELOG.md` | Historial de cambios |
| `SPRINT-1.md` | Detalle Sprint 1 |
| `SETUP.md` | Guía para conectar Supabase |
| `AUDITORIA-PROFUNDA.md` | Este documento |

---

## 13. MÉTRICAS DEL CÓDIGO

| Métrica | Valor |
|---|---|
| Archivos TS/TSX | ~78 |
| Líneas de código | ~9,500 |
| Componentes React | ~30 |
| Hooks custom | 8 |
| Páginas | 11 |
| Tests | 67 |
| Migraciones DB | 11 |
| Dependencias | 30 |
| Dev dependencies | 16 |
| Bundle chunks | 6 (vendor-react, vendor-query, vendor-ui, vendor-charts, vendor-supabase, main) |

### Archivos nuevos desde auditoría:
- `src/lib/csvParser.ts` — Parser CSV robusto
- `src/lib/csvParser.test.ts` — 19 tests
- `src/lib/businessLogic.ts` — Lógica de negocio compartida
- `src/lib/businessLogic.test.ts` — 18 tests
- `AUDITORIA-PROFUNDA.md` — Este documento
