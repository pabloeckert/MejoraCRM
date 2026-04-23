# Deploy — MejoraCRM

## Producción
- **URL:** https://crm.mejoraok.com
- **Servidor:** Hostinger compartido
- **IP:** 185.212.70.250
- **Directorio:** `/home/u846064658/domains/mejoraok.com/public_html/crm`

## Pasos

### 1. Build
```bash
cd mejoracrm-repo
npm install
npx vite build
```

### 2. Subir archivos
**Por SSH (recomendado):**
```bash
python3 -c "
import paramiko, os
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('185.212.70.250', 65002, 'u846064658', 'PASSWORD')
sftp = ssh.open_sftp()
for root, dirs, files in os.walk('dist'):
    for f in files:
        lp = os.path.join(root, f)
        rp = '/home/u846064658/domains/mejoraok.com/public_html/crm/' + lp.replace('dist/','')
        ssh.exec_command('mkdir -p ' + os.path.dirname(rp))
        sftp.put(lp, rp)
        print(f'↑ {lp}')
sftp.close(); ssh.close()
"
```

**Por FTP (no recomendado, timeouts):**
FTP en este servidor tiene problemas con conexiones de datos activas/pasivas. Usar SSH.

### 3. Verificar
Entrar a https://crm.mejoraok.com y verificar que carga.

### 4. Supabase
Agregar en Authentication → URL Configuration:
- Site URL: `https://crm.mejoraok.com`
- Redirect URLs: `https://crm.mejoraok.com`

## Dependencia crítica
- `react-is` es necesaria para `recharts` en producción. Está en `package.json`.

## .htaccess
El archivo `.htaccess` en `dist/` habilita SPA routing (todas las rutas redirigen a `index.html`).
