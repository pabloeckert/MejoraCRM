# Pendientes — MejoraSuite

Lista viva. Se tacha (no se borra) lo completado, se agrega lo nuevo. Es lo primero que se lee después de `PROMPT_CONTINUACION.md` y `ESPECIFICACION.md`.

## Resuelto — alineación y auditoría (2026-08-15)

- [x] ~~Definir cuál de los tres es rector~~ — MejoraCRM (ver `ESPECIFICACION.md`).
- [x] ~~Auditar los 3 repos por secretos/datos reales expuestos~~ — hecho, sin hallazgos nuevos graves (MejoraCRM ya se había corregido antes en esta misma sesión).
- [x] ~~Definir topología de embebido~~ — acordada con Pablo: los tres independientes, MejoraCRM embebe a los otros dos, MejoraContactos y MejoraWS se embeben mutuamente.
- [x] ~~Definir mecanismo técnico de embebido~~ — iframe para web↔web, webview para Electron→web, bridge local + launcher para web→Electron (no se reescribe Baileys).
- [x] Crear infraestructura de continuidad (`mejorasuite/` en MejoraCRM: este archivo, `ESPECIFICACION.md`, `DECISIONES.md`, `PROMPT_CONTINUACION.md`, `handoffs/`).

## Fase 1 — Bridge local de MejoraWS ✅ (2026-08-15)

**Rutas locales confirmadas** (los 3 repos ya existen localmente, no hace falta clonar nada):
- MejoraCRM: `C:\Github\Negocio\MejoraCRM`
- MejoraContactos: `C:\Github\Negocio\MejoraContactos`
- MejoraWS: `C:\Github\Herramientas\MejoraWS`

- [x] ~~Servidor HTTP local en `MejoraWS/electron/bridge.mjs`~~ — `127.0.0.1:4180`, sin dependencias nuevas (`node:http`). `GET /status` (conectado/desconectado, campaña corriendo/pausada) y `GET /events` (SSE — eventos `status` y `message`). Token compartido en `userData/bridge-token.txt`, exigido por header `X-Bridge-Token`, `127.0.0.1` únicamente.
- [x] ~~Integración en `main.mjs`~~ — puramente aditiva (nuevas variables `waStatus`/`bridge`, `startBridgeServer()` en `app.whenReady()`, `broadcastEvent` en los 3 puntos donde ya se emitía `wa:status` + en `messages.upsert`). Cero cambios de comportamiento hacia el renderer existente.
- [x] ~~Verificación end-to-end~~ — `node --check` en ambos archivos, `npx electron .` levantado en background, `GET /status` con y sin token (200 y 401 respectivamente), `GET /events` con curl -N confirmando el evento `hello`. Proceso de prueba cerrado con `taskkill`.
- [x] ~~Actualizar `MejoraWS/CLAUDE.md` y `TRANSCRIPCION-SESION.md`~~ — hecho, siguiendo su propio dogma de transcripción continua.
- [x] ~~Commit + push a `master` de MejoraWS~~ — `9cbd381`.

**Fase 1b (deferida a propósito, no es parte de esta fusión todavía):** `POST /send` — encolar un envío desde afuera. No se construyó ahora porque tiene que interponerse en la cola/delay/tope diario existente en `main.mjs` sin bypasearla nunca; se hace con el mismo cuidado que el resto de la app, no apurado dentro de este primer bloque. Ver `DECISIONES.md`.

## Fase 2 — MejoraWS embebe MejoraContactos ✅ (2026-08-15)

- [x] ~~`WebContentsView` en el proceso principal de MejoraWS~~ — no se usó `<webview>`/`BrowserView` (deprecada); `ensureContactosView()` en `main.mjs`, apuntando a `https://pabloeckert.github.io/MejoraContactos/`, creado una vez y alternado con `setVisible()`.
- [x] ~~Botón/tab nuevo en `src/App.jsx`~~ — "Campañas" / "Contactos", con un slot dedicado que manda sus coordenadas reales al proceso principal vía IPC (`contactos:show`/`updateBounds`/`hide`).
- [x] ~~Verificación end-to-end~~ — vía Chrome DevTools Protocol (no solo lectura de código): click real en la pestaña, sin excepciones, y confirmado un segundo target CDP con el contenido real de MejoraContactos cargado adentro de la ventana. Commit `470f688` en `master` de MejoraWS.

## Fase 3 — MejoraContactos embebe MejoraWS ✅ (2026-08-15, status; envío queda para Fase 1b)

- [x] ~~Protocolo `mejoraws://` + forma de que la web obtenga el token del bridge~~ — resuelto en MejoraWS: botón "Copiar token de conexión" en la barra superior (IPC `bridge:copyToken` → `clipboard.writeText`), porque una web sin filesystem no puede leer `bridge-token.txt` del disco como sí podría otra app Electron. Protocolo `mejoraws://` registrado con `app.setAsDefaultProtocolClient` (dev y empaquetado), `requestSingleInstanceLock` ya existente evita instancias duplicadas. Header `Access-Control-Allow-Private-Network: true` agregado al bridge — sin esto Chrome bloquea el preflight de cualquier página HTTPS pública (MejoraContactos en GitHub Pages) hablando con `127.0.0.1`. Commit `435b6b3` en `master` de MejoraWS, verificado end-to-end con Electron real + CDP (click real, token real confirmado en el portapapeles de Windows vía `Get-Clipboard`).
- [x] ~~Panel nuevo en MejoraContactos (`GET /status`)~~ — `src/lib/mejoraws-bridge.ts` (cliente HTTP, token cifrado en localStorage con el mismo AES-GCM que las API keys de IA) + `src/components/MejoraWsPanel.tsx` (UI en Ajustes: pegar token una vez, estado conectado/desconectado en vivo, botón "Abrir MejoraWS" si no responde). 8 tests nuevos. Verificado end-to-end real: Browser pane + MejoraWS corriendo en paralelo, token real pegado a mano, `Network requests` confirmando el preflight PNA + `GET /status` 200 cada 6s, UI mostrando el estado real del bridge. Commit `7383cb3` en `main` de MejoraContactos (auto-deploy a GitHub Pages ya disparado por el push).
- [ ] **Diferido a propósito, no es parte de esta fusión todavía:** acción "enviar por WhatsApp" en `ContactsTable.tsx`/`ExportPanel.tsx` — depende de que el bridge tenga `POST /send` (Fase 1b, ver arriba, deliberadamente no construido aún por el riesgo de interponerse en la cola/delay/tope diario sin la cautela debida).

## Fase 4 — MejoraCRM embebe a los dos ✅ (2026-08-15, status; ver pendiente de auto-Interacción abajo)

- [x] ~~Nueva página `/contactos` en MejoraCRM~~ — `<iframe>` a `https://pabloeckert.github.io/MejoraContactos/`, cero acoplamiento de código.
- [x] ~~Nueva página `/whatsapp-campanas`~~ — panel de estado de MejoraWS vía su bridge, mismo patrón que el panel de MejoraContactos (Fase 3). `src/lib/mejoraws-bridge.ts` es una copia deliberada del cliente (no un paquete compartido — cada producto de la suite sigue siendo independiente).
- [x] ~~Entradas nuevas en `AppSidebar.tsx`~~ — roles `["admin", "supervisor"]`, mismo patrón que "Link WhatsApp" ya existente (decisión autónoma, ver `DECISIONES.md`).
- [x] ~~Verificación end-to-end~~ — typecheck, build, 138/138 tests, lint limpios; ambas páginas confirmadas en navegador real (iframe cargando la URL correcta, panel cayendo a "no está corriendo" cuando el bridge no responde — comportamiento esperado, no un bug). Commit `2d605b60` en `main` de MejoraCRM.
- [ ] **Pendiente, no bloqueante:** Bridge de MejoraWS → Interacción del CRM automática (cuando llega un evento de respuesta/envío por `GET /events`, crear una `Interaction` vía Supabase/hook existente) — esto es lo que cierra el "hoy los mensajes de WhatsApp no dejan rastro en el CRM" del brief original de Lovable. Requiere decidir cómo autenticar esa escritura desde el navegador contra Supabase (el CRM ya tiene sesión de usuario logueado, así que probablemente reusa esa sesión en vez de necesitar algo nuevo) — se deja para una sesión con más espacio para pensarlo bien, no es una tarea de 5 minutos como el resto de esta fase.

## Fase 5 — Pulido y empaquetado

- [ ] KPI nuevo en el dashboard: enviados/respondidos/tasa de respuesta por carpeta de campaña (una vez que las Interacciones se generan solas desde Fase 4).
- [ ] CI de cada repo sigue siendo independiente — no se crea un CI unificado (no hay un solo build que abarque los tres).
- [ ] Documentación final: actualizar `README.md` de los 3 repos con un diagrama de la topología de embebido y links cruzados.

## Bloqueado / requiere a Pablo

- [ ] Rotar `service_role` key de Supabase de MejoraCRM (Dashboard → Project Settings → API) — pendiente desde el hallazgo de seguridad, no depende de esta fusión pero sigue abierto.
- [x] ~~Confirmar puerto y esquema de auth mínima del bridge local de MejoraWS~~ — resuelto de forma autónoma (dogma de autonomía, no era irreversible ni requería a Pablo): puerto `4180` ya elegido en Fase 1 se mantuvo; auth resuelta con copy-paste manual del token (ver Fase 3 arriba) en vez de intentar que la web lea el archivo del disco.

## Próximo paso real (según esta sesión, 2026-08-15)

Fases 1 a 4 completas en los tres repos. Lo que sigue, ninguno bloquea al otro:
1. **Fase 1b** — `POST /send` en el bridge de MejoraWS (interponerse con cuidado en la cola/delay/tope diario existente), lo que habilita el checkbox diferido de Fase 3 ("enviar por WhatsApp" desde `ContactsTable.tsx`) y el auto-Interacción pendiente de Fase 4.
2. **Fase 5** — pulido y empaquetado (ver sección de arriba): KPI de campañas en el dashboard, README de los 3 repos con diagrama de la topología.
