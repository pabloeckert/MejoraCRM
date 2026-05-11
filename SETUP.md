# Guía de Setup — MejoraCRM

Para salir del modo demo y conectar Supabase real.

---

## Paso 1: Credenciales de Supabase

1. Entrá al dashboard de Supabase: https://supabase.com/dashboard
2. Seleccioná tu proyecto (o creá uno nuevo)
3. Andá a **Settings → API** y copiá:
   - **Project URL** → algo como `https://abcdefghij.supabase.co`
   - **anon public key** → empieza con `eyJhbGci...`
4. Andá a **Settings → General** y copiá:
   - **Project ID** → el que aparece en la URL del dashboard

## Paso 2: Archivo .env

```bash
cp .env.example .env
```

Editá `.env` con tus credenciales:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
```

## Paso 3: Crear usuarios en Supabase Auth

Andá a **Authentication → Users → Add user** y creá:

| Email | Rol | Nombre |
|---|---|---|
| sindygeisert@gmail.com | admin | Sindy Geisert |
| pabloeckert@gmail.com | admin | Pablo Eckert |
| mejoraok@gmail.com | vendedor | Vendedor Demo |

Password para todos: `T@beg2301`

**Importante:** Después de crear cada usuario, copiá el UUID que Supabase le asignó (aparece en la columna ID de la tabla de usuarios).

## Paso 4: Ejecutar migraciones

### Opción A: Desde Supabase CLI (recomendado)

```bash
npx supabase link --project-ref TU_PROJECT_ID
npx supabase db push
```

### Opción B: Manualmente desde el dashboard

Andá a **SQL Editor** y ejecutá los archivos de migración en orden:

```
supabase/migrations/20260414232059_*.sql
supabase/migrations/20260414232115_*.sql
supabase/migrations/20260422130107_*.sql
... (todos en orden)
```

## Paso 5: Cargar datos de ejemplo

1. Abrí `supabase/seed.sql`
2. Reemplazá los UUIDs `a0000000-...` con los UUIDs reales de los usuarios que creaste en el Paso 3
3. Ejecutá el SQL en el **SQL Editor** de Supabase

## Paso 6: Desactivar modo demo

Editá `src/contexts/AuthContext.tsx`:

```typescript
export const DEMO_MODE = false;  // ← Cambiar de true a false
```

## Paso 7: Probar

```bash
npm run dev
```

- Abrí http://localhost:5173
- Debería aparecer el login de Supabase
- Logueate con cualquiera de los usuarios creados
- Verificá que los datos del seed aparezcan

## Paso 8: Deploy

```bash
git add -A
git commit -m "feat: conectar Supabase real — DEMO_MODE = false"
git push origin main
```

Vercel hace deploy automático si el repo está conectado.

---

## Troubleshooting

**"Invalid API key"**: Revisá que la anon key esté correcta en `.env`

**"relation does not exist"**: Las migraciones no se ejecutaron. Andá al SQL Editor y ejecutálas.

**Login no funciona**: Verificá que los usuarios estén creados en Authentication → Users.

**Datos vacíos**: Ejecutaste las migraciones pero no el seed.sql.

---

## Lo que sigue después del setup

- [ ] Google Calendar sync (necesita OAuth de Google Cloud Console)
- [ ] Configurar dominio crm.mejoraok.com en Vercel
- [ ] Crear los primeros clientes reales
- [ ] Probar el flujo completo: cliente → interacción → venta
