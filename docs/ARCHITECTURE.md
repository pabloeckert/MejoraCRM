# Arquitectura Técnica

## Estructura del proyecto

```
mejoracrm/
├── src/
│   ├── components/
│   │   ├── ui/              # Componentes shadcn/ui (40+)
│   │   ├── AppLayout.tsx    # Layout principal con sidebar
│   │   ├── AppSidebar.tsx   # Navegación lateral
│   │   ├── NavLink.tsx      # Links de navegación
│   │   └── NotificationsPanel.tsx
│   ├── pages/
│   │   ├── Index.tsx        # Dashboard principal
│   │   ├── Clients.tsx      # Gestión de clientes
│   │   ├── Interactions.tsx # Registro de interacciones
│   │   ├── Pipeline.tsx     # Kanban de oportunidades
│   │   ├── Reports.tsx      # Reportes y gráficos
│   │   ├── Auth.tsx         # Login/Registro
│   │   └── NotFound.tsx     # 404
│   ├── contexts/            # Contextos React
│   ├── hooks/               # Custom hooks
│   ├── integrations/        # Configuración Supabase
│   ├── lib/                 # Utilidades
│   └── assets/              # Imágenes, logos, fuentes
├── supabase/
│   ├── migrations/          # Migraciones SQL
│   └── config.toml
├── public/                  # Assets estáticos
└── documents/               # Documentación (esta carpeta)
```

## Routing (React Router v6)

| Ruta | Componente | Acceso |
|------|-----------|--------|
| `/` | Index (Dashboard) | Todos los roles |
| `/clients` | Clients | Todos los roles |
| `/interactions` | Interactions | Todos los roles |
| `/pipeline` | Pipeline | Todos los roles |
| `/reports` | Reports | Todos los roles |

## Sistema de colores (identidad Mejora Continua)

```css
--primary: #495F93;        /* Azul principal */
--accent: #E5C34B;         /* Dorado */
--destructive: #C64E4A;    /* Rojo */
--muted: #656565;          /* Gris */
--background: #000000;     /* Negro (sidebar oscuro) */
```

## Seguridad (RLS)

Todas las tablas tienen Row Level Security activado:

- **Vendedores** solo ven/editan sus propios registros
- **Supervisores** ven todo, no gestionan roles
- **Admins** acceso total incluyendo gestión de roles

Funciones SECURITY DEFINER:
- `has_role(user_id, role)` — Verifica rol del usuario
- `get_user_role(user_id)` — Obtiene rol principal
- `handle_new_user()` — Crea perfil automáticamente al registrarse

## Dependencias clave

| Paquete | Uso |
|---------|-----|
| `@supabase/supabase-js` | Backend-as-a-Service |
| `@tanstack/react-query` | Cache y fetching de datos |
| `@hello-pangea/dnd` | Drag & drop en Kanban |
| `recharts` | Gráficos de reportes |
| `react-hook-form` + `zod` | Formularios con validación |
| `lucide-react` | Iconografía |
| `sonner` | Toast notifications |
