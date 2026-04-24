# Guía: Environment de Staging — MejoraCRM

## Configuración recomendada

### 1. Proyecto Supabase de staging

Crear un segundo proyecto en Supabase para staging:

1. Ir a https://supabase.com/dashboard
2. Crear nuevo proyecto: `mejoracrm-staging`
3. Ejecutar `SETUP_COMPLETO.sql` en el SQL Editor del nuevo proyecto
4. Copiar las credenciales del nuevo proyecto

### 2. Variables de entorno

Crear `.env.staging`:

```env
VITE_SUPABASE_PROJECT_ID=<staging-project-id>
VITE_SUPABASE_PUBLISHABLE_KEY=<staging-anon-key>
VITE_SUPABASE_URL=https://<staging-project-id>.supabase.co
```

### 3. Build de staging

```bash
bun run build --mode staging
```

Vite carga `.env.staging` automáticamente cuando `mode=staging`.

### 4. Deploy de staging

Opción A: Subcarpeta en el mismo hosting
- Subir `dist/` a `staging.mejoraok.com/crm/`

Opción B: Subdominio separado
- Crear `staging.crm.mejoraok.com`
- Configurar FTP separado o usar Vercel/Cloudflare Pages

### 5. GitHub Actions (staging)

Workflow separado `deploy-staging.yml`:

```yaml
name: Deploy staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run build --mode staging
      - uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.FTP_HOST }}
          username: ${{ secrets.FTP_USERNAME_STAGING }}
          password: ${{ secrets.FTP_PASSWORD_STAGING }}
          local-dir: ./dist/
          server-dir: /staging/
```

### 6. Ramas

- `main` → producción (crm.mejoraok.com)
- `develop` → staging (staging.crm.mejoraok.com o crm.mejoraok.com/staging/)

---

## Alternativa: Vercel (recomendado)

Vercel ofrece preview deployments automáticos por PR, sin necesidad de FTP:

1. Conectar repo GitHub en https://vercel.com
2. Configurar:
   - Framework: Vite
   - Build command: `bun run build`
   - Output directory: `dist`
3. Cada PR genera un preview URL automáticamente
4. `main` → producción, cualquier otra rama → preview

**Ventajas sobre FTP:**
- Preview por PR
- Rollback instantáneo
- CDN global
- SSL automático
- Sin necesidad de secrets FTP

---

## Alternativa: Cloudflare Pages

Similar a Vercel pero con Workers para edge functions:

1. Conectar repo en https://dash.cloudflare.com
2. Configurar:
   - Framework preset: Vite
   - Build command: `bun run build`
   - Build output directory: `dist`
3. Custom domain: crm.mejoraok.com

**Ventajas:**
- CDN global (más rápido que hosting compartido)
- SSL automático
- Preview por branch
- Gratis para uso moderado
