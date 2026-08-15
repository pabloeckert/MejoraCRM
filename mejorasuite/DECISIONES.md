# Decisiones — MejoraSuite

Log append-only. No se edita lo viejo, solo se agrega. Cada entrada: fecha, decisión, motivo.

---

## 2026-08-15 — Fase 2: `WebContentsView`, no `<webview>` ni `BrowserView`

**Decisión:** el embebido de MejoraContactos dentro de MejoraWS usa la API `WebContentsView` de Electron, manejada 100% desde el proceso principal y posicionada con bounds reales que manda el renderer.
**Motivo:** `ESPECIFICACION.md` proponía `<webview>`/`BrowserView` como opción original. Al implementar se verificó contra los tipos de la versión instalada (Electron 43.3.0) que `BrowserView` sigue existiendo pero está deprecada, y `WebContentsView` es la reemplazante recomendada — además evita tener que habilitar `webviewTag: true` en `webPreferences` (Electron desaconseja esa opción por superficie de ataque innecesaria cuando no hace falta). Se mantiene la misma idea de fondo (embebido nativo, no iframe, porque es Electron embebiendo web) solo que con la API vigente.

## 2026-08-15 — Fase 1 del bridge sale de solo lectura, `POST /send` se difiere (Fase 1b)

**Decisión:** el bridge local de MejoraWS (`electron/bridge.mjs`) sale con `GET /status` y `GET /events` únicamente. No se construye `POST /send` en este mismo bloque de trabajo.
**Motivo:** `PENDIENTES.md` original incluía `/send` en la Fase 1, pero interponerse en el envío real de WhatsApp desde un endpoint nuevo, sin haber podido auditar con calma cada rincón de la cola/delay/tope diario de `main.mjs` primero, es exactamente el tipo de atajo que ya se descartó como criterio general (ver la decisión de no reescribir Baileys). Se prefiere entregar la parte de solo lectura ya probada de punta a punta y construir `/send` después, con el mismo nivel de cuidado, en vez de apurar algo con costo real si sale mal (riesgo de ban de cuenta).

## 2026-08-15 — Veredicto de rector: MejoraCRM

**Decisión:** de los tres proyectos, MejoraCRM es el rector.
**Motivo:** es el único con usuarios reales, modelo de datos multi-tenant y auth ya resueltos — los otros dos no tienen que rehacer nada de eso, se conectan a lo que ya existe. Propuesta original de Lovable, confirmada por Claude tras auditar el código real de los tres repos (no solo el resumen de Lovable).

## 2026-08-15 — Se descarta la fusión de código en un solo repo/Electron

**Decisión:** no se hace lo que proponía Lovable (un solo repo Vite+Electron, Baileys portado a TS, motor de contactos incrustado). Los tres siguen siendo repos y deploys separados.
**Motivo:**
1. MejoraContactos no es "repuestos" — es un producto SaaS público en vivo (landing, pricing, tiers free/pro, deploy a GitHub Pages). Fusionarlo adentro de un CRM interno de escritorio lo hubiera discontinuado como producto sin que Pablo lo pidiera explícitamente.
2. Una sesión anterior de Claude, trabajando en `motor-contactos/`, ya evaluó exactamente la pregunta "¿reimplemento el envío de WhatsApp acá adentro?" para la relación motor-contactos↔MejoraWS y la rechazó por escrito (`mejoraws_launcher.py`, docstring): dos stacks completamente distintos, riesgo real de ban de cuenta de WhatsApp si se reimplementa mal, duplicar lógica ya afinada (delay random, tope diario) es más riesgo, no menos. Se aplicó el mismo criterio a los tres pares.
3. `motor-contactos/` en sí (el motor Python) resultó ser un proyecto personal ya cerrado el 2026-08-13 (36.103 contactos reales de Pablo/Sindy procesados, MVP dado por terminado) — no es un motor reutilizable para incrustar, ya cumplió su función.

## 2026-08-15 — Topología de embebido (decisión de Pablo, tras varias rondas de ida y vuelta)

**Decisión:**
```
MejoraCRM        → embebe adentro a MejoraContactos y a MejoraWS
MejoraContactos  → embebe adentro a MejoraWS
MejoraWS         → embebe adentro a MejoraContactos
```
Los tres siguen siendo productos 100% independientes (repo, deploy, negocio propios); el embebido es *además de*, no *en vez de*, la independencia.

## 2026-08-15 — Mecanismo técnico del embebido (decisión de Claude)

**Decisión:** iframe para los pares web↔web (CRM↔Contactos), `<webview>`/`BrowserView` de Electron para cuando MejoraWS embebe una web (Contactos), y un bridge HTTP/WebSocket local en `localhost` expuesto por el proceso principal de MejoraWS para cuando una web (CRM o Contactos) necesita embeber/hablar con MejoraWS — sin mover ni reescribir la lógica de Baileys.
**Motivo:** cumple la topología pedida sin acoplar código ni builds entre los tres, y sin tocar la lógica de WhatsApp ya afinada (ver decisión anterior). Es el mecanismo de menor riesgo que satisface "independiente pero también embebido" al mismo tiempo.

## 2026-08-15 (cont.) — Fase 3: cómo una web sin filesystem se autentica contra el bridge

**Decisión:** el token del bridge (`bridge-token.txt`, pensado originalmente para que "otra app del mismo usuario en la misma máquina lo pueda leer") se copia a mano una única vez desde un botón nuevo en la propia UI de MejoraWS ("Copiar token de conexión", `clipboard.writeText` vía IPC) y se pega en un campo de Ajustes de MejoraContactos, que lo guarda cifrado en `localStorage` (mismo AES-GCM que ya usa ese repo para las API keys de IA).
**Motivo:** `ESPECIFICACION.md` no había resuelto esto en el detalle — decía que el bridge exponía un token para que "otra app... lo pueda leer", asumiendo acceso a filesystem. MejoraContactos es una SPA 100% client-side, sin backend propio y sin acceso al sistema de archivos del usuario — no hay forma de que lea `bridge-token.txt` del disco por su cuenta. Copy-paste manual una sola vez es la solución de menor complejidad que no debilita el modelo de seguridad del bridge (sigue exigiendo el token real, no se abre ningún endpoint sin autenticar).
**Efecto secundario que también hubo que resolver:** Chrome bloquea por Private Network Access el fetch de una página pública/HTTPS (MejoraContactos en GitHub Pages) contra `127.0.0.1` salvo que el server conteste el preflight con `Access-Control-Allow-Private-Network: true` — se agregó al bridge. Sin esto, el token hubiera sido irrelevante: el fetch ni siquiera llegaba a ejecutarse.
**Verificado end-to-end de las dos puntas**, no solo leído: MejoraWS con Electron real + Chrome DevTools Protocol (click real en "Copiar token", confirmado el token real en el portapapeles de Windows vía `Get-Clipboard`, coincide con `bridge-token.txt`), y MejoraContactos con el Browser pane + MejoraWS corriendo en paralelo (token real pegado a mano, `GET /status` real devolviendo 200 cada 6s, UI mostrando el estado real).

## 2026-08-15 — Fase 4: roles del sidebar y por qué `mejoraws-bridge.ts` se duplica en vez de compartirse

**Decisión:** `/contactos` y `/whatsapp-campanas` en MejoraCRM quedan visibles solo para `admin`/`supervisor`, mismo patrón que "Link WhatsApp" ya existente. `PENDIENTES.md` tenía esto marcado como "a definir con Pablo" — se resolvió de forma autónoma en vez de parar a preguntar (dogma de autonomía: no es irreversible, es un `roles: [...]` de un array que se cambia en una línea si hace falta).
**Motivo del rol:** ambas páginas son herramientas de gestión/marketing (limpieza de contactos, campañas masivas), no tareas diarias de un vendedor — mismo criterio que ya se aplicó a "Link WhatsApp", "Productos" y "Reportes".
**Motivo de la duplicación de `mejoraws-bridge.ts`** (existe casi idéntico en MejoraContactos y ahora en MejoraCRM): no hay un paquete compartido entre los tres repos — esa fue la decisión de fondo de toda la fusión (independencia real, no monorepo). Duplicar 90 líneas de un cliente HTTP sin estado es más barato que introducir un paquete npm compartido (versionado, publicación, sincronización) para algo tan chico. Si el bridge crece mucho más, reconsiderar.

## 2026-08-15 (sesión 03) — Nota sobre trabajo duplicado sin querer

Esta sesión (una conversación nueva, distinta de la sesión 02) arrancó sin memoria de que la sesión 02 ya había completado y commiteado toda la Fase 3 en los dos repos (`MejoraWS@435b6b3`, `MejoraContactos@7383cb3`/`22034ba`). Se reimplementó esa fase desde cero antes de notar (vía `git log`/`git status`, no por aviso previo) que el código en disco ya coincidía exactamente con lo commiteado — sin conflicto porque el resultado fue idéntico, pero fue esfuerzo de más. **Lección para la próxima sesión:** antes de implementar cualquier fase de `PENDIENTES.md`, correr `git log --oneline -5` y `git status` en los tres repos primero — si ya hay commits/cambios sin commitear para esa fase, leerlos antes de escribir una sola línea nueva.

## 2026-08-15 — Memoria y skills, en vez de editar los archivos de skill directamente

**Decisión:** el pedido de Pablo de "agregar esto dentro de la Skill /optimo-de-uso, /anthropic-skills:regente, /master-vision" se resuelve guardando la arquitectura de MejoraSuite en la memoria persistente de Claude Code (`memory/` del proyecto), no editando los archivos fuente de esas skills.
**Motivo:** las skills de plugin se montan en una ruta específica de cada sesión (vista una vez: `AppData\Roaming\Claude\...\local-agent-mode-sessions\<id>\...\skills\...`) — no es una ubicación estable entre sesiones, así que editarlas ahí no persistiría. La memoria de Claude Code sí está diseñada para persistir y cargarse automáticamente en sesiones futuras, independientemente de qué skill se invoque — es el mecanismo correcto para lo que Pablo pidió en la práctica (que quede disponible después), aunque no literalmente en el archivo de la skill.
