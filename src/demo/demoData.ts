/**
 * ============================================================
 * MejoraCRM — Modo Demo
 * ============================================================
 *
 * Este archivo documenta el dataset de demostración y el flujo
 * sugerido de navegación para mostrar el CRM al cliente.
 *
 * DATOS DE PRUEBA:
 * El script SQL para cargar los datos está en: supabase/seed.sql
 * Ejecutarlo desde Supabase Dashboard → SQL Editor.
 *
 * USUARIOS DE PRUEBA:
 * ┌──────────────────────────────┬──────────────────────┬────────────┐
 * │ Email                        │ Rol                  │ Ve         │
 * ├──────────────────────────────┼──────────────────────┼────────────┤
 * │ sindygeisert@gmail.com       │ admin (dueña)        │ Todo       │
 * │ pabloeckert@gmail.com        │ admin (dueño)        │ Todo       │
 * │ mejoraok@gmail.com           │ vendedor             │ Sus datos  │
 * └──────────────────────────────┴──────────────────────┴────────────┘
 * Password para todos: [CONFIDENCIAL — usar credenciales del admin]
 *
 * ROLES EN EL SISTEMA:
 * - admin / supervisor → ven OwnerViewV2 (vista completa del equipo)
 * - vendedor → ven SellerViewV2 (solo sus datos)
 *
 * DATASET INCLUIDO:
 * - 8 clientes (Forestal, Agropecuario, Industrial, Construcción, Gobierno, Comercio)
 * - 5 productos (semillas, madera, servicios)
 * - 19 interacciones:
 *   • 6 ventas cerradas ($2,970,000 ARS + $7,500 USD)
 *   • 4 presupuestos en curso ($2,510,000 ARS + $15,000 USD)
 *   • 3 seguimientos pendientes
 *   • 3 seguimientos vencidos
 *   • 3 ventas perdidas ($1,000,000 ARS estimados)
 * - 3 perfiles (2 admins + 1 vendedor)
 * - 8 líneas de interacción (productos vendidos/presupuestados)
 *
 * FLUJO SUGERIDO DE NAVEGACIÓN:
 *
 * 1. LOGIN
 *    → Entrar como sindygeisert@gmail.com (admin)
 *    → Se ve el Onboarding Wizard (se puede cerrar)
 *
 * 2. VISTA GENERAL (Dueño)
 *    → 3 bloques: Resultados directos, Gestión comercial, Análisis
 *    → Verificar KPIs con datos reales
 *    → Verificar tendencias (flechas ↑↓)
 *    → Verificar ranking de vendedores
 *    → Verificar gráficos (motivos de pérdida, ventas por producto/zona/rubro)
 *
 * 3. PROCESO DE VENTAS
 *    → Pipeline con 6 etapas
 *    → Cards arrastrables (drag & drop)
 *    → Mover una card → se actualiza en Supabase
 *    → Filtros funcionando (búsqueda, etapa, monto, fecha)
 *
 * 4. CLIENTES
 *    → Lista con 8 clientes
 *    → Filtros por estado y provincia
 *    → Click en cliente → ver detalle + historial de interacciones
 *    → Crear nuevo cliente
 *    → Importar CSV
 *    → Exportar CSV/PDF
 *
 * 5. INTERACCIONES
 *    → Lista con 19 interacciones
 *    → Filtros por resultado y búsqueda
 *    → Crear nueva interacción (todos los resultados)
 *    → Ver cards con badges de estado
 *
 * 6. REPORTES
 *    → KPIs superiores
 *    → Funnel de ventas
 *    → Tendencia mensual
 *    → Top productos
 *    → Motivos de pérdida
 *    → Revenue por provincia
 *    → Exportar a PDF
 *
 * 7. PRODUCTOS
 *    → Catálogo con 5 productos
 *    → Crear/editar productos
 *    → Activar/desactivar
 *
 * 8. CONFIGURACIÓN
 *    → Tipo de cambio
 *    → Integraciones (Google Calendar, Contacts)
 *    → Notificaciones push
 *    → App instalable (PWA)
 *    → Cuenta y datos
 *
 * 9. CAMBIAR A VENDEDOR
 *    → Cerrar sesión
 *    → Entrar como mejoraok@gmail.com
 *    → Ver Vista General (Vendedor): sus ventas, tareas, resumen
 *    → Ver que solo ve sus interacciones
 *
 * 10. PIPELINE COMO VENDEDOR
 *    → Ver Proceso de ventas con sus oportunidades
 *    → Mover una card entre etapas
 *
 * MÉTRICAS ESPERADAS (con datos de seed.sql):
 * ┌──────────────────────────┬────────────────────────────┐
 * │ Métrica                  │ Valor esperado             │
 * ├──────────────────────────┼────────────────────────────┤
 * │ Ventas logradas          │ ~$2,970,000 ARS + $7,500   │
 * │ Ventas en curso          │ ~$2,510,000 ARS + $15,000  │
 * │ Ventas no concretadas    │ ~$1,000,000 ARS            │
 * │ Éxito de ventas          │ ~60% (6/10 presupuestos)   │
 * │ Seguimientos vencidos    │ 3                          │
 * │ Total clientes           │ 8                          │
 * │ Total interacciones      │ 19                         │
 * │ Ranking #1               │ Mejora OK (vendedor)       │
 * └──────────────────────────┴────────────────────────────┘
 */

/** Emails de los usuarios de demo */
export const DEMO_USERS = {
  admin1: { email: "sindygeisert@gmail.com", password: "T@beg2301", role: "admin", name: "Sindy Geisert" },
  admin2: { email: "pabloeckert@gmail.com", password: "T@beg2301", role: "admin", name: "Pablo Eckert" },
  seller: { email: "mejoraok@gmail.com", password: "T@beg2301", role: "vendedor", name: "Mejora OK" },
} as const;

/** Resumen del dataset de demostración */
export const DEMO_SUMMARY = {
  clients: 8,
  products: 5,
  interactions: 19,
  profiles: 3,
  interactionLines: 8,
  breakdown: {
    ventas: 6,
    presupuestos: 4,
    seguimientosPendientes: 3,
    seguimientosVencidos: 3,
    ventasPerdidas: 3,
  },
} as const;

/** Flujo de navegación sugerido para la demo */
export const DEMO_NAVIGATION_FLOW = [
  { step: 1, page: "Login", description: "Entrar como sindygeisert@gmail.com (admin). Cerrar onboarding si aparece." },
  { step: 2, page: "Vista General", description: "Revisar KPIs, tendencias, ranking, gráficos." },
  { step: 3, page: "Proceso de ventas", description: "Pipeline drag & drop. Mover una card." },
  { step: 4, page: "Clientes", description: "Ver lista, filtrar, ver detalle con timeline." },
  { step: 5, page: "Interacciones", description: "Ver historial, crear nueva interacción." },
  { step: 6, page: "Reportes", description: "Gráficos, funnel, exportar PDF." },
  { step: 7, page: "Productos", description: "Catálogo de 5 productos." },
  { step: 8, page: "Configuración", description: "Ajustes, integraciones, PWA." },
  { step: 9, page: "Cambiar a vendedor", description: "Logout → mejoraok@gmail.com. Ver vista reducida." },
  { step: 10, page: "Pipeline vendedor", description: "Ver solo sus oportunidades." },
] as const;
