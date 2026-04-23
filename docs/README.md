# MejoraCRM — Documentación del Proyecto

**Última actualización:** 23 abril 2026, 00:34 GMT+8
**Versión:** 2.0
**URL producción:** https://crm.mejoraok.com
**Repo:** https://github.com/pabloeckert/MejoraCRM

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| UI | shadcn/ui (Radix UI) + Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Gráficos | Recharts |
| Deploy | FTP/SSH a Hostinger (185.212.70.250) |
| Desarrollo | Mejora Continua® |

## Estructura de archivos

```
MejoraCRM/
├── src/
│   ├── components/
│   │   ├── ui/                    # 40+ componentes shadcn/ui
│   │   ├── AppLayout.tsx          # Layout + header + pageTitle
│   │   ├── AppSidebar.tsx         # Navegación lateral
│   │   ├── NavLink.tsx            # Links activos
│   │   └── NotificationsPanel.tsx # Alertas y notificaciones
│   ├── pages/
│   │   ├── Auth.tsx               # Login/Registro Supabase
│   │   ├── Dashboard.tsx          # Vista General (dueño/vendedor)
│   │   ├── Clients.tsx            # CRUD clientes + import/export
│   │   ├── Interactions.tsx       # Flujo 5 resultados
│   │   ├── Products.tsx           # Catálogo productos (admin)
│   │   ├── Settings.tsx           # Configuración (admin)
│   │   └── NotFound.tsx           # 404
│   ├── contexts/AuthContext.tsx   # Auth + roles
│   ├── integrations/supabase/     # Cliente + tipos
│   ├── hooks/                     # Custom hooks
│   └── lib/utils.ts              # Utilidades
├── supabase/
│   ├── migrations/                # Migraciones SQL
│   └── config.toml
├── Documents/                     # ← Esta carpeta
│   ├── README.md                  # Este archivo
│   ├── INFORME_AVANCES_v1_vs_v2.md
│   ├── MEJORA_CRM_Manual_Tecnico_v1.docx
│   ├── MEJORA_CRM_Manual_Tecnico_v2.docx
│   ├── DEPLOY.md                  # Instrucciones de deploy
│   ├── CAMBIOS_SESION_2026-04-22.md
│   └── ESTADO_FINAL.md
├── dist/                          # Build de producción
├── .env                           # Variables Supabase (NO commitear)
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

## Rutas

| Ruta | Componente | Acceso |
|---|---|---|
| `/auth` | Auth | Público |
| `/` | Dashboard | Todos |
| `/clients` | Clients | Todos |
| `/interactions` | Interactions | Todos |
| `/products` | Products | admin, supervisor |
| `/settings` | Settings | admin, supervisor |

## Base de datos (Supabase)

### Tablas
- **profiles** — nombre, avatar, user_id
- **user_roles** — user_id, role (admin/supervisor/vendedor)
- **clients** — nombre, empresa, whatsapp, email, rubro, canal, provincia, dirección, estado
- **interactions** — cliente, medio, resultado, monto, moneda, seguimiento, notas
- **interaction_lines** — producto, cantidad, precio unitario, total
- **products** — nombre, unidad, precio, categoría, moneda, activo

### Enums
- `app_role`: admin, supervisor, vendedor
- `client_status`: activo, potencial, inactivo
- `currency_code`: ARS, USD, EUR
- `interaction_medium`: whatsapp, llamada, email, reunion_presencial, reunion_virtual, md_instagram, md_facebook, md_linkedin, visita_campo
- `interaction_result`: presupuesto, venta, seguimiento, sin_respuesta, no_interesado
- `negotiation_state`: con_interes, sin_respuesta, revisando, pidio_cambios
- `followup_scenario`: vinculado, independiente, historico
- `quote_path`: catalogo, adjunto

### RLS
- Vendedor: ve/edita solo sus registros
- Supervisor: ve todo, no gestiona roles
- Admin: acceso total

## Paleta de colores

| Elemento | Hex | Uso |
|---|---|---|
| Azul primario | `#2C5CA5` | Sidebar, botones, links |
| Azul oscuro | `#1C4D8C` | Ítem activo sidebar |
| Fondo | `#F2F2F2` | Fondo general app |
| Blanco | `#FFFFFF` | Tarjetas, texto sidebar |
| Dorado | `#F2BC1B` | Acento, badges |
| Verde | `#2E7D32` | Ventas logradas |
| Naranja | `#F29422` | Ventas en curso |
| Rojo | `#D93D4A` | Ventas no concretadas |

## Deploy

Ver `DEPLOY.md` para instrucciones detalladas.

Resumen:
1. `npm install && npx vite build`
2. Subir contenido de `dist/` a `/home/u846064658/domains/mejoraok.com/public_html/crm`
3. SSH: `185.212.70.250:65002` usuario `u846064658`

## Supabase Config

En Supabase → Authentication → URL Configuration:
- Site URL: `https://crm.mejoraok.com`
- Redirect URLs: `https://crm.mejoraok.com`

---

*MejoraCRM · Mejora Continua · mejoraok.com*
