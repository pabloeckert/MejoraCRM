# Pendientes — MejoraSuite

Lista viva. Se tacha (no se borra) lo completado, se agrega lo nuevo. Es lo primero que se lee después de `PROMPT_CONTINUACION.md` y `ESPECIFICACION.md`.

## Resuelto — alineación y auditoría (2026-08-15)

- [x] ~~Definir cuál de los tres es rector~~ — MejoraCRM (ver `ESPECIFICACION.md`).
- [x] ~~Auditar los 3 repos por secretos/datos reales expuestos~~ — hecho, sin hallazgos nuevos graves (MejoraCRM ya se había corregido antes en esta misma sesión).
- [x] ~~Definir topología de embebido~~ — acordada con Pablo: los tres independientes, MejoraCRM embebe a los otros dos, MejoraContactos y MejoraWS se embeben mutuamente.
- [x] ~~Definir mecanismo técnico de embebido~~ — iframe para web↔web, webview para Electron→web, bridge local + launcher para web→Electron (no se reescribe Baileys).
- [x] Crear infraestructura de continuidad (`mejorasuite/` en MejoraCRM: este archivo, `ESPECIFICACION.md`, `DECISIONES.md`, `PROMPT_CONTINUACION.md`, `handoffs/`).

## Fase 1 — Bridge local de MejoraWS (bloqueante para todo lo demás)

Sin esto, ni MejoraCRM ni MejoraContactos tienen forma de embeber/hablar con MejoraWS.

**Rutas locales confirmadas** (los 3 repos ya existen localmente, no hace falta clonar nada):
- MejoraCRM: `C:\Github\Negocio\MejoraCRM`
- MejoraContactos: `C:\Github\Negocio\MejoraContactos`
- MejoraWS: `C:\Github\Herramientas\MejoraWS`

- [ ] En `MejoraWS/electron/main.mjs`: levantar un servidor HTTP local (puerto a definir, ej. `127.0.0.1:4180`) con:
  - `GET /status` — conectado/desconectado, cola de envíos, contador de envíos del día.
  - `POST /send` — encolar un mensaje (reusa la lógica de envío existente, mismo delay random/tope diario).
  - `GET /events` (SSE o WebSocket) — stream de eventos entrantes (respuesta recibida, tick de entrega) para que el CRM pueda crear Interacciones en tiempo real.
- [ ] CORS/seguridad del bridge: solo `localhost`, con un token compartido simple (no exponer a la red).
- [ ] Actualizar `MejoraWS/CLAUDE.md` documentando el bridge (siguiendo su propio dogma de transcripción continua).

## Fase 2 — MejoraWS embebe MejoraContactos

- [ ] `<webview>` (o `BrowserView`) en el renderer de MejoraWS apuntando a la URL pública de MejoraContactos.
- [ ] Botón/tab nuevo en la UI de MejoraWS (`src/App.jsx`) para alternar entre "Campañas" (lo que ya existe) y "Contactos" (el webview).

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
