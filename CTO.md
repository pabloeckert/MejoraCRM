# CTO.md — Estado del Proyecto y Roadmap

Última actualización: 2026-05-12
CTO: Asistente IA (sesión con Pablo Eckert)

---

## 1. Situación General

**Mejora CRM** es un CRM para pymes familiares (forestal, yerbatero, agro, servicios) de la región NEA/Argentina. Diseñado para equipos de 1-5 vendedores sin área comercial formal.

- **Dueño del producto:** Mejora Continua (Pablo Eckert, Sindy Geisert)
- **Partner técnico anterior:** Integra Soluciones (Martín Ezquerra) — ALIANZA TERMINADA
- **Desarrollo actual:** Nosotros (Pablo + CTO IA)
- **Deploy:** Vercel → mejoracrm.vercel.app
- **Dominio prod:** crm.mejoraok.com (pendiente configurar)

### Modelo de negocio
- Unipersonal (1 vendedor): USD 25/mes
- Pyme Pequeña (hasta 3 vendedores): USD 45/mes
- Pyme Mediana (4-6 vendedores): USD 90/mes
- Corporativo (6+): A convenir

---

## 2. Stack Técnico

- Frontend: React 18 + TypeScript + Vite
- UI: Tailwind CSS + shadcn/ui
- Backend: Supabase (Auth + PostgreSQL + RLS)
- Gráficos: Recharts
- Deploy: Vercel
- Package Manager: Bun

---

## 3. Identidad Visual (Actualizada 2026)

Fuente: GUÍA DE ESTILO 2026 — MEJORA CONTINUA

### Paleta CRM 2026 (extraída del logo MC)
- Fondo base: Blanco Puro #FFFFFF
- Fondo alternativo: Gris Plata #F2F2F2
- Títulos / Botones: Púrpura/Magenta #8B2D6B (gradiente del M en logo)
- Acentos de lujo: Dorado/Mostaza #F2BC1B (gradiente del C en logo)
- Texto de lectura: Gris Plomo #656565
- Texto principal: Negro #000000
- Warning/Ventas en curso: Naranja #F29422
- Error/Destructive: Rojo #D93D4A
- Success/Ventas logradas: Verde #2E7D32

### Lo que NO va (Guía de Estilo 2026)
- Fondos negros
- Fondos rojos sólidos
- Filtros vintage/sepia/oscuros

### Mantra Visual
Minimalista, Tecnológico, Rápido y Brillante

### Tipografía
- Principal: Bw Modelica (Medium para títulos, Regular para cuerpo)
- Alternativa web: Inter o Nunito Sans
- Evitar: Georgia, Times, fuentes con serifa

### Logo (archivos en src/assets/branding/)
- MC_Logo.png — Logo principal
- logo_costado.png — Logo horizontal
- miro_fondo_blanco.png — Isotipo

---

## 4. Funcionalidades Actuales (Código)

### Implementado
- Identidad visual MC 2026 (colores púrpura/dorado, logo MC, tipografía Inter+Bw Modelica)
- Pipeline eliminado del sidebar y rutas
- Lenguaje humano en toda la app (sin "pipeline", "lead")
- Dashboard con vista Dueño/Vendedor (toggleable en demo)
- CRUD Clientes (con import CSV, export CSV/PDF)
- Interacciones con wizard resultado-first (4 pasos)
- Filtros de período en Interacciones (hoy/semana/mes/trimestre/semestre/año)
- Motivo de rechazo obligatorio (validación zod)
- Módulo Productos completo (CRUD, unidades, CSV import con plantilla)
- Reportes básicos
- Módulo Productos básico
- Settings
- Auth (Supabase Auth, bypass en demo)
- Command Palette (Cmd+K)
- PWA install banner
- Onboarding Wizard
- Theme toggle (light/dark)
- Roles en sidebar (admin/vendedor)
- Validación WhatsApp en clientes
- Filtros de búsqueda en clientes

### NO implementado (requerido por docs)
- Cotización en Interacciones (subir JPG/PNG/PDF de proforma)
- Dashboard vendedor operativo (refinamiento)
- Google Calendar sync
- WhatsApp link de formulario
- Escaneo de tarjetas (OCR)
- Asistente IA
- Multi-tenant (cada empresa su BD aislada)
- Sistema de trial/planes
- Tests y CI/CD

---

## 5. Roadmap por Sprints

### Sprint 1 — Identidad y Lenguaje (1 semana) ← COMPLETADO
Estado: ✅ COMPLETADO (commit 90e238c, 2026-05-12)

Tareas:
1. Aplicar identidad visual MC 2026
   - Configurar paleta de colores en tailwind.config.ts
   - Reemplazar logo actual por logos MC
   - Aplicar tipografía (Bw Modelica → Inter como fallback)
   - Fondo blanco/gris plata, títulos púrpura, texto gris
2. Renombrar lenguaje en toda la app
   - Dashboard → Vista General
   - Pipeline → Proceso de ventas
   - Pipeline activo → Ventas en curso
   - Tasa de conversión → Éxito de ventas
   - Lead → Contacto
   - Leads sin contacto reciente → Contactos sin seguimiento
3. Eliminar Pipeline del sidebar
   - Quitar módulo Pipeline de la navegación
   - La lógica de cotización va a Interacciones (Sprint 2)
4. Roles diferenciados
   - Vendedor: solo sus leads, seguimientos del día, botón registrar interacción
   - Vendedor: NO ve reportes ni configuración
   - Dueño/admin: acceso completo
5. Actualizar demo data para reflejar flujo nuevo

### Sprint 2 — Core de Interacciones (2 semanas) ← EN PROGRESO
Estado: Tareas 1, 2, 3, 4 completas (commit 0da21bd)

Tareas:
1. Rediseñar flujo de Interacciones (resultado-first)
   - Paso 1: elegir cliente
   - Paso 2: elegir resultado (5 botones grandes)
     * Envié un presupuesto
     * Cerré una venta
     * Hice un seguimiento
     * Sin respuesta
     * No le interesó
   - Paso 3: campos según resultado
   - Paso 4: medio de contacto (siempre al final)
2. Módulo Productos completo
   - Campos: nombre, categoría, unidad de medida, precio de lista, moneda
   - Unidades predefinidas + personalizadas
   - Importación CSV con plantilla descargable
   - Acceso por perfil (admin edita, vendedor consume)
3. Filtros de período
   - día, semana, mes, trimestre, semestre, año
   - En interacciones y reportes
4. Motivo de rechazo obligatorio
   - Campo aparece cuando resultado es "No le interesó"
   - Motivos aparecen en reportes
5. Cotización en Interacciones
   - Subir JPG/PNG/PDF de proforma
   - Valor de negociación automático o manual
6. Dashboard Dueño unificado
   - Layout: Resultados Directos → Gestión Comercial → Rendimiento Equipo → Análisis
   - Métricas según documento de Ajustes CRM

### Sprint 3 — Conexión y Producción (2 semanas)
Estado: PENDIENTE (después de Sprint 2)

Tareas:
1. Conectar Supabase real
   - Configurar .env con credenciales
   - Correr migraciones
   - Cargar seed data
   - DEMO_MODE = false
2. Google Calendar integration
   - Sync fecha de seguimiento → evento en calendar
   - OAuth flow
3. WhatsApp link de formulario
   - Form optimizado para mobile con 3 campos
   - Link que se pega en WhatsApp
4. Exportación completa
   - CSV respetando filtros
   - PDF formateado
   - Excel (.xlsx)
5. Tests
   - Vitest + Testing Library
   - Tests unitarios para cálculos, schemas, utils
   - Tests de componentes críticos
6. CI/CD
   - GitHub Actions: lint → build → deploy
   - Preview deployments en PRs

### Sprint 4 — Multi-tenant y Escalabilidad (futuro)
- Arquitectura multi-tenant (cada empresa su BD aislada)
- Sistema de trial/planes
- Onboarding por empresa
- Admin panel de Mejora Continua
- Facturación automática

---

## 6. Documentación del Repo

### Archivos en /docs/
- Requerimientos_del_CRM.docx — Documento fundacional
- Ajustes_CRM.docx — Cambios de UI/UX solicitados
- Ajustes_CRM1.docx — Idem (versión duplicada)
- Manual_Tecnico_v1.docx — Specs detalladas v1
- Manual_Tecnico_v2.docx — Specs detalladas v2 (la vigente)
- Observaciones_primer_bosquejo.docx — Feedback de prueba
- Requerimientos_tecnicos_ajuste.docx — Ajustes técnicos priorizados
- Brief_Base44.docx — Evaluación del MVP original
- Brian_Plan_Estrategico.pdf — Plan estratégico
- Brian_Plan_Tecnico.pdf — Plan técnico (schema Supabase)
- Identidad_Visual.docx — Especificaciones de identidad
- Minuta_Reunion_Martin.docx — Minuta reunión 16/03/2026
- Acuerdos Marco — Términos comerciales (ya no aplican con Integra)

### Archivos en /docs/branding/
- Guia_Estilo_2026.docx — GUÍA DE ESTILO VIGENTE
- manual_de_marca.pdf — Manual de marca MC general
- video_instagram.mp4 — Video de referencia

### Archivos en /src/assets/branding/
- MC_Logo.png — Logo principal
- logo_costado.png — Logo horizontal
- miro_fondo_blanco.png — Isotipo

---

## 7. Decisiones CTO Pendientes

1. Hex exactos de púrpura y dorado (extraer de logos o definir)
2. Supabase: ¿tenemos credenciales? (Pablo dice que puede revisar)
3. ¿Necesitamos crear proyecto Supabase nuevo o usar el existente?
4. ¿El dominio crm.mejoraok.com sigue apuntando a Vercel?
5. ¿Queremos mantener el multi-tenant o empezar single-tenant?

---

## 8. Cómo Retomar

Para continuar en la próxima sesión, decir "continuemos" y el CTO:

1. Lee este CTO.md para contexto completo
2. Lee memory/YYYY-MM-DD.md para estado actual
3. Pregunta qué sprint ejecutar (por defecto: Sprint 1)
4. Arranca a codear

El CTO siempre tiene acceso al repo y a todos los documentos en /docs/.
