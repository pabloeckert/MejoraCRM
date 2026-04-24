# Runbook de Incidentes — MejoraCRM

> Guía para diagnosticar y resolver problemas en producción.

## Contactos

| Rol | Responsable | Contacto |
|-----|------------|----------|
| Admin Supabase | — | Supabase Dashboard |
| Admin Hosting | — | Panel de hosting (FTP) |
| Admin DNS | — | Panel de dominio |

## URLs clave

| Servicio | URL |
|----------|-----|
| Producción | https://crm.mejoraok.com |
| Supabase Dashboard | https://supabase.com/dashboard/project/fkjuswkjzaeuogctsxpw |
| GitHub Actions | https://github.com/pabloeckert/mejoracrm/actions |

---

## Escenario 1: La app no carga (página en blanco)

**Síntomas:** El usuario ve una página en blanco o un spinner infinito.

**Diagnóstico:**
1. Abrir DevTools → Console → buscar errores rojos
2. Verificar si `https://crm.mejoraok.com` responde (curl o navegador)
3. Verificar Supabase status: https://status.supabase.com

**Causas posibles:**
- **Error de JS:** Revertir último deploy (`git revert HEAD && git push`)
- **Supabase caído:** Esperar o contactar soporte Supabase
- **CORS error:** Verificar que el dominio esté en la lista de allowed origins de Supabase
- **Variables de entorno:** Verificar que `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` estén correctas en el build

**Resolución:**
```bash
# Revertir deploy
cd mejoracrm
git revert HEAD
git push origin main  # Esto dispara el deploy con la versión anterior
```

---

## Escenario 2: Error de autenticación

**Síntomas:** Los usuarios no pueden hacer login. Error "Invalid login credentials" o "Email not confirmed".

**Diagnóstico:**
1. Verificar en Supabase Dashboard → Authentication → Users
2. Verificar que el usuario exista y esté confirmado
3. Verificar que las políticas RLS no estén bloqueando

**Causas posibles:**
- **Email no confirmado:** Supabase requiere confirmación por email (verificar configuración)
- **RLS bloqueando:** Verificar políticas en Supabase Dashboard → Authentication → Policies
- **JWT expirado:** El usuario necesita hacer login nuevamente

**Resolución:**
- Confirmar email manualmente en Supabase Dashboard si es necesario
- Verificar que `handle_new_user()` trigger funcione correctamente

---

## Escenario 3: Datos no aparecen (listas vacías)

**Síntomas:** El usuario hace login pero no ve clientes, interacciones o productos.

**Diagnóstico:**
1. Verificar RLS: las políticas pueden estar filtrando datos
2. Verificar que los datos existan en Supabase Dashboard → Table Editor
3. Verificar la consola del navegador para errores de red

**Causas posibles:**
- **RLS:** Un vendedor solo ve sus clientes asignados (`assigned_to = auth.uid()`)
- **Datos no migrados:** Verificar que los datos se hayan insertado correctamente
- **RPC fallando:** Verificar que `get_dashboard_data()` y `get_notifications_data()` existan

**Resolución:**
```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'clients';

-- Verificar datos
SELECT COUNT(*) FROM clients;
SELECT COUNT(*) FROM interactions;

-- Verificar función
SELECT get_dashboard_data();
```

---

## Escenario 4: Deploy fallido en GitHub Actions

**Síntomas:** El workflow de GitHub Actions falla.

**Diagnóstico:**
1. Ir a https://github.com/pabloeckert/mejoracrm/actions
2. Click en el run fallido
3. Revisar qué step falló

**Causas comunes:**
- **`tsc --noEmit` falla:** Error de TypeScript → corregir en el código
- **`eslint` falla:** Error de linting → corregir o ajustar reglas
- **`vitest run` falla:** Test roto → corregir el test o el código
- **`bun install` falla:** Problema de dependencias → regenerar lockfile
- **FTP deploy falla:** Credenciales incorrectas → verificar GitHub Secrets

**Resolución para FTP:**
1. Verificar Secrets en GitHub → Settings → Secrets → Actions
2. Secrets necesarios: `FTP_HOST`, `FTP_USERNAME`, `FTP_PASSWORD`
3. Si las credenciales cambiaron, actualizar los secrets

---

## Escenario 5: Supabase — Límites alcanzados

**Síntomas:** Errores de "rate limit" o "connection limit reached".

**Diagnóstico:**
1. Supabase Dashboard → Settings → Usage
2. Verificar: conexiones activas, storage, ancho de banda

**Límites del plan Free:**
- 500 MB de storage
- 2 GB de transferencia/mes
- 50,000 usuarios activos mensuales
- Conexiones limitadas

**Resolución:**
- Upgrade a Supabase Pro ($25/mes) si se superan los límites
- Optimizar queries para reducir conexiones (ya hecho con RPCs)

---

## Escenario 6: Rendimiento lento

**Síntomas:** La app tarda mucho en cargar o las queries son lentas.

**Diagnóstico:**
1. Supabase Dashboard → SQL Editor → `EXPLAIN ANALYZE` en queries sospechosas
2. Supabase Dashboard → Reports → Query Performance
3. Verificar que los índices se estén usando

**Resolución:**
```sql
-- Verificar uso de índices
EXPLAIN ANALYZE SELECT * FROM clients WHERE assigned_to = '<user_id>';

-- Refrescar vistas materializadas manualmente
SELECT refresh_materialized_views();

-- Verificar estadísticas
SELECT * FROM pg_stat_user_tables WHERE schemaname = 'public';
```

---

## Escenario 7: Datos corruptos o eliminados accidentalmente

**Síntomas:** Un usuario reporta que sus datos desaparecieron.

**Diagnóstico:**
1. Verificar audit_log en Supabase Dashboard
2. Verificar si el usuario eliminó datos o si fue un error de RLS

**Resolución:**
```sql
-- Verificar audit_log
SELECT * FROM audit_log ORDER BY changed_at DESC LIMIT 50;

-- Verificar datos eliminados (si hay backup)
-- Supabase Pro tiene backups diarios automáticos
```

**Prevención:**
- Mantener audit_log activo (ya implementado)
- Considerar soft delete en vez de hard delete para datos críticos

---

## Checklist post-incidente

- [ ] ¿Cuál fue la causa raíz?
- [ ] ¿Cuánto tiempo estuvo el servicio degradado?
- [ ] ¿Qué usuarios fueron afectados?
- [ ] ¿Qué medidas preventivas se pueden tomar?
- [ ] ¿Hay que actualizar este runbook?
- [ ] ¿Hay que crear un test para prevenir este escenario?
