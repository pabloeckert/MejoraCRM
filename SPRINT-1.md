# Sprint 1 — Identidad y Lenguaje

Estado: PENDIENTE
Inicio: Próxima sesión
Duración estimada: 1 semana

---

## Tarea 1: Aplicar Identidad Visual MC 2026

### Archivos a modificar:
- tailwind.config.ts — paleta de colores
- src/index.css — variables CSS, tipografía
- index.html — Google Fonts (Inter como fallback)
- src/assets/ — reemplazar logos

### Colores extraidos del logo MC (Guía de Estilo 2026):
```
primary (púrpura/magenta): #8B2D6B (gradiente del M en el logo)
accent (dorado/mostaza): #F2BC1B (gradiente del C y texto "comunidad de negocios")
background: #FFFFFF (blanco puro)
background-alt: #F2F2F2 (gris plata)
foreground: #000000 (negro)
muted: #656565 (gris plomo — texto secundario)
destructive: #D93D4A (rojo alerta)
success: #2E7D32 (verde para ventas logradas)
warning: #F29422 (naranja — también del logo, para ventas en curso)
```

Nota: El logo tiene un gradiente púrpura→naranja→dorado. Para la UI usamos:
- Botones principales: púrpura #8B2D6B
- Acentos/highlights: dorado #F2BC1B  
- Estados de venta: verde/amarillo/naranja/rojo

### Tipografía:
- Cargar Bw Modelica si está disponible
- Fallback: Inter (Google Fonts)
- Configurar en tailwind.config.ts

### Logo:
- Reemplazar src/assets/logo.png y logo-white.png por versiones MC
- Actualizar AppSidebar.tsx para usar nuevo logo

---

## Tarea 2: Renombrar Lenguaje

### Cambios en toda la app:
| Antes | Después |
|-------|---------|
| Dashboard | Vista General |
| Pipeline | Proceso de ventas |
| Pipeline activo | Ventas en curso |
| Tasa de conversión | Éxito de ventas |
| Pipeline por etapa | Proceso por etapa |
| Lead | Contacto |
| Leads sin contacto reciente | Contactos sin seguimiento |

### Archivos a revisar:
- src/components/AppSidebar.tsx — items del menú
- src/pages/Dashboard.tsx — títulos
- src/components/dashboard/OwnerView.tsx, SellerView.tsx, OwnerViewV2.tsx, SellerViewV2.tsx
- src/pages/Reports.tsx
- src/modules/pipeline_v2/ — todos los archivos
- src/pages/Clients.tsx
- src/pages/Interactions.tsx
- src/components/interactions/
- src/demo/demoData.ts

---

## Tarea 3: Eliminar Pipeline del Sidebar

### Acciones:
- Quitar item "Proceso de ventas" (antes "Pipeline") de AppSidebar.tsx
- NO borrar el módulo pipeline_v2/ todavía (se migra en Sprint 2)
- Solo quitar la navegación

---

## Tarea 4: Roles Diferenciados

### Vendedor (role === "vendedor"):
- Solo ve: Vista General, Clientes, Interacciones
- NO ve: Reportes, Productos, Configuración
- Vista General muestra panel operativo personal (no métricas de equipo)
- Botón destacado "Registrar interacción"

### Dueño/Admin (role === "admin" o "supervisor"):
- Ve todo
- Vista General muestra métricas de equipo
- Acceso a Reportes, Productos, Configuración

### Archivos:
- src/components/AppSidebar.tsx — ya tiene lógica de roles, verificar
- src/pages/Dashboard.tsx — ya filtra por rol, verificar
- src/contexts/AuthContext.tsx — roles en demo data

---

## Tarea 5: Actualizar Demo Data

### src/demo/demoData.ts:
- Nombres argentinos realistas
- Interacciones con los 5 resultados nuevos
- Productos con unidades de medida
- Perfiles con roles correctos
- Datos que reflejen el flujo resultado-first

---

## Criterio de Aceptación del Sprint 1:
1. La app usa los colores de MC 2026 (púrpura, blanco, gris)
2. El logo de MC aparece en el sidebar
3. Todo el lenguaje es humano (sin "pipeline", "lead", "dashboard")
4. El Pipeline NO aparece en el menú
5. El vendedor solo ve sus módulos
6. Los datos demo reflejan el nuevo flujo
7. La app compila sin errores (bun dev funciona)
