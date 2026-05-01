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
