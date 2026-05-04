# Changelog — MejoraCRM

## 2026-05-05

### Limpieza del repositorio
**Commit:** `de801f3` — cleanup: remove unused files for Vercel deploy

Archivos eliminados:
- `MejoraCRM-P0-fixes.zip` — ZIP suelto en el repo
- `.github/workflows/deploy.yml` — deploy FTP a crm.mejoraok.com (reemplazado por Vercel)
- `public/.htaccess` — config Apache (Vercel maneja SPA routing automáticamente)
- `src/demo/demoData.ts` — **tenía contraseñas hardcodeadas** (riesgo de seguridad)
- `src/test/example.test.ts`, `src/test/setup.ts` — tests de ejemplo
- `src/lib/__tests__/` — tests de calculations, schemas, utils
- `src/components/__tests__/ErrorBoundary.test.tsx` — test de ErrorBoundary
- `vitest.config.ts` — config de testing

Dependencias eliminadas de `package.json`:
- `vitest`, `@testing-library/jest-dom`, `@testing-library/react`, `jsdom`

Scripts eliminados: `test`, `test:watch`

URLs actualizadas:
- `src/pages/Terms.tsx` — crm.mejoraok.com → mejoracrm.vercel.app
- `src/pages/Privacy.tsx` — crm.mejoraok.com → mejoracrm.vercel.app

### Modo Demo (bypass login)
**Commit:** `4721d58` — feat: add demo mode — bypass login with mock data

Archivos creados:
- `src/demo/demoData.ts` — datos mock: 8 clientes, 19 interacciones, 5 productos, 2 perfiles
- `src/components/DemoRoleToggle.tsx` — botón toggle Dueño/Vendedor en el header

Archivos modificados:
- `src/contexts/AuthContext.tsx` — flag `DEMO_MODE = true`, auto-login con usuario mock, soporte para cambio de rol
- `src/hooks/useDashboard.ts` — retorna datos demo cuando `DEMO_MODE = true`
- `src/hooks/useClients.ts` — idem
- `src/hooks/useInteractions.ts` — idem
- `src/hooks/useProducts.ts` — idem
- `src/hooks/useProfiles.ts` — idem
- `src/hooks/useNotifications.ts` — idem
- `src/App.tsx` — sin cambios funcionales (AuthProvider ya maneja demo mode)
- `src/components/AppLayout.tsx` — agrega DemoRoleToggle en el header

### Deploy a Vercel
- Proyecto: `mejoracrm` en cuenta `mejoraok-7590s-projects`
- Dominio: https://mejoracrm.vercel.app
- Env vars configuradas en Vercel:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- Tokens almacenados fuera del repo (ver prompt de sesión)

### Estado actual
- **DEMO_MODE = true** en `src/contexts/AuthContext.tsx`
- Login deshabectivado, se entra directo al dashboard
- Toggle Dueño/Vendedor funcional en el header
- Datos mock reales (nombres argentinos, montos en ARS/USD, provincias reales)
- Para activar Supabase real: cambiar `DEMO_MODE` a `false` y las queries vuelven a Supabase

---

## Próximos pasos sugeridos
1. Cargar datos reales en Supabase (correr migraciones + seed)
2. Cambiar `DEMO_MODE` a `false` cuando las credenciales estén configuradas
3. Configurar dominio personalizado en Vercel (si se quiere)
4. Agregar tests y CI/CD pipeline
