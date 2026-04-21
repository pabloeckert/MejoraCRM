# Deploy - CRM Mejora (crmejoraok.com)

## Build
```bash
cd mejoracrm
npm run build
```

## Deploy por FTP
- Host: 185.212.70.250:21
- Usuario: u846064658.mejoraok.com
- Directorio: crm.mejoraok.com
- Ruta absoluta: /home/u846064658/domains/mejoraok.com/public_html/crm

## Subir contenido de `dist/` al directorio FTP
El archivo .htaccess ya está incluido en `public/` para SPA routing.

## Verificar
- Abrir https://crm.mejoraok.com
- Verificar que el login funcione
- Probar navegación entre páginas
