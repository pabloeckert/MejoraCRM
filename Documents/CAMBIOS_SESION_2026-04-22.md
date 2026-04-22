# Cambios — Sesión 22-23 Abril 2026

**Duración:** ~2 horas (23:42 - 00:34 GMT+8)
**Commits:** 10
**Archivos modificados:** 15
**Líneas:** +2,800 / -267

## Resumen ejecutivo

Se partió de un análisis del repo y los manuales técnicos v1/v2. Se identificaron gaps, se priorizaron según v2, y se implementaron mejoras hasta alcanzar **93% de cobertura** del requerimiento v2. Finalmente se hizo deploy a producción.

## Commits (orden cronológico)

| # | SHA | Mensaje |
|---|---|---|
| 1 | 739bd8b | feat: mejoras v2 - colores, nomenclatura, flujo interacciones |
| 2 | 34b9ba2 | feat: selector período, análisis y estrategia, KPIs mejorados |
| 3 | 52c5798 | docs: actualizar informe avances - 87% |
| 4 | de921c5 | feat: importar/exportar contactos CSV + validación WhatsApp |
| 5 | 340a2c5 | docs: actualizar informe - 91% |
| 6 | 95aa9ad | fix: terminología restante en NotificationsPanel |
| 7 | feb078f | docs: informe final - 93%, terminología completa |
| 8 | c05c21a | feat: página Configuración, export PDF, preparación integraciones |
| 9 | 64020f4 | docs: informe final - 93% (65/70), 5 gaps APIs externas |
| 10 | 7b09b71 | fix: add react-is dependency for recharts build |

## Detalle de cambios por archivo

### `src/index.css`
- Sidebar: `hsl(214,58%,14%)` → `hsl(214,58%,41%)` (#2C5CA5)
- Fondo: `hsl(40,20%,97%)` → `hsl(0,0%,95%)` (#F2F2F2)
- Ítem activo sidebar: `hsl(214,58%,33%)` (#1C4D8C)
- Colores de indicadores ajustados

### `src/pages/Interactions.tsx`
- Labels: "Medio" → "Medio de Contacto"
- Label formulario: "Resultado" → "¿Qué pasó?"
- Labels resultados: lenguaje humano v2
- "Producto" → "Producto (múltiple)"
- Motivo de rechazo: texto libre → selector configurable
- Filtro: ancho aumentado, label "Resultados"

### `src/pages/Dashboard.tsx`
- Import de `useState`
- OwnerView: selector de período (Hoy/Semana/Mes/Trimestre/Semestre/Año)
- OwnerView: KPI "Ventas no concretadas" agregado
- OwnerView: grid 5 columnas
- OwnerView: bloque "Análisis y Estrategia" con 4 gráficos (motivos pérdida, ventas producto, ventas zona, distribución rubro)
- OwnerView: query incluye `interaction_lines` + `products`
- SellerView: botón "Registrar interacción" prominente
- SellerView: mensaje motivacional automático
- SellerView: KPI "Ventas no concretadas"
- Labels KPIs actualizados

### `src/pages/Clients.tsx`
- Label: "Nombre" → "Nombre y Apellido"
- Label: "Canal de origen" → "Canal de Ingreso"
- Campo "Persona de contacto" eliminado del formulario
- Validación WhatsApp (regex formato internacional)
- Botón Exportar CSV (respeta filtros)
- Botón Exportar PDF (ventana imprimible con estilos marca)
- Botón Importar CSV (mapeo automático, preview, detección duplicados)
- Dialog de previsualización importación

### `src/pages/Settings.tsx` (NUEVO)
- Tipo de cambio de referencia (USD → ARS/EUR)
- Integraciones: Google Calendar y Google Contacts (UI preparada)
- Info del sistema

### `src/components/AppSidebar.tsx`
- Import de icono `Settings`
- Item "Configuración" (admin/supervisor)

### `src/components/AppLayout.tsx`
- PAGE_TITLES: "/settings" → "Configuración"

### `src/components/NotificationsPanel.tsx`
- "Leads sin contacto" → "Contactos sin seguimiento"
- Variable renombrada

### `src/App.tsx`
- Import de `Settings`
- Ruta `/settings` agregada

### `.gitignore`
- `.env`, `.env.local`, `.env.*.local` agregados

### `Documents/` (NUEVO)
- INFORME_AVANCES_v1_vs_v2.md
- MEJORA_CRM_Manual_Tecnico_v1.docx
- MEJORA_CRM_Manual_Tecnico_v2.docx
- README.md
- DEPLOY.md
- ESTADO_FINAL.md

## Cobertura v2: 65/70 (93%)

| Módulo | Hecho | Total |
|---|---|---|
| Productos | 6 | 8 |
| Interacciones | 11 | 12 |
| Clientes | 11 | 11 |
| Nomenclatura | 8 | 8 |
| Colores | 6 | 6 |
| Vista Dueño | 9 | 10 |
| Vista Vendedor | 7 | 8 |
| Seguridad | 5 | 5 |
| Configuración | 2 | 2 |

## Gaps restantes (requieren APIs externas)
1. Google Calendar sync (OAuth)
2. Google Contacts import (OAuth)
3. OCR tarjetas de visita
4. Importar catálogo productos desde Excel/CSV
5. Alertas con contexto detallado
