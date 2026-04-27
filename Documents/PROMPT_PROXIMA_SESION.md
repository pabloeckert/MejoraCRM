# Prompt para próxima sesión — MejoraCRM

## Contexto rápido

**MejoraCRM** es un CRM web para gestión de clientes, interacciones comerciales y productos. Sector forestal/agropecuario argentino. Desarrollado por **Mejora Continua®**.

- **Repo:** https://github.com/pabloeckert/MejoraCRM
- **Producción:** https://crm.mejoraok.com (⚠️ HOSTING CAÍDO — ver abajo)
- **Email:** hola@mejoraok.com
- **Stack:** React 18 + TypeScript + Vite 6 + Supabase (Auth + PostgreSQL) + Tailwind/shadcn
- **Package manager:** Bun
- **Documentación:** `Documents/DOCUMENTACION.md` — documento vivo, leer sección 12 para historial

## Situación crítica: Sin hosting

El 27/04/2024 se salió de Hostinger. El deploy FTP apunta a un servidor que ya no existe. Solo se conservó el email hola@mejoraok.com.

**Acción inmediata (Etapa 0):**
1. Elegir hosting → **Vercel recomendado** (ver sección 6 de DOCUMENTACION.md)
2. Configurar DNS: `crm.mejoraok.com` → nuevo hosting
3. Configurar env vars de Supabase en el hosting
4. Actualizar GitHub Actions (remover FTP)
5. Verificar SSL y PWA en nuevo hosting
6. **Rotar anon key de Supabase** — expuesta en commit histórico del repo público

## Instrucciones para el agente

1. Leer `Documents/DOCUMENTACION.md` — secciones 1-6 mínimo (visión, stack, arquitectura, DB, seguridad, infraestructura)
2. Leer sección 9 (plan por etapas) para saber qué está completo y qué no
3. Cuando el usuario diga **"documentar"**: actualizar secciones 12 y 13 de DOCUMENTACION.md
4. Hacer commit y push después de cada cambio funcional
5. Verificar siempre: `bun run tsc --noEmit` + `bun run test` + `bun run build` antes de pushear

## Tareas pendientes (priorizadas)

### P0 — Infraestructura (Etapa 0)
- [ ] Migrar hosting a Vercel o Cloudflare Pages
- [ ] Configurar DNS crm.mejoraok.com
- [ ] Rotar anon key de Supabase
- [ ] Actualizar GitHub Actions (remover FTP deploy)
- [ ] Verificar SSL + PWA en nuevo hosting

### P1 — Monitoring y observabilidad (Etapa 6)
- [ ] Sentry error tracking (crear cuenta gratuita)
- [ ] UptimeRobot para uptime monitoring
- [ ] Backup automático de Supabase

### P1 — Testing
- [ ] Tests E2E con Playwright (login, crear interacción, pipeline)
- [ ] Tests para hooks: useClients, useInteractions, useProducts
- [ ] Tests para componentes: InteractionCard, KPICard

### P1 — UX Research (Etapa 7)
- [ ] Entrevistar 5 usuarios alpha
- [ ] Crear 3 user personas
- [ ] Test de usabilidad con 3-5 usuarios

### P2 — Frontend
- [ ] Reducir 38 `any` types restantes (Reports: 8, InteractionForm: 6, Clients: 5, Pipeline: 4)
- [ ] Migrar Clients.tsx a react-hook-form + zod
- [ ] Migrar Products.tsx a react-hook-form + zod
- [ ] Google Calendar OAuth en Settings

### P2 — Contenido y soporte
- [ ] Guía de usuario con screenshots
- [ ] Canal de soporte (email + FAQ in-app)
- [ ] NPS survey in-app
- [ ] Meta tags + OG image + sitemap

### P3 — Futuro
- [ ] Multi-tenant (si se comercializa)
- [ ] WhatsApp Business API
- [ ] Scoring de leads con ML
- [ ] App nativa (iOS/Android)

## Comandos útiles

```bash
# Verificar compilación
bun run tsc --noEmit

# Ejecutar tests
bun run test

# Build de producción
bun run build

# Ver any types restantes
grep -rn ": any" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".d.ts" | grep -v "types.ts" | grep -v "__tests__"

# Deploy (automático al pushear a main, una vez configurado hosting)
git add -A && git commit -m "mensaje" && git push origin main
```

## Arquitectura del proyecto

```
src/
├── components/
│   ├── dashboard/     # KPICard, OwnerView, SellerView
│   ├── interactions/  # InteractionCard, InteractionForm, ProductLines
│   ├── skeletons/     # DashboardSkeleton, ListSkeleton
│   ├── ui/            # 15 componentes shadcn/ui
│   └── ...            # AppLayout, AppSidebar, CommandPalette, ErrorBoundary
├── hooks/             # useClients, useDashboard, useInteractions, etc.
├── integrations/supabase/  # client.ts, types.ts (autogenerado)
├── lib/
│   ├── calculations.ts  # Lógica de negocio (KPIs, ranking)
│   ├── notifications.ts # Push notifications API
│   ├── schemas.ts       # Zod schemas para formularios
│   ├── types.ts         # Tipos compartidos
│   └── utils.ts         # cn() helper
├── pages/             # Dashboard, Clients, Interactions, Products, Pipeline, Reports, Settings, Auth, Privacy, Terms
└── contexts/          # AuthContext
```

## Base de datos

- **Supabase project:** `fkjuswkjzaeuogctsxpw`
- **Tablas:** profiles, user_roles, clients, interactions, interaction_lines, products, audit_log
- **RPCs:** get_dashboard_data(), get_notifications_data(), get_seller_ranking(), request_account_deletion()
- **Vistas materializadas:** mv_seller_ranking, mv_client_summary (refresh cada 30 min con pg_cron)
- **Setup completo:** `Documents/SETUP_COMPLETO.sql` (ejecutar si se crea proyecto Supabase nuevo)

## Notas importantes

- El `.env` tiene credenciales de Supabase — **nunca commitear**
- Las credenciales FTP (Hostinger) están en GitHub Secrets pero ya no son válidas
- La anon key de Supabase está expuesta en un commit histórico → **rotar en Supabase Dashboard**
- `supabase/config.toml` tiene un project_id viejo (`shjzgxsqkhexuwyipdmd`) — el actual es `fkjuswkjzaeuogctsxpw`
- El repo es **público** — no poner secrets en código
