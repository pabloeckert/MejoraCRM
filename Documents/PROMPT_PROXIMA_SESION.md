# Prompt para próxima sesión — MejoraCRM

## Contexto

Estás trabajando en **MejoraCRM**, un CRM web para gestión de clientes, interacciones comerciales y productos. Desarrollado por Mejora Continua®.

- **Repo:** https://github.com/pabloeckert/mejoracrm
- **Producción:** https://crm.mejoraok.com
- **Stack:** React 18 + TypeScript + Vite 6 + Supabase (Auth + PostgreSQL) + Tailwind/shadcn
- **Package manager:** Bun (pero npm funciona también)
- **Documentación:** `Documents/DOCUMENTACION.md` — documento vivo, sección 9 tiene el registro de cambios

## Instrucciones

1. Leer `Documents/DOCUMENTACION.md` para entender el estado actual del proyecto
2. Leer `Documents/RUNBOOK_INCIDENTES.md` si hay problemas
3. Cuando diga **"documentar"**, actualizar `Documents/DOCUMENTACION.md` con los trabajos realizados
4. Hacer commit y push después de cada cambio funcional
5. Verificar siempre: `tsc --noEmit` + `vitest run` + `vite build` antes de pushear

## Tareas pendientes (priorizadas)

### 1. Google Calendar OAuth (7.a) — PRIORITARIO
El usuario quiere integrar Google Calendar para sincronizar fechas de seguimiento.

**Requiere acción del usuario:**
- Crear proyecto en Google Cloud Console
- Habilitar Google Calendar API
- Crear OAuth 2.0 Client ID (Web application)
- Authorized redirect URI: `https://crm.mejoraok.com/settings`
- Copiar Client ID y Client Secret

**Lo que hay que implementar:**
- OAuth flow en Settings.tsx (botón "Conectar Google Calendar")
- Supabase Edge Function o API route para intercambiar código por token
- Almacenar access_token/refresh_token en tabla `user_integrations`
- Sync de interacciones con follow_up_date → Google Calendar events
- Manejo de expiración y refresh de tokens

### 2. Reducir `any` types restantes (38 remaining)
Los más importantes:
- `src/pages/Reports.tsx` (8 any) — charts de Recharts
- `src/components/interactions/InteractionForm.tsx` (6 any) — form handlers
- `src/pages/Clients.tsx` (5 any) — CRUD operations
- `src/pages/Pipeline.tsx` (4 any) — kanban cards

### 3. Migrar más formularios a react-hook-form + zod
- `src/pages/Clients.tsx` — formulario de creación/edición de clientes
- `src/pages/Products.tsx` — formulario de productos
- Reusar el patrón de `src/lib/schemas.ts`

### 4. Tests adicionales
- Tests para hooks: useClients, useInteractions, useProducts
- Tests para componentes: InteractionCard, KPICard
- Tests para Pipeline (agrupación por columna)
- Objetivo: 60+ tests

### 5. Etapa 6 pendiente (si el usuario lo pide)
- 6.4: Staging environment (guía en `Documents/GUIA_STAGING.md`)
- 6.5: Deploy moderno (Vercel/Cloudflare Pages)
- 6.6: UptimeRobot monitoreo
- 6.8: Evaluar Supabase Pro

## Comandos útiles

```bash
# Verificar compilación
./node_modules/.bin/tsc --noEmit

# Ejecutar tests
./node_modules/.bin/vitest run

# Build de producción
./node_modules/.bin/vite build

# Ver any types restantes
grep -rn ": any" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".d.ts" | grep -v "types.ts" | grep -v "__tests__"

# Deploy (automático al pushear a main)
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
│   └── ...            # AppLayout, AppSidebar, CommandPalette, etc.
├── hooks/             # useClients, useDashboard, useInteractions, etc.
├── integrations/supabase/  # client.ts, types.ts (autogenerado)
├── lib/
│   ├── calculations.ts  # Lógica de negocio (KPIs, ranking)
│   ├── notifications.ts # Push notifications API
│   ├── schemas.ts       # Zod schemas para formularios
│   ├── types.ts         # Tipos compartidos (Interaction, Client, etc.)
│   └── utils.ts         # cn() helper
├── pages/             # Dashboard, Clients, Interactions, Products, etc.
└── contexts/          # AuthContext
```

## Notas importantes

- El proyecto usa **bun** como package manager pero **npm** también funciona
- Los tests están en `src/lib/__tests__/` y `src/components/__tests__/`
- El deploy es automático: push a `main` → GitHub Actions → FTP → crm.mejoraok.com
- Las credenciales FTP están en GitHub Secrets (no en el repo)
- Supabase project ID: `fkjuswkjzaeuogctsxpw`
- El `.env` tiene las credenciales de Supabase (no commitear)
