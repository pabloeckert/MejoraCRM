# Registro de Cambios — MejoraCRM

## Historial de versiones

### 2026-04-22
- Creación de carpeta `documents/` con documentación del proyecto
- Documentación de arquitectura, base de datos y despliegue

### 2026-04-14 — v0.1.0 (Estado actual)
- Proyecto creado por Mejora Continua®
- Stack: React + TypeScript + Vite + Tailwind + shadcn/ui

**Base de datos (Supabase):**
- Tablas: profiles, user_roles, clients, interactions, opportunities, products
- RLS en todas las tablas con políticas por rol
- Enums para estados, tipos y etapas
- Seed de 10 productos forestales/agro
- Trigger automático de perfil al registrarse

**Módulos implementados:**
- **Dashboard** — KPIs y gráficos de ventas
- **Clientes** — CRUD completo con filtros y estados
- **Interacciones** — Registro rápido con timeline
- **Pipeline** — Kanban drag & drop con etapas
- **Reportes** — Gráficos de conversión y motivos de pérdida
- **Auth** — Login/registro con Supabase Auth

**Identidad de marca:**
- Paleta: Azul #495F93, Dorado #E5C34B, Rojo #C64E4A
- Sidebar oscuro estilo Notion/Linear
- Logos oficiales de Mejora Continua integrados
- Fuente: Inter

**Commits relevantes:**
- `636e50b` — Fix tailwind config brace
- `c9a455d` — Changes (Mejora Continua®)
- `1d3af6a` — Integrated brand fonts
- `74e6a7e` — Adjusted branding en sidebar
- `3689cc5` — Updated logos Mejora Continua
- `05dd6db` — Integrated Mejora logo and alerts
- `f3b045a` — Improved UX e identidad
- `4166a57` — Visualized CRM Mejora

---

## Roadmap (pendiente)

- [ ] Autenticación y protección de rutas por rol
- [ ] Panel de alertas y notificaciones
- [ ] Exportación de reportes (CSV/PDF)
- [ ] Filtros avanzados en todas las vistas
- [ ] Modo offline / PWA
- [ ] Integración WhatsApp Business API
- [ ] Dashboard personalizable por usuario
