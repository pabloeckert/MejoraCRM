# MejoraCRM — Documentación

CRM para **Mejora Continua**, empresa forestal/agro. Diseñado para PyMEs familiares de 1-5 usuarios.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui |
| Backend | Supabase (Auth, PostgreSQL, RLS) |
| Gráficos | Recharts |
| Kanban | @hello-pangea/dnd |
| Deploy | FTP → crm.mejoraok.com |

## Roles de usuario

- **Admin** — Acceso total, gestiona roles y productos
- **Supervisor** — Ve todos los datos, no gestiona roles
- **Vendedor** — Ve solo sus propios clientes, interacciones y oportunidades

## Módulos principales

1. **Dashboard** — KPIs, gráficos de ventas, alertas de seguimiento
2. **Clientes** — CRUD con filtros, estados (Lead → Cliente → Inactivo)
3. **Interacciones** — Registro rápido, timeline por cliente
4. **Pipeline** — Kanban visual con drag & drop
5. **Reportes** — Conversión, motivos de pérdida, ventas por período

## Documentación

- [Arquitectura técnica](./ARCHITECTURE.md)
- [Base de datos](./DATABASE.md)
- [Despliegue](./DEPLOYMENT.md)
- [Registro de cambios](./CHANGELOG.md)

## Enlaces

- **Repositorio:** https://github.com/pabloeckert/mejoracrm
- **Producción:** https://crm.mejoraok.com
- **Lovable:** Proyecto creado con Lovable.dev
