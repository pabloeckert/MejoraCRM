# Base de Datos — MejoraCRM

## Diagrama de entidades

```
auth.users (Supabase Auth)
    │
    ├── 1:1 ── profiles (nombre, avatar)
    ├── 1:N ── user_roles (admin/supervisor/vendedor)
    │
    ├── 1:N ── clients (asignado a vendedor)
    │              │
    │              ├── 1:N ── interactions
    │              └── 1:N ── opportunities ─── products
    │
    └── 1:N ── interactions (registradas por usuario)
```

## Tablas

### profiles
Perfil del usuario, creado automáticamente al registrarse.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users, UNIQUE |
| full_name | TEXT | Nombre completo |
| avatar_url | TEXT | URL del avatar |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Trigger |

### user_roles
Roles del usuario. Un usuario puede tener múltiples roles.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users |
| role | app_role | admin/supervisor/vendedor |

### clients
Clientes y leads del CRM.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| name | TEXT | Nombre/empresa |
| company | TEXT | Empresa |
| contact_name | TEXT | Persona de contacto |
| segment | TEXT | Segmento |
| location | TEXT | Ubicación |
| whatsapp | TEXT | WhatsApp |
| email | TEXT | Email |
| channel | TEXT | Canal de ingreso |
| first_contact_date | DATE | Primer contacto |
| status | client_status | lead/cliente/inactivo |
| notes | TEXT | Observaciones |
| assigned_to | UUID | FK → auth.users (vendedor) |

### interactions
Registro de cada contacto con un cliente.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| client_id | UUID | FK → clients |
| user_id | UUID | FK → auth.users |
| interaction_date | TIMESTAMPTZ | Fecha del contacto |
| medium | interaction_medium | whatsapp/email/llamada/redes/reunion |
| type | interaction_type | consulta/cotizacion/seguimiento/cierre |
| product_id | UUID | FK → products |
| result | interaction_result | interes/venta/sin_respuesta/rechazo |
| next_step | TEXT | Próximo paso |
| follow_up_date | DATE | Fecha seguimiento |
| notes | TEXT | Observaciones |

### opportunities
Oportunidades de venta en el pipeline.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| client_id | UUID | FK → clients |
| product_id | UUID | FK → products |
| stage | opportunity_stage | prospecto → cerrado_ganado/perdido |
| estimated_amount | NUMERIC(12,2) | Monto estimado |
| loss_reason | TEXT | Motivo de pérdida (obligatorio si perdida) |
| assigned_to | UUID | FK → auth.users |

### products
Catálogo de productos/servicios.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| name | TEXT | Nombre |
| category | TEXT | Categoría |
| price | NUMERIC(12,2) | Precio |
| active | BOOLEAN | Activo/inactivo |

## Productos sembrados (seed)

| Producto | Categoría | Precio |
|----------|-----------|--------|
| Plantines de Eucalipto | Forestal | $150 |
| Plantines de Pino | Forestal | $120 |
| Servicio de Poda | Servicios | $5,000 |
| Servicio de Raleo | Servicios | $8,000 |
| Madera Aserrada | Productos | $25,000 |
| Chips de Madera | Productos | $15,000 |
| Consultoría Forestal | Servicios | $10,000 |
| Fertilizantes | Insumos | $3,500 |
| Herbicidas | Insumos | $4,200 |
| Maquinaria (alquiler) | Servicios | $20,000 |

## Enums

```sql
app_role: admin, supervisor, vendedor
client_status: lead, cliente, inactivo
interaction_medium: whatsapp, email, llamada, redes, reunion
interaction_type: consulta, cotizacion, seguimiento, cierre
interaction_result: interes, venta, sin_respuesta, rechazo
opportunity_stage: prospecto, contactado, cotizacion, negociacion, cerrado_ganado, cerrado_perdido
```
