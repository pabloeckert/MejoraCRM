# Análisis de Brechas — MejoraCRM

**Fecha:** 2026-04-22
**Estado actual:** v0.1.0 (MVP funcional — Mejora Continua®)
**Fuentes:** Requerimientos Base + Ajustes Solicitados + Manual de Tono

---

## Resumen ejecutivo

El CRM tiene una **base sólida** pero necesita trabajo significativo en:
1. Renombrar toda la UI al lenguaje simple solicitado
2. Eliminar la sección Pipeline como módulo separado
3. Rediseñar el Dashboard/Vista General para dueño y vendedor
4. Mejorar el módulo de Clientes (campos, import/export)
5. Ampliar Interacciones (medios, multi-producto, cotizaciones)
6. Implementar tono de marca en toda la UI

---

## ✅ HECHO (Requerimientos base)

| Requisito | Estado | Detalle |
|-----------|--------|---------|
| Tablas de BD (6) | ✅ | profiles, user_roles, clients, interactions, opportunities, products |
| RLS por rol | ✅ | Vendedor ve lo suyo, supervisor/admin ven todo |
| Roles (3) | ✅ | admin, supervisor, vendedor |
| CRUD Clientes | ✅ | Alta, edición, filtros, búsqueda |
| CRUD Interacciones | ✅ | Registro rápido con filtros |
| Pipeline Kanban | ✅ | Drag & drop con 6 etapas |
| Dashboard | ✅ | KPIs básicos, gráficos |
| Reportes | ✅ | Conversión, ventas, motivos de pérdida |
| Auth Supabase | ✅ | Login/registro |
| Productos seed | ✅ | 10 productos forestales/agro |
| Alertas básicas | ✅ | NotificationsPanel con seguimientos vencidos |
| Diseño visual | ✅ | shadcn/ui, sidebar oscuro, identidad de marca |

---

## ❌ NO HECHO — Ajustes solicitados

### CLIENTES

| Ajuste | Prioridad | Dificultad | Detalle |
|--------|-----------|------------|---------|
| Nombre → "Nombre y Apellido" | Alta | Fácil | Cambiar label en formulario |
| Borrar campo "Contacto" | Alta | Fácil | Eliminar del formulario y DB |
| Validar WhatsApp | Alta | Media | Regex de formato +54 9 XXX XXXX |
| Segmento → "Rubro" | Alta | Fácil | Renombrar label |
| Canal → "Canal de Ingreso" | Alta | Fácil | Renombrar label |
| Ubicación → Dirección + Provincia/País | Alta | Media | Agregar 2 campos, migrar datos |
| Estado automático (Activo/Potencial/Inactivo) | Alta | Difícil | Lógica según interacciones recientes |
| Importar contactos | Alta | Difícil | CSV/Excel, Google Contacts API, WhatsApp |
| Exportar contactos | Alta | Media | Generar CSV/Excel para descargar |
| Escanear tarjeta de presentación | Baja | Muy difícil | OCR + extracción de datos |

### INTERACCIONES

| Ajuste | Prioridad | Dificultad | Detalle |
|--------|-----------|------------|---------|
| "Medio de Contacto" (label) | Alta | Fácil | Renombrar |
| Reunión → "Presencial" / "Virtual" | Alta | Fácil | Cambiar enum + UI |
| Redes → "MD Instagram", "MD Facebook", "MD LinkedIn" | Alta | Media | Cambiar enum + migrar datos |
| "Tipo de Interacción" (label) | Alta | Fácil | Renombrar |
| Fecha seguimiento → Google Calendar sync | Media | Muy difícil | API de Google Calendar |
| Producto multi-select | Alta | Difícil | Cambiar schema (tabla intermedia o array) |
| Subir proforma (JPG/PNG/PDF) | Alta | Difícil | Storage Supabase + campo adjunto |
| Extraer precio de proforma automáticamente | Baja | Muy difícil | OCR/IA para leer imagen |
| Carga formal de "Cotización" | Alta | Media | Nuevo flujo en UI |
| Campos obligatorios (todos excepto próximo paso, fecha, obs) | Alta | Media | Validación en formulario |
| Historial por cliente (buscar → ver todo) | Alta | Media | Vista agrupada por cliente |

### PIPELINE

| Ajuste | Prioridad | Dificultad | Detalle |
|--------|-----------|------------|---------|
| Eliminar sección Pipeline como módulo | Alta | Difícil | Mover lógica a Interacciones |
| Producto + Monto en Interacciones | Alta | Difícil | Reestructurar flujo |

### TERMINOLOGÍA (toda la app)

| De | A | Alcance |
|----|---|---------|
| Dashboard | Vista general | Sidebar, título página, rutas |
| Pipeline | Proceso de ventas | Sidebar, título, rutas |
| Pipeline activo | Ventas en curso | Dashboard |
| Tasa de conversión | Éxito de ventas | Dashboard, reportes |
| Pipeline por etapa | Proceso por etapa | Dashboard |
| Lead | Contacto | Clientes, interacciones, everywhere |
| Leads sin contacto reciente | Contactos sin seguimiento | Dashboard, alertas |

### VISTA GENERAL — DUEÑO/GERENTE

| Elemento | Prioridad | Dificultad | Detalle |
|----------|-----------|------------|---------|
| Unificar Dashboard + Reportes | Alta | Difícil | Rediseñar estructura |
| Bloque "Resultados directos" | Alta | Media | Ventas logradas, en curso, no concretadas |
| Bloque "Gestión comercial" | Alta | Media | Seguimientos vencidos, contactos nuevos/atendidos/sin seguimiento |
| Bloque "Rendimiento del equipo" | Alta | Difícil | Ventas por vendedor, % ganadas, tiempo cierre |
| Bloque "Análisis y estrategia" | Alta | Media | Motivos pérdida, valor promedio, ventas por producto/zona/rubro |
| Micro-indicadores (↑↓) | Media | Media | Tendencias visuales |
| Alertas suaves con contexto | Media | Media | "Seguimientos vencidos: 5 (revisar antes del viernes)" |
| Bloques expandibles | Baja | Difícil | Click → abre listado detallado |

### VISTA GENERAL — VENDEDOR

| Elemento | Prioridad | Dificultad | Detalle |
|----------|-----------|------------|---------|
| "Tus Ventas" (logradas/en curso/no concretadas) | Alta | Media | KPIs específicos por vendedor |
| "Tareas del Día" | Alta | Difícil | Seguimientos pendientes, contactos por realizar, citas |
| "Resumen del Mes" | Alta | Media | Ventas mes, contactos nuevos, seguimientos, clientes atendidos |
| "Ritmo de Trabajo" (mensajes motivacionales) | Media | Media | Texto dinámico según actividad |

### TONO DE MARCA

| Área | Prioridad | Dificultad | Detalle |
|------|-----------|------------|---------|
| Copia de botones | Alta | Fácil | Revisar todos los CTAs |
| Mensajes vacíos / estados vacíos | Alta | Fácil | Reescribir con tono de marca |
| Notificaciones y toasts | Alta | Fácil | Revisar mensajes de éxito/error |
| Labels y títulos | Alta | Fácil | Revisar toda la UI |
| Mensajes motivacionales (vendedor) | Media | Media | Crear banco de frases |

---

## 📊 Estadísticas

| Categoría | Total | Hecho | Falta |
|-----------|-------|-------|-------|
| Requerimientos base | 12 | 12 | 0 |
| Ajustes Clientes | 11 | 0 | 11 |
| Ajustes Interacciones | 11 | 0 | 11 |
| Ajustes Pipeline | 2 | 0 | 2 |
| Cambios de terminología | 7 | 0 | 7 |
| Vista Dueño | 8 | 0 | 8 |
| Vista Vendedor | 4 | 0 | 4 |
| Tono de marca | 5 | 0 | 5 |
| **TOTAL** | **60** | **12** | **48** |

---

## 🎯 Sugerencia de implementación (orden lógico)

### Fase 1 — Terminología y Tono (rápido, alto impacto visual)
1. Renombrar todos los labels y textos
2. Aplicar tono de marca en copias
3. Eliminar sección Pipeline del sidebar

### Fase 2 — Clientes (funcionalidad core)
4. Renombrar/ajustar campos del formulario
5. Agregar Dirección + Provincia/País
6. Estado automático según interacciones
7. Importar/exportar contactos (CSV)

### Fase 3 — Interacciones (funcionalidad core)
8. Ajustar medios de contacto (reunión presencial/virtual, MD redes)
9. Multi-producto
10. Campos obligatorios
11. Historial por cliente

### Fase 4 — Vista General (rediseño mayor)
12. Vista Dueño/Gerente con bloques
13. Vista Vendedor con métricas
14. Mensajes motivacionales

### Fase 5 — Avanzado (días/semanas)
15. Cotización con upload de archivos
16. Google Calendar sync
17. Importar desde Google Contacts/WhatsApp
18. OCR de tarjetas de visita
