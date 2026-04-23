# MejoraCRM

CRM desarrollado por **Mejora Continua®** para gestión de clientes, productos e interacciones.

## Stack

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Auth + PostgreSQL)
- **Gráficos:** Recharts

## Configuración

1. Clonar el repositorio
2. Copiar el archivo de entorno y completar las credenciales de Supabase:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
- `VITE_SUPABASE_PROJECT_ID` — ID del proyecto en Supabase
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Clave anónima (anon key)
- `VITE_SUPABASE_URL` — URL del proyecto Supabase

## Desarrollo

```bash
bun install
bun dev
```

## Despliegue

Producción: [crm.mejoraok.com](https://crm.mejoraok.com)

---

© Mejora Continua® — mejoraok.com
