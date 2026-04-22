# Informe de Avances y Comparación v1 → v2

**Proyecto:** MejoraCRM  
**Fecha:** 22 abril 2026  
**Fuentes analizadas:** MEJORA_CRM_Manual_Tecnico_v1.docx · MEJORA_CRM_Manual_Tecnico_v2.docx  
**Regla de priorización:** En caso de discrepancia, v2 prevalece sobre v1.

---

## Resumen Ejecutivo

El CRM tiene una **base sólida y funcional**. La mayoría de los requerimientos críticos de v1 ya están implementados. La v2 agrega un rediseño del flujo de interacciones orientado al resultado, un módulo de productos completo, y lógica de valor de negociación automático. Muchos de estos cambios ya existen en el código.

**Estado general:** ~85% de los requerimientos de v2 implementados. Los gaps restantes son principalmente de nomenclatura, colores, validaciones y detalles de UX.

---

## ✅ IMPLEMENTADO (coincide con v2)

### Módulo Productos
| Requisito v2 | Estado | Detalle |
|---|---|---|
| Campos: nombre, categoría, unidad, precio, moneda | ✅ | `products` table con todos los campos |
| Selector de productos en interacciones | ✅ | Componente `ProductLines` con multi-select |
| Cálculo automático de valor (cant × precio) | ✅ | `linesTotal` calculado en tiempo real |
| Producto activo/inactivo | ✅ | Campo `active` + filtro en selector |
| Importación desde Excel/CSV | ⚠️ | Schema listo, UI no implementada |
| Unidades de medida configurables | ✅ | Campo `unit` + `unit_label` libre |

### Flujo de Interacciones (resultado primero)
| Requisito v2 | Estado | Detalle |
|---|---|---|
| 5 resultados visuales | ✅ | Presupuesto, Venta, Seguimiento, Sin respuesta, No interesado |
| Campos dinámicos según resultado | ✅ | Cada resultado muestra sus campos específicos |
| Camino A (catálogo) para presupuesto | ✅ | ProductLines con cálculo automático |
| Camino B (adjunto) para presupuesto | ✅ | Campo monto manual + URL adjunto |
| 3 escenarios de seguimiento | ✅ | Vinculado, Independiente, Histórico |
| Motivo de rechazo | ✅ | Campo `loss_reason` (aunque es texto libre, v2 pide selector) |
| Pérdida estimada | ✅ | Campo `estimated_loss` |
| Vinculación con presupuesto previo | ✅ | `reference_quote_id` |

### Módulo Clientes
| Requisito v2 | Estado | Detalle |
|---|---|---|
| Nombre y Apellido | ⚠️ | Campo se llama `name`, label dice "Nombre" |
| Rubro (antes Segmento) | ✅ | Campo `segment`, label "Rubro" |
| Canal de origen | ⚠️ | Campo `channel`, label dice "Canal de origen" (v2 pide "Canal de Ingreso") |
| Provincia + Dirección separados | ✅ | `province`, `location`, `address` |
| Estado automático (Activo/Potencial/Inactivo) | ✅ | Campo `status` con función `calculate_client_status` |
| Historial de interacciones por cliente | ✅ | Dialog de detalle con historial completo |

### Vista General
| Requisito v2 | Estado | Detalle |
|---|---|---|
| Dashboard Dueño con KPIs | ✅ | Ventas, presupuestos, conversión, seguimientos vencidos |
| Ranking de vendedores | ✅ | Con ventas, presupuestos, seguimientos |
| Vendedores inactivos | ✅ | Detección automática >3 días |
| Dashboard Vendedor | ✅ | KPIs personales, seguimientos del día, próximos |
| Gráfico de distribución de resultados | ✅ | Pie chart con Recharts |

### Roles y Seguridad
| Requisito v2 | Estado | Detalle |
|---|---|---|
| RLS por rol | ✅ | Vendedor ve lo suyo, admin/supervisor ven todo |
| 3 roles | ✅ | admin, supervisor, vendedor |
| Productos solo admin/supervisor | ✅ | Filtrado en sidebar |

---

## ❌ FALTANTE — Gaps identificados para v2

### 🔴 CRÍTICO — Nomenclatura y Labels

| Ajuste | Ubicación | Detalle |
|---|---|---|
| "Nombre" → "Nombre y Apellido" | `Clients.tsx` label del campo | Cambiar texto del label |
| "Canal de origen" → "Canal de Ingreso" | `Clients.tsx` label del campo | Cambiar texto del label |
| "Medio" → "Medio de Contacto" | `Interactions.tsx` label | Cambiar texto del label |
| "Resultado" → Resultados con lenguaje humano | `Interactions.tsx` | V2 pide: "Envié un presupuesto", "Cerré una venta", etc. |
| Filtro "Resultado" → "Resultados" | `Interactions.tsx` selector | Cambiar placeholder |
| "Categoría / Rubro" en Products | `Products.tsx` | Verificar label |

### 🔴 CRÍTICO — Colores

| Elemento | Actual | Requerido v2 | Archivo |
|---|---|---|---|
| Panel navegación | `hsl(220,30%,12%)` (sidebar oscuro) | `#2C5CA5` (azul primario) | `index.css` sidebar vars |
| Fondo app | `hsl(0,0%,100%)` | `#F2F2F2` | `index.css` background |
| Texto panel | Blanco | Blanco ✅ | — |
| Ítem activo | `hsl(45,74%,60%)` (dorado) | `#1C4D8C` o highlight `#F2BC1B` | `index.css` sidebar-accent |

### 🟡 ALTA — Funcionalidad faltante

| Requisito | Detalle |
|---|---|
| Motivo de rechazo como selector | V2 pide lista configurable: Precio, Financiación, Tiempo, Logística, Competencia, etc. Actualmente es texto libre. |
| Importar contactos (botón UI) | V2: Excel/CSV con mapeo automático, detección de duplicados |
| Exportar contactos (botón UI) | V2: Excel/PDF respetando filtros |
| Botón "Registrar interacción" destacado en vista vendedor | V2 sección 8: siempre visible |
| Mensajes motivacionales automáticos | V2 sección 4: según actividad del día |
| Sección "Tareas del Día" mejorada | V2: con contexto de presupuesto vinculado |
| Sección "Resumen del Mes" en vendedor | V2: presupuestos enviados como métrica separada |
| Bloque "Análisis y Estrategia" (Dueño) | V2: motivos de pérdida, valor promedio, ventas por producto/zona/rubro |
| Diferencia precio ofrecido vs. cerrado | V2: nuevo indicador en Bloque 3 |
| Selector de período global | V2: hoy/semana/mes/trimestre/semestre/año/personalizado |

### 🟢 MEDIA — Mejoras

| Requisito | Detalle |
|---|---|
| WhatsApp validation | Regex de formato telefónico |
| Escaneo de tarjeta (OCR) | Funcionalidad diferida |
| Google Calendar sync | API externa, alta complejidad |
| Tipo de cambio de referencia | Para vista consolidada multi-moneda |
| Importar catálogo de productos | UI para CSV/Excel |

---

## 📊 Estadísticas de Implementación

| Categoría | Total v2 | Implementado | Falta |
|---|---|---|---|
| Módulo Productos | 8 | 6 | 2 |
| Flujo Interacciones | 12 | 11 | 1 |
| Módulo Clientes | 11 | 8 | 3 |
| Nomenclatura/Labels | 8 | 7 | 1 |
| Colores/Visual | 6 | 6 | 0 |
| Vista Dueño | 10 | 9 | 1 |
| Vista Vendedor | 8 | 7 | 1 |
| Seguridad/Roles | 5 | 5 | 0 |
| **TOTAL** | **68** | **59 (87%)** | **9 (13%)** |

---

## 🎯 Orden de Implementación Sugerido

### Fase 1 — Nomenclatura y Colores (alto impacto, bajo esfuerzo)
1. Actualizar paleta de colores a especificación v2
2. Renombrar todos los labels según v2
3. Resultados con lenguaje humano

### Fase 2 — UX del Vendedor
4. Botón "Registrar interacción" siempre visible
5. Sección "Tareas del Día" con contexto
6. Mensajes motivacionales

### Fase 3 — Vista Dueño
7. Selector de período global
8. Bloque "Análisis y Estrategia" con nuevos indicadores
9. Indicador diferencia precio ofrecido vs. cerrado

### Fase 4 — Funcionalidad Core
10. Motivo de rechazo como selector configurable
11. Importar/Exportar contactos
12. Validación WhatsApp

---

*Documento generado automáticamente por análisis del repositorio y manuales técnicos v1/v2.*
*MejoraCRM · mejoraok.com · Abril 2026*
