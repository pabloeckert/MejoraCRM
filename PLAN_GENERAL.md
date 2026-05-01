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

### Próxima sesión: Etapa 6 — UI + Nomenclatura + Colores

1. Aplicar paleta corporativa: `#2C5CA5`, `#1C4D8C`, `#F2F2F2`, `#FFFFFF`, `#1A1A1A`, `#656565`, `#F2BC1B`.
2. Cambiar textos globales:
   - Dashboard → **Vista general**
   - Pipeline → **Proceso de ventas**
   - Lead → **Contacto**
   - Tasa de conversión → **Éxito de ventas**
3. Ajustar layout general (fondos, cards, tipografías).
4. Preparar Vista General (dueño): KPIs, actividad reciente, tareas pendientes, performance por vendedor.
5. Preparar Vista Vendedor: mis contactos, mi pipeline, seguimientos pendientes, mi performance.
6. Unificar métricas con Reports.
7. Dejar lista la estructura modular para Etapa 7.
