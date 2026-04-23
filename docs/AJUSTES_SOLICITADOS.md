# Ajustes CRM — Últimos cambios solicitados

Fuente: `Ajustes_CRM.docx` (archivo original del cliente)

## CLIENTES

- **Nombre:** que diga "Nombre y Apellido" (no solo "Nombre")
- **Contacto:** borrar ese casillero
- **WhatsApp:** validar formato
- **Segmento:** cambiar nombre por "Rubro"
- **Canal:** cambiar nombre por "Canal de Ingreso"
- **Ubicación:** dividir en dos campos: "Dirección" y "Provincia/País"
- **Estado:** agregar campo y que el sistema lo calcule automáticamente según interacciones:
  - **Activo** — tiene interacciones recientes
  - **Potencial** — lead sin cierre aún
  - **Inactivo** — sin actividad en X días

### Importar / Exportar contactos
- Botón "Importar contactos" desde: WhatsApp, Google Contacts, Excel, PDF
- Botón "Exportar contactos" a Excel o PDF
- Escanear tarjeta de presentación → cargar como nuevo cliente (OCR)

## INTERACCIONES

- **Medio:** renombrar "Medio de Contacto":
  - Sacar "Reunión" genérica → poner "Reunión presencial" y "Reunión virtual"
  - Sacar "Redes" genérica → poner "MD Instagram", "MD Facebook", "MD LinkedIn"
- **Tipo:** renombrar "Tipo de Interacción"
- **Fecha de seguimiento:** vincular con Google Calendar (sync móvil + PC)
- **Producto:** permitir seleccionar varios productos (multi-select)
- **Cotización:** si el tipo es "Cotización", poder subir JPG/PNG/PDF de la proforma → el CRM identifica automáticamente el precio final
- **Cargar Cotización:** agregar carga formal de cotización
- **Campos obligatorios:** todos son obligatorios EXCEPTO próximo paso, fecha de seguimiento y observaciones
- **Historial por cliente:** en interacciones, buscar cliente → ver historial completo (patrones, precios, decisiones)

## GENERAL — Cambio de terminología

| Término técnico | Término nuevo (simple) |
|----------------|----------------------|
| Dashboard | Vista general |
| Pipeline | Proceso de ventas |
| Pipeline activo | Ventas en curso |
| Tasa de conversión | Éxito de ventas |
| Pipeline por etapa | Proceso por etapa |
| Lead | Contacto |
| Leads sin contacto reciente | Contactos sin seguimiento |

## PIPELINE (SECCIÓN) — ELIMINAR

- Eliminar la sección "Pipeline" como módulo separado
- La carga de Producto y Monto de Propuesta pasa a Interacciones
- Agregar "Cotización" en la parte de interacciones

## VISTA GENERAL — DUEÑO/GERENTE

Unificar métricas de Dashboard + Reportes en una sola "Vista General".

### Estructura (orden de visualización):

**RESULTADOS DIRECTOS (arriba):**
- Ventas logradas
- Ventas en curso
- Ventas no concretadas

**COLUMNA IZQUIERDA — GESTIÓN COMERCIAL:**
- Seguimientos vencidos
- Contactos nuevos
- Contactos atendidos
- Contactos sin seguimiento

**COLUMNA DERECHA — RENDIMIENTO DEL EQUIPO:**
- Ventas logradas por vendedor
- Porcentaje de ventas ganadas
- Tiempo hasta cerrar una venta

**BLOQUE INFERIOR — ANÁLISIS Y ESTRATEGIA:**
- Motivos de pérdida
- Valor promedio de cada venta
- Ventas por producto
- Ventas por zona
- Distribución por rubro

### Extras:
- Micro-indicadores visuales (↑ mejora, ↓ caída)
- Alertas suaves: "Seguimientos vencidos: 5 (revisar antes del viernes)"
- Diseño modular con bloques expandibles
- Lenguaje simplificado (sin tecnicismos)

## VISTA GENERAL — VENDEDOR

**1. Tus Ventas:**
- Ventas logradas (verde)
- Ventas en curso (naranja)
- Ventas no concretadas (rojo)

**2. Tareas del Día:**
- Seguimientos pendientes
- Contactos por realizar
- Citas programadas

**3. Resumen del Mes:**
- Tus ventas este mes
- Contactos nuevos
- Seguimientos realizados
- Clientes atendidos

**4. Ritmo de Trabajo:**
- Mensajes motivacionales automáticos:
  - "Buen ritmo de trabajo este mes 👍"
  - "Ya registraste todas tus llamadas del día 👏"

> Objetivo: ordenar lo que el equipo ya hace, sin agregar complejidad. Promover registro y mejora continua. Motivar con reconocimiento, no con presión.
