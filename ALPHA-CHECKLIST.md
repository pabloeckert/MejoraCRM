# MejoraCRM — Alpha Checklist

## Estado: ✅ Listo para Alpha

Fecha de evaluación: 2026-04-25

---

## 🔴 CRÍTICO — Resolver antes de dar acceso

### 1. Credenciales expuestas en repo público
- [x] `.env` removido del tracking de git
- [ ] 🔑 **Rotar la anon key** en Supabase Dashboard → Settings → API → Regenerate anon key
- [ ] 🔑 Actualizar el `.env` en producción (Lovable/Vercel/hosting) con la nueva key
- [ ] Verificar que `.env.example` sigue con campos vacíos (✅ ya está)

### 2. Confirmar RLS en producción
- [ ] 🔑 Verificar en Supabase Dashboard que RLS está habilitado en TODAS las tablas
- [ ] 🔑 Probar con un usuario vendedor que solo ve sus propios clientes
- [ ] 🔑 Probar que un vendedor NO puede editar/eliminar productos

---

## 🟡 RECOMENDABLE — Mejorar antes del alpha

### 3. Usuario de prueba para el cliente
- [ ] 🔑 Crear usuario `demo@mejoraok.com` con rol `admin`
- [ ] 🔑 Crear 5-10 clientes de ejemplo realistas
- [ ] 🔑 Crear algunas interacciones de ejemplo
- [ ] Verificar que el onboarding wizard funciona bien para nuevos usuarios

### 4. Error handling en páginas
- [x] ErrorBoundary global implementado
- [x] React Query con retry configurado
- [ ] Verificar que cada página muestra estado de carga (skeletons)
- [ ] Verificar que errores de red muestran toast amigable

### 5. Datos de demo
- [ ] 🔑 Poblar la base con datos de ejemplo que el cliente pueda explorar
- [ ] Asegurar que los datos de demo NO se mezclen con datos reales

### 6. Comunicación con el cliente
- [ ] Preparar email/mensaje de invitación al alpha
- [ ] Crear formulario de feedback (Google Forms / Typeform)
- [ ] Definir scope: qué funcionalidades están disponibles en alpha
- [ ] Establecer expectativas: "alpha = puede haber bugs"

---

## 🟢 NICE TO HAVE — Post-alpha

### 7. Mejoras técnicas
- [ ] Branch protection en `main`
- [ ] Dependabot habilitado
- [ ] Monitoring básico (Supabase ya tiene logs)
- [ ] Backup automático de la base de datos

### 8. UX
- [ ] Personalizar título en hosting (si "Lovable App" aparece en algún lugar)
- [ ] Verificar que las fechas/horas usan la timezone correcta del usuario
- [ ] Testear en mobile (el index.html ya tiene viewport configurado)

---

## 📝 Funcionalidades disponibles en Alpha

| Módulo | Estado | Notas |
|---|---|---|
| Auth (login/register) | ✅ | Supabase Auth |
| Dashboard | ✅ | KPIs y gráficos |
| Clientes CRUD | ✅ | Con búsqueda, filtros, import/export |
| Interacciones | ✅ | Registro de contactos |
| Productos | ✅ | Catálogo con categorías |
| Pipeline/Oportunidades | ✅ | Kanban de ventas |
| Reportes | ✅ | Gráficos con Recharts |
| Settings | ✅ | Configuración general |
| PWA | ✅ | Instalable en mobile |
| Onboarding | ✅ | Wizard para nuevos usuarios |
| Eliminación de cuenta | ✅ | GDPR compliance |
| Privacy/Terms | ✅ | Páginas legales |

---

## 🚀 Pasos para activar Alpha

1. **Hoy:** Hacer commit del fix de `.env` y push
2. **🔑 En Supabase:** Rotar anon key, confirmar RLS
3. **🔑 Crear usuario demo** con datos de ejemplo
4. **Preparar formulario** de feedback
5. **Enviar invitación** al cliente con:
   - URL: https://crm.mejoraok.com
   - Credenciales de prueba
   - Link al formulario de feedback
   - Expectativas claras sobre alpha
