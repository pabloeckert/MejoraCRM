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

## Fase 3 — MejoraContactos embebe MejoraWS

- [ ] Panel nuevo en MejoraContactos que hable con el bridge local de Fase 1 (`GET /status`, `POST /send`) — si el bridge no responde (MejoraWS no está corriendo), mostrar botón "Abrir MejoraContacto" que intente lanzarlo (mismo patrón que `motor-contactos/src/motor/mejoraws_launcher.py`, pero en TS/web — probablemente vía protocolo custom `mejoraws://` registrado por el instalador de Electron, a confirmar factibilidad).
- [ ] Acción "enviar por WhatsApp" en `ContactsTable.tsx`/`ExportPanel.tsx` que llame a `POST /send` del bridge.

## Fase 4 — MejoraCRM embebe a los dos

- [ ] Nueva página `/contactos` en MejoraCRM: `<iframe>` a la URL pública de MejoraContactos.
- [ ] Nueva página `/whatsapp-campanas` en MejoraCRM (distinta de la ya existente `/whatsapp-link`): panel que habla con el bridge de MejoraWS igual que Fase 3.
- [ ] Entradas nuevas en `AppSidebar.tsx` para ambas páginas (con roles correspondientes — a definir con Pablo si son solo-admin o todos).
- [ ] Bridge de MejoraWS → Interacción del CRM: cuando llega un evento de respuesta/envío por el stream de eventos (Fase 1), crear automáticamente una `Interaction` vía el hook `useInteractions` existente (o una función Supabase equivalente) — esto es lo que cierra el "hoy los mensajes de WhatsApp no dejan rastro en el CRM" del brief original.

## Fase 5 — Pulido y empaquetado

- [ ] KPI nuevo en el dashboard: enviados/respondidos/tasa de respuesta por carpeta de campaña (una vez que las Interacciones se generan solas desde Fase 4).
- [ ] CI de cada repo sigue siendo independiente — no se crea un CI unificado (no hay un solo build que abarque los tres).
- [ ] Documentación final: actualizar `README.md` de los 3 repos con un diagrama de la topología de embebido y links cruzados.

## Bloqueado / requiere a Pablo

- [ ] Rotar `service_role` key de Supabase de MejoraCRM (Dashboard → Project Settings → API) — pendiente desde el hallazgo de seguridad, no depende de esta fusión pero sigue abierto.
- [ ] Confirmar puerto y esquema de auth mínima del bridge local de MejoraWS (Fase 1) antes de implementarlo — decisión técnica menor, Claude puede proponer un default y seguir si Pablo no responde en el momento (dogma de autonomía).
- [ ] Confirmar si `/contactos` y `/whatsapp-campanas` en el CRM son visibles para todos los roles o solo admin/supervisor.
