# PLAN GENERAL — MejoraCRM

---

## Sesión 1 — Setup inicial
- Clonado del repo, estructura base identificada.
- Stack: React + Vite + Supabase + Tailwind + shadcn/ui + recharts.

## Sesión 2 — Pipeline v2 (store + ruta + columnas mock)
- Creado `src/modules/pipeline_v2/` con arquitectura modular.
- `usePipelineStore`: useReducer con 6 etapas (Nuevo → Perdido).
- `PipelineBoard`, `PipelineColumn`: componentes base.
- Ruta `/pipeline-v2` + sidebar link temporal.
- Build limpio.

## Sesión 3 — Drag & drop con @dnd-kit
- Instalado `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers`.
- `PipelineCard`: `useDraggable` con CSS.Translate.
- `PipelineColumn`: `useDroppable` con highlight on hover.
- `PipelineBoard`: `DndContext`, `DragOverlay`, `onDragEnd`.
- 5 oportunidades mock para testing.
- Build limpio.

## Sesión 4 — Datos reales + persistencia + filtros
- `usePipelineData`: hook que consulta Supabase `interactions` con join a `clients`.
- Mapeo `interaction_result` → `stageId`:
  - `sin_respuesta` → `new`
  - `seguimiento` → `contacted`
  - `presupuesto` → `proposal`
  - `venta` → `won`
  - `no_interesado` → `lost`
- Persistencia drag & drop: `onDragEnd` actualiza `result` en Supabase.
- Optimistic UI + rollback en error + toast.
- `usePipelineFilters`: búsqueda, etapa, rango de montos, rango de fechas.
- UI de filtros integrada en PipelineBoard.
- Mock data eliminada; store poblado desde DB.
- Build limpio.

## Sesión 5 — Reemplazo final del Pipeline viejo ✅
- **Pipeline v2 ahora es el pipeline oficial en `/pipeline`.**
- Ruta `/pipeline-v2` eliminada.
- Sidebar: link "Pipeline v2" eliminado, solo queda "Pipeline" → `/pipeline`.
- `src/pages/Pipeline.tsx` (viejo) eliminado.
- `Reports.tsx` verificado: no depende del componente viejo, usa `useDashboardData()`.
- `totalPipeline` sigue funcionando (calculado desde `interactions` directamente).
- Título del board cambiado de "Pipeline v2" a "Pipeline".
- Build limpio, sin referencias residuales.
- Documentación actualizada en `PLAN_GENERAL.md`.

---

## Próxima sesión: Etapa 6 — UI + Nomenclatura + Colores

### Objetivo: Aplicar identidad visual Mejora Continua y estandarizar nomenclatura.

1. **Paleta de colores** — Aplicar azul Mejora Continua `#2C5CA5` como color primario.
2. **Nomenclatura del sidebar:**
   - `Dashboard` → **Vista general**
   - `Pipeline` → **Proceso de ventas**
3. **Nomenclatura de entidades:**
   - `Lead` → **Contacto**
   - `Tasa de conversión` → **Éxito de ventas**
4. **Colores generales:**
   - Fondo: `#F2F2F2`
   - Cards: `#FFFFFF`
   - Texto principal: `#1A1A1A`
   - Texto secundario: `#656565`
5. **Estructura modular de Vista General (dueño):**
   - KPIs superiores (ventas, pipeline, win rate)
   - Actividad reciente
   - Tareas pendientes
   - Performance por vendedor
6. **Estructura operativa de Vista Vendedor:**
   - Mis leads/contactos
   - Mi pipeline
   - Seguimientos pendientes
   - Mi performance

### Dependencias:
- No requiere instalación de paquetes nuevos.
- Solo cambios en `tailwind.config.ts`, sidebar, y componentes de texto.

---

## Estado de cierre — Sesión 5 (2026-05-02)

### Estado final
- ✅ Pipeline v2 oficial reemplazó al pipeline viejo.
- ✅ Rutas actualizadas (`/pipeline` → PipelineBoard).
- ✅ Sidebar limpio (sin links duplicados).
- ✅ Persistencia Supabase funcionando (`onDragEnd` → update `result`).
- ✅ Filtros avanzados funcionando (búsqueda, etapa, monto, fecha).
- ✅ Build limpio (0 errores, 3380 módulos).
- ✅ Working tree sin cambios pendientes.

### Commits generados en esta sesión
| Hash | Mensaje |
|---|---|
| `fe2d0e6` | feat: reemplazo completo del Pipeline viejo → Pipeline v2 oficial |
| `c9c525e` | feat(pipeline-v2): connect Supabase, persist DnD, add filters |
| `6d94e9d` | feat(pipeline-v2): integrate drag & drop with @dnd-kit |
| `575a93f` | feat(pipeline-v2): add store, route and board with 6 mock stages |
| `f766a77` | MejoraCRM P0 |

---

## Sesión 6 — UI Corporativa + Vista General ✅

### Cambios UI globales

**Paleta corporativa aplicada** (colores ya definidos en `index.css`, verificados):
| Elemento | Color | Variable CSS |
|---|---|---|
| Panel navegación | `#2C5CA5` | `--sidebar-background: 214 58% 41%` |
| Ítem activo | `#1C4D8C` | `--sidebar-accent: 214 60% 33%` |
| Fondo general | `#F2F2F2` | `--background: 0 0% 95%` |
| Cards | `#FFFFFF` | `--card: 0 0% 100%` |
| Texto principal | `#1A1A1A` | `--foreground: 0 0% 5%` |
| Texto secundario | `#656565` | `--muted-foreground: 0 0% 40%` |
| Acento | `#F2BC1B` | `--accent: 45 87% 54%` |

**Tipografías:** Bw Modelica (sans), League Spartan (display) — ya configuradas en `tailwind.config.ts` e `index.css`.

### Cambios de nomenclatura

| Antes | Después | Archivos afectados |
|---|---|---|
| `Dashboard` | `Vista general` | AppSidebar, AppLayout, CommandPalette, OnboardingWizard |
| `Pipeline` | `Proceso de ventas` | AppSidebar, AppLayout, PipelineBoard |
| `Pipeline activo` | `Ventas en curso` | Reports (KPI + PDF export) |
| `Tasa conversión` | `Éxito de ventas` | Reports (KPI) |
| `Leads sin contacto reciente` | `Contactos sin seguimiento` | OwnerViewV2 |
| `Pipeline` (chart name) | `Proceso de ventas` | Reports (AreaChart) |

### Vista General (Dueño) — `OwnerViewV2.tsx`

Nueva vista modular con 3 bloques:

**Bloque 1 — Resultados Directos:**
- Ventas logradas (con tendencia vs período anterior)
- Ventas en curso (con tendencia)
- Ventas no concretadas (con tendencia)
- Éxito de ventas (%)

**Bloque 2 — Gestión Comercial + Rendimiento del Equipo:**
- 4 KPIs: seguimientos vencidos, contactos nuevos, contactos atendidos, contactos sin seguimiento
- Ranking de vendedores (por ingresos)
- Éxito de ventas (detalle %)
- Tiempo hasta cerrar (días promedio presupuesto → venta)
- Lista de seguimientos vencidos

**Bloque 3 — Análisis y Estrategia:**
- Valor promedio de venta
- Motivos de pérdida (PieChart)
- Ventas por producto (BarChart horizontal)
- Ventas por zona/provincia (BarChart horizontal)
- Distribución por rubro (PieChart)
- Distribución de resultados (PieChart)

**Cálculos nuevos:**
- Tendencias: compara período actual vs anterior (%, ↑/↓)
- Contactos nuevos: `clients.created_at >= periodStart`
- Contactos atendidos: `Set(client_id)` con interacciones en período
- Contactos sin seguimiento: clientes sin actividad en período
- Tiempo hasta cerrar: `differenceInDays(venta, presupuesto)` promedio

### Vista General (Vendedor) — `SellerViewV2.tsx`

4 secciones:

**Sección 1 — Tus ventas** (colores verde/naranja/rojo):
- Ventas logradas (verde)
- Ventas en curso (naranja)
- No concretadas (rojo)

**Sección 2 — Tareas del día:**
- Seguimientos hoy
- Seguimientos vencidos
- Contactos/actividad del día

**Sección 3 — Resumen del mes:**
- 4 KPIs: interacciones totales, ventas cerradas, presupuestos enviados, seguimientos hechos
- Próximos seguimientos (lista)

**Sección 4 — Ritmo de trabajo:**
- Mensaje automático basado en actividad del día

### Integración

- `Dashboard.tsx`: importa `OwnerViewV2` y `SellerViewV2` (reemplaza vistas v1)
- `dashboard/index.ts`: exporta nuevas vistas + mantiene v1 para compatibilidad
- `AppLayout.tsx`: títulos actualizados, incluye `/pipeline` → "Proceso de ventas"

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/components/AppSidebar.tsx` | "Pipeline" → "Proceso de ventas" |
| `src/components/AppLayout.tsx` | Títulos actualizados |
| `src/components/CommandPalette.tsx` | "Dashboard" → "Vista general" |
| `src/components/OnboardingWizard.tsx` | Textos actualizados |
| `src/pages/Dashboard.tsx` | Usa OwnerViewV2 / SellerViewV2 |
| `src/pages/Reports.tsx` | "Pipeline activo" → "Ventas en curso", "Tasa conversión" → "Éxito de ventas" |
| `src/modules/pipeline_v2/PipelineBoard.tsx` | "Pipeline" → "Proceso de ventas" |

### Archivos creados

| Archivo | Descripción |
|---|---|
| `src/components/dashboard/OwnerViewV2.tsx` | Vista general dueño (3 bloques modulares) |
| `src/components/dashboard/SellerViewV2.tsx` | Vista general vendedor (4 secciones) |

### Validación
- ✅ Build limpio (0 errores, 3382 módulos)
- ✅ Navegación coherente (sidebar, títulos, rutas)
- ✅ Textos correctos en toda la UI
- ✅ Colores corporativos aplicados
- ✅ Vistas funcionando según rol (admin/supervisor → OwnerViewV2, vendedor → SellerViewV2)

---

## Próxima sesión: Etapa 7 — Interacciones v2

### Objetivo: Mejorar el módulo de interacciones.

1. Formulario de interacción mejorado (multi-paso o wizard)
2. Historial de interacciones por cliente (timeline)
3. Filtros avanzados (fecha, resultado, vendedor, producto)
4. Mejoras al PipelineBoard (detalle de oportunidad)
5. Integración de notificaciones inteligentes

---

## Sesión 7 — Modo Demo + Datos de Prueba + Checklist ✅

### Modo Demo

**Archivos creados:**
| Archivo | Descripción |
|---|---|
| `supabase/seed.sql` | Script SQL completo para cargar datos de demostración |
| `src/demo/demoData.ts` | Documentación del dataset, usuarios y flujo de navegación |

**Usuarios de prueba:**
| Email | Rol | Ve |
|---|---|---|
| `admin@mejoracrm.com` | admin (dueño) | Todo el equipo |
| `maria@mejoracrm.com` | vendedor | Solo sus datos |
| `carlos@mejoracrm.com` | vendedor | Solo sus datos |

Password para todos: `Demo2026!`

**Dataset de demostración:**
- 8 clientes (Forestal, Agropecuario, Industrial, Construcción, Gobierno, Comercio)
- 5 productos (semillas pino/eucalipto, madera pino/eucalipto, servicio forestal)
- 19 interacciones:
  - 6 ventas cerradas (~$2,970,000 ARS + $7,500 USD)
  - 4 presupuestos en curso (~$2,510,000 ARS + $15,000 USD)
  - 3 seguimientos pendientes
  - 3 seguimientos vencidos
  - 3 ventas perdidas (~$1,000,000 ARS estimados)
- 3 perfiles (1 admin + 2 vendedores)
- 8 líneas de interacción

### Cómo cargar los datos de demo

1. Ir a Supabase Dashboard → Authentication → Users
2. Crear 3 usuarios con los emails de arriba y password `Demo2026!`
3. Copiar los UUIDs generados y reemplazarlos en `seed.sql` (sección 1)
4. Ir a SQL Editor → pegar todo el contenido de `seed.sql` → ejecutar
5. Verificar: `SELECT count(*) FROM interactions;` → debe dar 19

### Flujo de navegación sugerido para la demo

1. **Login** → Entrar como admin. Cerrar onboarding.
2. **Vista General** → KPIs, tendencias, ranking, gráficos.
3. **Proceso de ventas** → Pipeline drag & drop. Mover una card.
4. **Clientes** → Lista, filtros, detalle con timeline.
5. **Interacciones** → Historial, crear nueva.
6. **Reportes** → Gráficos, funnel, exportar PDF.
7. **Productos** → Catálogo.
8. **Configuración** → Ajustes, integraciones, PWA.
9. **Cambiar a vendedor** → Logout → maria@.ver vista reducida.
10. **Pipeline vendedor** → Solo sus oportunidades.

---

## Guía de Validación del Cliente

### 1. Qué debe probar

El cliente debe recorrer cada sección del CRM como si fuera su día a día de trabajo. No es necesario seguir un orden estricto, pero se recomienda el flujo de arriba.

### 2. Qué datos verá

Con los datos de demo cargados:
- **Vista General (dueño):** Métricas de $2.970.000 en ventas, 60% éxito, ranking de 2 vendedores, 3 seguimientos vencidos.
- **Vista General (vendedor):** Solo las interacciones de ese vendedor. Tareas del día con seguimientos pendientes.
- **Proceso de ventas:** Cards en diferentes etapas del pipeline. Se puede arrastrar entre columnas.
- **Clientes:** 8 clientes con datos reales (nombres, teléfonos, rubros, provincias de Misiones).
- **Interacciones:** 19 registros con distintos resultados (venta, presupuesto, seguimiento, rechazo).
- **Reportes:** Gráficos de funnel, tendencia mensual, top productos, motivos de pérdida.

### 3. Qué flujos recorrer

- [ ] Crear un cliente nuevo desde el formulario
- [ ] Registrar una interacción (presupuesto con líneas de producto)
- [ ] Ver el detalle de un cliente y su historial
- [ ] Mover una card en el pipeline (drag & drop)
- [ ] Filtrar clientes por estado/provincia
- [ ] Filtrar interacciones por resultado
- [ ] Exportar clientes a CSV
- [ ] Exportar reportes a PDF
- [ ] Ver la vista de vendedor (login como maria@)
- [ ] Ver la vista de dueño (login como admin@)

### 4. Qué decisiones puede tomar

- ¿Los KPIs mostrados son los que necesitás ver?
- ¿Falta alguna métrica importante?
- ¿Los nombres de las secciones son claros?
- ¿El pipeline refleja tu proceso de ventas real?
- ¿Necesitás más etapas en el pipeline?
- ¿Los campos del formulario de interacción son los correctos?
- ¿Necesitás campos adicionales en los clientes?

### 5. Qué mejoras puede sugerir

- Cambios en colores, tipografías o layout
- Nuevos KPIs o métricas
- Cambios en la nomenclatura
- Nuevos campos en formularios
- Integraciones adicionales
- Reportes personalizados
- Flujos de trabajo específicos de su negocio

---

## Checklist de Validación

### Navegación y estructura
- [ ] Vista general carga correctamente (admin)
- [ ] Vista general carga correctamente (vendedor)
- [ ] Proceso de ventas carga con cards
- [ ] Clientes muestra la lista
- [ ] Interacciones muestra el historial
- [ ] Reportes muestra gráficos
- [ ] Productos muestra catálogo
- [ ] Configuración carga correctamente

### Datos de demo
- [ ] Métricas coinciden con datos de prueba
- [ ] Ranking muestra 2 vendedores
- [ ] Pipeline muestra cards en todas las etapas
- [ ] Clientes tienen datos completos (nombre, empresa, rubro, provincia)
- [ ] Interacciones muestran todos los resultados
- [ ] Reportes muestran gráficos con datos

### Funcionalidad
- [ ] Drag & drop actualiza Supabase
- [ ] Filtros de clientes funcionan (estado, provincia, búsqueda)
- [ ] Filtros de interacciones funcionan (resultado, búsqueda)
- [ ] Crear cliente funciona
- [ ] Crear interacción funciona (con líneas de producto)
- [ ] Ver detalle de cliente + timeline funciona
- [ ] Exportar CSV funciona
- [ ] Exportar PDF funciona
- [ ] Command palette (⌘K) funciona

### UI y nomenclatura
- [ ] Navegación coherente (sidebar, títulos, rutas)
- [ ] Nomenclatura correcta: "Vista general", "Proceso de ventas", "Ventas en curso", "Éxito de ventas", "Contactos sin seguimiento"
- [ ] Colores corporativos aplicados (sidebar azul #2C5CA5, acento amarillo #F2BC1B)
- [ ] Fondo general gris #F2F2F2, cards blancas #FFFFFF
- [ ] Texto principal #1A1A1A, texto secundario #656565
- [ ] Responsive en mobile

### Roles
- [ ] Admin ve todo (reportes, productos, configuración)
- [ ] Vendedor NO ve reportes, productos ni configuración
- [ ] Vendedor solo ve sus propias interacciones en Vista General
- [ ] Sidebar oculta items según rol
