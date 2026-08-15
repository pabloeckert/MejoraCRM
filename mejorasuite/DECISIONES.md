# Decisiones — MejoraSuite

Log append-only. No se edita lo viejo, solo se agrega. Cada entrada: fecha, decisión, motivo.

---

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

## 2026-08-15 — Memoria y skills, en vez de editar los archivos de skill directamente

**Decisión:** el pedido de Pablo de "agregar esto dentro de la Skill /optimo-de-uso, /anthropic-skills:regente, /master-vision" se resuelve guardando la arquitectura de MejoraSuite en la memoria persistente de Claude Code (`memory/` del proyecto), no editando los archivos fuente de esas skills.
**Motivo:** las skills de plugin se montan en una ruta específica de cada sesión (vista una vez: `AppData\Roaming\Claude\...\local-agent-mode-sessions\<id>\...\skills\...`) — no es una ubicación estable entre sesiones, así que editarlas ahí no persistiría. La memoria de Claude Code sí está diseñada para persistir y cargarse automáticamente en sesiones futuras, independientemente de qué skill se invoque — es el mecanismo correcto para lo que Pablo pidió en la práctica (que quede disponible después), aunque no literalmente en el archivo de la skill.
