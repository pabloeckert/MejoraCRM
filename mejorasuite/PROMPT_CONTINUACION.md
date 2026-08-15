# Cómo retomar MejoraSuite en una sesión nueva

Si Pablo escribe **"continuemos"** al arrancar una sesión nueva (se quedó sin crédito, cambió de cuenta, lo que sea): esto es lo que hay que leer, en este orden, antes de tocar nada.

1. **`ESPECIFICACION.md`** (esta carpeta) — la arquitectura completa: los 3 productos, por qué MejoraCRM es rector, la topología de embebido exacta, el mecanismo técnico decidido, y las restricciones que no se negocian (sobre todo: no tocar Baileys, no exponer `motor-contactos/Data/`).
2. **`PENDIENTES.md`** (esta carpeta) — qué está hecho, qué sigue, en qué fase se cortó la sesión anterior. Es la lista viva, más confiable que cualquier resumen que Claude pueda recordar de memoria.
3. **El handoff más reciente en `handoffs/`** (ordenado por fecha) — el estado exacto donde quedó la última sesión: qué se estaba haciendo, qué comando quedó a mitad, qué decisión estaba pendiente de confirmar.
4. **`DECISIONES.md`** (esta carpeta) — el porqué de cada decisión ya tomada, para no volver a proponer algo que ya se descartó (ej.: no volver a proponer fusionar Baileys en otro stack).

## Reglas de trabajo que aplican en cada sesión (no hace falta que Pablo las repita)

- **No consultar de más.** Pablo ya dio autonomía explícita (2026-08-15): decidir y avanzar, preguntar solo cuando sea estrictamente necesario (algo irreversible, que requiera login/acción física de Pablo, o un cambio de alcance de negocio real — como discontinuar un producto).
- **Cada paso que se cierra queda:** commiteado en el repo local correspondiente, pusheado a su GitHub, deployado (el push a `main` ya dispara el deploy automático en MejoraCRM/Vercel y MejoraContactos/GitHub Pages — no hace falta ningún paso manual extra), y documentado acá (`PENDIENTES.md` actualizado + entrada nueva en `handoffs/` si el bloque de trabajo fue grande).
- **Antes de que se corte por crédito/contexto bajo (<0.5% o señal equivalente):** usar lo que quede para dejar un handoff nuevo en `handoffs/` con fecha de hoy, actualizar `PENDIENTES.md` tachando lo hecho, y dejar claro en qué línea/archivo/paso exacto se cortó. No dejar el repo en un estado roto (build o tests en rojo) si se puede evitar — mejor cortar un paso antes y documentar "falta X" que dejar algo a medio escribir.
- **Los tres repos son independientes** — cada uno tiene su propio `CLAUDE.md` con sus propias reglas (dogma de transcripción continua en MejoraWS y MejoraContactos, por ejemplo). Seguirlas también, no solo lo de acá.

## Estado al momento de crear este documento (2026-08-15, primera sesión de MejoraSuite)

Se armó toda la especificación y el plan (`ESPECIFICACION.md`, `PENDIENTES.md`, `DECISIONES.md`), pero **todavía no se escribió código de la fusión** — la Fase 1 (bridge local en MejoraWS) es el próximo paso real. Ver `handoffs/2026-08-15-sesion-01.md` para el detalle completo de esta sesión.
