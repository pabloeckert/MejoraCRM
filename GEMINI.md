# GEMINI.md - MejoraCRM

Este archivo proporciona instrucciones estratégicas y contexto técnico para trabajar con la base de código de **MejoraCRM**.

## Descripción del Proyecto

MejoraCRM es una plataforma de gestión de relaciones con clientes (CRM) diseñada para **Mejora Continua®**. Permite gestionar clientes, productos e interacciones comerciales (presupuestos, ventas, seguimientos).

- **Propósito:** Centralizar el flujo comercial y KPIs para administradores y vendedores.
- **Stack Tecnológico:** React 18 (SWC), TypeScript, Vite, Supabase (Auth & DB), TanStack Query (v5), Tailwind CSS, shadcn/ui, Recharts.
- **Estado de Autenticación:** Soporta un `DEMO_MODE` por defecto que utiliza datos estáticos sin necesidad de una conexión real a Supabase.

## Comandos de Desarrollo

| Acción | Comando |
|---|---|
| Instalar dependencias | `bun install` |
| Servidor de desarrollo | `bun dev` |
| Construir para producción | `bun build` |
| Ejecutar tests unitarios | `bun test` |
| Ejecutar tests E2E | `bun test:e2e` |
| Verificación de tipos | `bun x tsc --noEmit` |
| Linting | `bun lint` |

## Arquitectura y Convenciones

### 1. Manejo de Datos y Demo Mode
La aplicación utiliza una constante `DEMO_MODE` (derivada de `VITE_DEMO_MODE` en `.env`) para decidir si llamar a Supabase o usar `src/demo/demoData.ts`.
- **Hooks de Datos:** Cada hook en `src/hooks/` sigue el patrón: `if (DEMO_MODE) return DEMO_DATA; else -> supabase.from(...)`.
- **Query Keys:** Las llaves de TanStack Query deben incluir el estado del demo mode para evitar colisiones: `["clients", DEMO_MODE ? "demo" : "live"]`.

### 2. Estructura de Archivos
- `src/pages/`: Componentes orquestadores de alto nivel. Usan `React.lazy` para code-splitting.
- `src/components/`: Subcomponentes organizados por dominio (ej. `clients/`, `interactions/`).
- `src/lib/`: Lógica de negocio pura (`businessLogic.ts`), cálculos (`calculations.ts`), esquemas de validación (`schemas.ts`) y constantes (`constants.ts`). **Mantener la lógica de negocio separada de los componentes React.**
- `src/contexts/`: Manejo de estado global (especialmente `AuthContext.tsx`).

### 3. Identidad Visual (Mejora Continua®)
Es crítico respetar la paleta de colores oficial definida en `src/lib/constants.ts` y `CLAUDE.md`:
- **Azul Marino:** `#020659` (Primary / Sidebar)
- **Azul Medio:** `#1C4D8C` (Hover / Accent)
- **Amarillo:** `#F2BB16` (Highlight)
- **Rojo:** `#D9072D` (Destructivo / Alertas)
- **Fuentes:** Bw Modelica (Cuerpo), League Spartan (Display).

### 4. Base de Datos (Supabase)
- Las migraciones se encuentran en `supabase/migrations/`.
- No editar `src/integrations/supabase/types.ts` manualmente; se genera desde la CLI de Supabase.
- Las funciones RPC clave incluyen `get_dashboard_data` y `get_notifications_data`.

## Flujo de Trabajo Recomendado

1. **Prioridad de Lógica:** Antes de modificar un componente, verifica si el cambio pertenece a `src/lib/businessLogic.ts` o `src/lib/calculations.ts`.
2. **Validación:** Los formularios deben usar `react-hook-form` con validación Zod (`src/lib/schemas.ts`).
3. **Tests:** Si agregas lógica de negocio, añade un test en `*.test.ts`. Para nuevas rutas o flujos críticos, considera un test de Playwright en `e2e/`.
4. **PWA:** La app es una PWA. Cualquier cambio en assets debe considerar el service worker y el manifiesto.

## Pendientes Técnicos
- Configurar servidor de notificaciones Push (VAPID keys).
- Integración con Google Calendar.
- Reemplazar íconos placeholder de PWA por logos reales de MC.
