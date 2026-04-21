# Despliegue — MejoraCRM

## Infraestructura

| Servicio | Detalle |
|----------|---------|
| Frontend hosting | crm.mejoraok.com (FTP) |
| Backend | Supabase Cloud |
| DNS | Subdominio crm.mejoraok.com |

## Build y deploy manual

```bash
# 1. Instalar dependencias
npm install

# 2. Build de producción
npm run build

# 3. Subir carpeta dist/ al FTP
```

## Conexión FTP

- **Host:** 185.212.70.250
- **Puerto:** 21
- **Usuario:** u846064658.mejoraok.com
- **Carpeta destino:** `/home/u846064658/domains/mejoraok.com/public_html/crm/`

> ⚠️ **No subir credenciales FTP al repositorio.** Las credenciales están documentadas aquí solo como referencia interna.

## Variables de entorno

El archivo `.env` contiene las credenciales de Supabase. **Nunca commitear `.env`** (está en `.gitignore`).

Variables necesarias:
- `VITE_SUPABASE_URL` — URL del proyecto Supabase
- `VITE_SUPABASE_ANON_KEY` — Anon key pública

## Flujo de deploy

1. Desarrollo local con `npm run dev`
2. Commit y push a `main` en GitHub
3. `npm run build` genera carpeta `dist/`
4. Subir contenido de `dist/` al FTP

## Configuración del servidor

El hosting debe servir `index.html` para todas las rutas (SPA routing). Si hay 404s en rutas internas, configurar rewrite rules.
