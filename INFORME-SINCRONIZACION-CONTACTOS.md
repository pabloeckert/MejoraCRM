# Informe de sincronización de contactos — MejoraContactos ↔ MejoraCRM

| | |
|---|---|
| **Proyecto** | Integración del ecosistema Mejora Continua — Fase 2: sincronización de identidad de contactos |
| **Fecha del informe** | 2026-09-16 |
| **Autor** | Claude (Sonnet 5), a pedido de Pablo Eckert |
| **Repos afectados** | `MejoraCRM` (este repo) + `MejoraContactos` |
| **Estado general** | 🟡 **Construido y verificado localmente. Cero componentes activados en producción todavía.** |
| **Commiteado** | No — pendiente de tu revisión antes de push, mismo criterio que las entregas anteriores |
| **Bloqueante conocido** | 🔴 Rotación de `service_role` key de Supabase de MejoraCRM sigue pendiente (ver Registro de Riesgos, R1) |

---

## 1. Resumen ejecutivo

Se implementó sincronización **bidireccional** entre `MejoraContactos` (fuente de verdad de identidad de contactos, vía `persona_id`) y `MejoraCRM` (`clients`), según las 4 decisiones que confirmaste el 2026-09-16:

| Decisión | Elegiste |
|---|---|
| Rotación de key de seguridad | Seguir sin rotarla todavía (riesgo asumido por vos) |
| Estado de datos reales en `clients` | Desconocido — a confirmar por vos, diseño construido para ser seguro en cualquier caso |
| Modelo de `persona_id` | Columna nueva (no reemplaza `clients.id`) |
| Dirección de sync | Doble vía |

**Nada de esto está activo todavía.** Es código construido, verificado localmente (lint/type-check/build/tests, todos en verde — ver §6), pero **cero migraciones corridas contra Supabase real, cero API keys generadas, cero secrets configurados**. Está diseñado explícitamente para no hacer nada (fail-soft) hasta que completes el checklist de activación de §7.

---

## 2. Arquitectura de la sincronización

```
┌─────────────────────────────┐                    ┌──────────────────────────────┐
│   MejoraContactos (Python)   │                    │         MejoraCRM (React)     │
│   motor-contactos, local     │                    │   crm.mejoraok.com (Vercel)   │
│                               │                    │                                │
│  deduplicar_todo()            │                    │   ClientFormDialog             │
│  aplicar_decision_lote()      │                    │   (alta/edición manual)        │
│  deshacer() / deshacer_...()  │                    │        │                       │
│  guardar_edicion_manual()     │                    │        ▼                       │
│        │                      │                    │   useClients.ts                │
│        ▼                      │                    │   pushContactoBestEffort() ────┼──┐
│  supabase_sync.py             │                    └────────────────────────────────┘  │
│  (upsert best-effort)         │                                                          │
└────────┬──────────────────────┘                                                          │
         │ POST/GET                                                                        │
         ▼                                                                                 │
┌──────────────────────────────────────────────────────────┐                              │
│     Supabase — proyecto de MejoraContactos                │                              │
│                                                             │                              │
│  tabla contactos_finales (persona_id = identidad estable)  │                              │
│  tabla contactos_api_keys (una key por sistema externo)    │                              │
│  tabla contactos_sync_log (auditoría push/pull)            │                              │
│                                                             │                              │
│  Edge Function contactos-api                                │                              │
│    GET  -> leer contactos (?desde= para incremental)        │◄─────────────────────────────┤
│    POST -> crear/actualizar (requiere key con               │    Edge Function              │
│            puede_escribir=true)                             │    pull-contactos (MejoraCRM) │
└──────────────────────────────────────────────────────────┘    llamada por cron GH Actions  │
                                                                   cada 15 min                │
                                                                          ▲                    │
                                                                          │                    │
                                                          ┌───────────────┴────────────────────┘
                                                          │
                                                ┌──────────────────────────────────┐
                                                │  Supabase — proyecto de MejoraCRM │
                                                │                                    │
                                                │  clients + persona_id (nueva)      │
                                                │  + origen, contactos_synced_at     │
                                                │  contactos_sync_log (propia)       │
                                                │                                    │
                                                │  Edge Function push-contacto        │
                                                │    (llamada por el frontend,        │
                                                │     server-side llama a             │
                                                │     contactos-api de MejoraContactos)│
                                                └──────────────────────────────────┘
```

**Por qué dos Edge Functions intermedias (`push-contacto`, `pull-contactos`) en vez de que el frontend le hable directo a `contactos-api`:** la API key de escritura de `contactos-api` es un secreto real — si viviera en una variable `VITE_*`, quedaría embebida en el JavaScript público que se manda a cualquier visitante de `crm.mejoraok.com` (cualquiera con DevTools la vería). Las Edge Functions la guardan server-side (Supabase Secrets), nunca llega al navegador.

---

## 3. Registro de riesgos

| ID | Riesgo | Severidad | Estado | Mitigación |
|---|---|---|---|---|
| **R1** | `service_role` key de Supabase de MejoraCRM potencialmente recuperable del historial de git (repo público), nunca rotada | 🔴 Crítico | **Abierto, asumido por vos explícitamente** | Ninguna de mi lado — no tengo acceso al Supabase Dashboard. Ver §8. |
| **R2** | No se pudo confirmar si `clients` tiene datos reales hoy | 🟡 Medio | **Abierto** | Diseño aditivo/no-destructivo en todos los cambios de esquema — seguro tanto si hay datos como si no. Backfill de `persona_id` es gradual, no un `UPDATE` masivo de una vez. |
| **R3** | Contactos creados directo en MejoraCRM (vía `push-contacto`) no pasan por el motor de dedup fuzzy de `motor-contactos` | 🟡 Medio | **Abierto, conocido, no resuelto en esta entrega** | `contactos_finales.origen='mejoracrm'` marca su procedencia, así que son identificables para un futuro proceso de conciliación. Ver §9.1. |
| **R4** | Mapeo de nombre `clients.name`/`contact_name` → `nombre`/`apellido` de `contactos_finales` es una heurística simple (parte por el primer espacio), no un parser real | 🟢 Bajo | **Aceptado por diseño** | Documentado en `push-contacto/index.ts` (`partirNombre()`). Corregible a mano después vía el propio flujo de edición de MejoraContactos. |
| **R5** | `clients.whatsapp`/`email` son campos singulares; `contactos_finales` los modela como arrays (una persona puede tener varios) | 🟢 Bajo | **Aceptado por diseño** | `pull-contactos` toma el primero del array (`emails[0]`, `whatsapp[0]`); `push-contacto` empaqueta el único valor de `clients` en un array de un elemento. Se pierde info si un contacto tiene 2+ números, pero no se corrompe nada. |
| **R6** | Multitenancy: la sincronización no filtra por `organization_id` — hoy sincroniza TODOS los `clients`, de cualquier organización | 🟡 Medio | **Abierto, señalado en el diagnóstico previo, no resuelto acá** | Aceptable mientras la única organización real sea la tuya. Si en algún momento hay otro tenant pagando MejoraCRM, esto hay que resolverlo antes de que sus datos se mezclen con `contactos_finales`. |
| **R7** | GitHub Actions cron corre cada 15 min indefinidamente una vez activado — consume minutos de Actions (gratis hasta cierto volumen, después se cobra) | 🟢 Bajo | **Informativo** | 96 corridas/día, cada una un curl de <1s — footprint mínimo, pero queda dicho. |

---

## 4. Registro de cambios — archivo por archivo

### MejoraContactos

| Archivo | Tipo | Qué cambió |
|---|---|---|
| `supabase/migrations/20260916_contactos_finales_two_way.sql` | Nuevo | `cluster_id` pasa a nullable en `contactos_finales`; columna `origen` (+ CHECK constraint); columna `puede_escribir` en `contactos_api_keys`; tabla nueva `contactos_sync_log` con RLS. |
| `supabase/functions/contactos-api/index.ts` | Modificado | Agregado soporte POST (crear/actualizar un contacto), gateado por `puede_escribir` de la API key. GET existente sin cambios de comportamiento. Ahora registra cada operación en `contactos_sync_log`. Docstring del encabezado actualizado con el flujo de alta de key de escritura. |

### MejoraCRM

| Archivo | Tipo | Qué cambió |
|---|---|---|
| `supabase/migrations/20260916000001_contactos_sync.sql` | Nuevo | Columnas `persona_id` (UUID, único cuando no-null), `origen`, `contactos_synced_at` en `clients`. Tabla nueva `contactos_sync_log` con RLS (lectura para cualquier usuario autenticado, escritura solo vía service role). |
| `supabase/functions/push-contacto/index.ts` | Nuevo | Edge Function: recibe `{client_id}`, lee el cliente, lo mapea a la forma de `contactos_finales`, llama a `contactos-api` (POST), guarda el `persona_id` devuelto de vuelta en `clients`. |
| `supabase/functions/pull-contactos/index.ts` | Nuevo | Edge Function: llamada por cron, trae contactos nuevos/modificados de `contactos-api` (GET incremental) y hace upsert en `clients` matcheando por `persona_id` — solo toca campos compartidos, nunca `status`/`assigned_to`/`segment`/`channel`. |
| `src/hooks/useClients.ts` | Modificado | Nueva función exportada `pushContactoBestEffort(clientId)` — invoca la Edge Function de forma fire-and-forget, nunca lanza. |
| `src/pages/Clients.tsx` | Modificado | `upsertMutation` llama a `pushContactoBestEffort` después de un insert o update exitoso de `clients`. El insert ahora pide `.select("id").single()` para tener el id nuevo disponible. |
| `.github/workflows/sync-contactos.yml` | Nuevo | Cron cada 15 min + disparo manual (`workflow_dispatch`) que llama a `pull-contactos`. Sale en verde sin hacer nada si los secrets no están configurados (no spamea corridas rojas). |
| `.env.example` | Modificado | Sección nueva documentando dónde viven los secrets de esta integración (Supabase Edge Function Secrets + GitHub Actions Secrets) — ninguno va en este archivo. |
| `MIGRACION-CONTACTOS-CRM.md` | (de la entrega anterior) | Sin cambios en esta sesión — es el diagnóstico que dio origen a este trabajo. |

**Deliberadamente NO tocado:** `src/components/clients/ClientImportDialog.tsx` (importación CSV manual) — sigue funcionando exactamente igual, no dispara sync hacia MejoraContactos. Ver §9.2.

---

## 5. Diseño de datos — mapeo de campos

| `contactos_finales` (MejoraContactos) | ↔ | `clients` (MejoraCRM) | Nota |
|---|---|---|---|
| `persona_id` | ↔ | `persona_id` (nueva) | Clave de matcheo. |
| `nombre` + `apellido` | ↔ | `contact_name` (o `name` si no hay `contact_name`) | Heurística simple de split — ver R4. |
| `organizacion` | ↔ | `company` | |
| `whatsapp[0]` | ↔ | `whatsapp` | Solo el primer número — ver R5. |
| `emails[0]` | ↔ | `email` | Solo el primero — ver R5. |
| `domicilio` | ↔ | `address` (fallback `location`) | |
| `provincia` | ↔ | `province` | |
| `pais` | ↔ | `country` | |
| `nota_referencia` | ↔ | `notes` | |
| `updated_at` | → | `contactos_synced_at` (solo lectura desde CRM) | No es lo mismo: `updated_at` es "cuándo cambió el contacto en origen", `contactos_synced_at` es "cuándo se sincronizó esta fila acá". |
| — (no existe) | — | `status`, `assigned_to`, `segment`, `channel`, `first_contact_date`, `organization_id` | **Nunca sincronizados.** Son propiedad exclusiva de MejoraCRM, ni `push-contacto` los manda ni `pull-contactos` los toca. |
| `cargo`, `tag`, `cumpleanos`, `foto_url`, `flags`, `telefono_fijo` | — | (no existen en `clients`) | Se pierden en la dirección Contactos→CRM. No estaban en el alcance de esta entrega. |

---

## 6. Evidencia de verificación (lo que SÍ se probó, y cómo)

No hay credenciales reales de Supabase en este entorno para ninguno de los dos proyectos, así que **nada de esto corrió contra infraestructura viva**. Lo que sí se verificó, de forma real (no simulada):

| Verificación | Herramienta instalada para esto | Resultado |
|---|---|---|
| Lint de MejoraCRM (`eslint .`) | (ya estaba) | ✅ 0 errores, 87 warnings preexistentes (ninguno en archivos tocados) |
| Build de producción de MejoraCRM (`vite build`) | (ya estaba) | ✅ compila limpio, incluye el chunk `Clients-*.js` con los cambios |
| Suite de tests de MejoraCRM (`vitest run`) | (ya estaba) | ✅ 144/144 tests, 14/14 archivos |
| Type-check de `contactos-api/index.ts` | Deno 2.9.6 (instalado esta sesión) | ✅ `deno check` sin errores |
| Type-check de `push-contacto/index.ts` | Deno | ✅ sin errores |
| Type-check de `pull-contactos/index.ts` | Deno | ✅ sin errores |
| Lint de las 3 Edge Functions | `deno lint` | ✅ sin problemas |
| Migraciones SQL | — | Revisión manual línea por línea, sin motor de Postgres local para correrlas de verdad |
| Flujo end-to-end (crear cliente → sync → aparece en `contactos_finales`) | — | **No probado.** Requiere credenciales reales de ambos proyectos. |
| Cron de GitHub Actions | — | **No probado.** El workflow tiene una guarda explícita que sale en verde sin hacer nada si faltan secrets — así que lo único "probable" sin credenciales es que no rompa nada, no que la sincronización real funcione. |

---

## 7. Checklist de activación (en orden — nada funciona hasta completar esto)

Todo esto lo tenés que hacer vos; yo no tengo las credenciales para ninguno de los dos proyectos Supabase.

- [ ] **0. (Recomendado antes que nada) Resolver R1** — rotar la `service_role` key de MejoraCRM. Ver §8.
- [ ] **1. Aplicar las 2 migraciones nuevas** — `supabase db push` (o pegarlas a mano en el SQL Editor) en el proyecto de MejoraContactos y en el de MejoraCRM, cada una la suya.
- [ ] **2. Desplegar las 3 Edge Functions actualizadas/nuevas** — `supabase functions deploy contactos-api` (MejoraContactos), `supabase functions deploy push-contacto` y `supabase functions deploy pull-contactos` (MejoraCRM).
- [ ] **3. Generar la API key de MejoraCRM** — seguí el README embebido en `contactos-api/index.ts` (paso 1-3), con `puede_escribir=true` esta vez ya que necesita crear/actualizar.
- [ ] **4. Configurar Secrets en el proyecto Supabase de MejoraCRM** (Project Settings → Edge Functions → Secrets): `CONTACTOS_API_URL`, `CONTACTOS_API_KEY` (la del paso 3), `CRON_SECRET` (generalo vos, cualquier string random largo).
- [ ] **5. Configurar Secrets en GitHub** (repo MejoraCRM → Settings → Secrets and variables → Actions): `SUPABASE_FUNCTIONS_URL`, `SUPABASE_ANON_KEY`, `CRON_SECRET` (mismo valor que el paso 4).
- [ ] **6. Confirmar el estado de `clients`** (R2) — `SELECT count(*) FROM clients;` en el SQL Editor, para saber si hace falta backfill de contactos viejos o arranca de cero.
- [ ] **7. Probar `push-contacto` a mano** — crear un cliente de prueba en la UI de MejoraCRM, confirmar en `contactos_finales` que apareció con `origen='mejoracrm'`.
- [ ] **8. Probar `pull-contactos` a mano** — `workflow_dispatch` manual desde la pestaña Actions de GitHub, confirmar que trae contactos de `motor-contactos` hacia `clients`.
- [ ] **9. Dejar correr el cron** — una vez confirmados 7 y 8, el schedule de 15 min queda solo.

---

## 8. Sobre R1 (seguridad) — para cuando quieras resolverlo

No lo bloqueé porque elegiste seguir igual, pero lo dejo listo para cuando quieras:
1. Supabase Dashboard → proyecto de MejoraCRM → Project Settings → API → **Reset** sobre `service_role` key.
2. Actualizar esa key en todos los lugares que la usan hoy (Vercel env vars de MejoraCRM, cualquier script local que la tenga).
3. Si además querés que la key vieja deje de ser recuperable del historial de git (el repo es público) — te puedo ayudar a limpiar el historial con `git filter-repo` cuando quieras, es un trabajo aparte de esta sincronización.

---

## 9. Huecos conocidos, sin resolver — para la próxima ronda

### 9.1 — Contactos creados en MejoraCRM no pasan por el dedup de motor-contactos
Un contacto nuevo cargado directo en MejoraCRM llega a `contactos_finales` (vía `push-contacto`) con `origen='mejoracrm'`, pero **nunca pasa por el pipeline de fuzzy-dedup de `motor-contactos`** (ese motor corre local, en tu máquina, no en la nube — no hay forma de que reaccione en vivo a un insert en Supabase). Si ese mismo contacto ya existe en tus 8.500+ contactos reales bajo un teléfono ligeramente distinto, hoy quedarían como dos personas separadas hasta que alguien lo note a mano. Resolverlo bien significaría construir un "pull" del lado de `motor-contactos` (que hoy no existe — motor-contactos solo empuja, nunca trae) para que los contactos `origen='mejoracrm'` entren también al pipeline de dedup local. No es trivial y no estaba en el alcance de esta entrega.

### 9.2 — La importación CSV manual de MejoraCRM sigue sin conectar
`ClientImportDialog.tsx`/`Clients.tsx` (alta en lote desde un archivo) no llama a `pushContactoBestEffort` — cada fila importada así no se sincroniza. Fue una decisión de alcance (la pregunta 4 del diagnóstico original quedó sin responder explícitamente) — si querés que también dispare sync, es un cambio chico (mismo patrón, en el `importMutation` de `Clients.tsx`, con `N` llamadas en vez de 1).

### 9.3 — Multitenancy (R6)
Repetido acá por peso: el día que exista otro tenant real de MejoraCRM, este diseño sincroniza sus contactos también, mezclados con los tuyos. Falta decidir el filtro por `organization_id` antes de que eso importe de verdad.

### 9.4 — Tipos de TypeScript desactualizados
Señalado ya en el diagnóstico previo (`src/integrations/supabase/types.ts` no tiene `organization_id`) — ahora tampoco va a tener `persona_id`/`origen`/`contactos_synced_at` hasta que corras `supabase gen types typescript` contra el proyecto real después de aplicar la migración. No bloquea nada (las Edge Functions no usan ese archivo), pero el editor no te va a autocompletar esos campos en el resto del frontend hasta regenerarlo.

---

## 10. Firma

Documento generado íntegramente por Claude (Sonnet 5) el 2026-09-16, sin commitear a git — a la espera de tu revisión y de que me confirmes si hago el push, igual que las entregas anteriores.
