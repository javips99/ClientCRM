# 🔌 Guía de API — ClientCRM

Todos los endpoints están en `/api/` y devuelven `Content-Type: application/json`.
Todos excepto `auth.php?action=login` y `auth.php?action=check` **requieren sesión activa** (cookie PHP `PHPSESSID`).
Los clientes y notas están aislados por `usuario_id` de sesión — un usuario nunca ve datos de otro.

---

## Autenticación — `api/auth.php`

### POST `?action=login`
Inicia sesión y establece la cookie de sesión.

**Body:**
```json
{
  "email":    "admin@clientcrm.com",
  "password": "admin123"
}
```

**Respuesta 200:**
```json
{
  "ok": true,
  "usuario": {
    "id":     1,
    "nombre": "Admin Demo",
    "email":  "admin@clientcrm.com"
  }
}
```

**Errores posibles:**

| Código | Mensaje |
|---|---|
| 400 | `"Email y contraseña son obligatorios"` |
| 400 | `"Formato de email no válido"` |
| 401 | `"Credenciales incorrectas"` |
| 500 | `"Error interno del servidor"` |

---

### POST `?action=logout`
Destruye la sesión activa.

**Respuesta 200:**
```json
{ "ok": true }
```

---

### GET `?action=check`
Comprueba si hay una sesión activa.

**Respuesta 200 (autenticado):**
```json
{
  "autenticado": true,
  "usuario": {
    "id":     1,
    "nombre": "Admin Demo",
    "email":  "admin@clientcrm.com"
  }
}
```

**Respuesta 200 (no autenticado):**
```json
{ "autenticado": false }
```

---

## Clientes — `api/clientes.php`

### GET (lista de clientes)
Devuelve todos los clientes del usuario autenticado. Acepta filtros opcionales por query string.

**Parámetros opcionales:**

| Parámetro | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| `estado` | string | Filtrar por estado | `?estado=caliente` |
| `q` | string | Búsqueda por nombre, empresa o email | `?q=garcia` |
| `limit` | int | Máximo de registros (defecto: 200, máx: 500) | `?limit=50` |
| `offset` | int | Desplazamiento para paginación | `?offset=50` |

**Respuesta 200:**
```json
[
  {
    "id":             1,
    "nombre":         "Marta García",
    "empresa":        "Innovatech S.L.",
    "email":          "marta@innovatech.com",
    "telefono":       "612 345 678",
    "estado":         "caliente",
    "valor_estimado": "12000.00",
    "creado_en":      "2026-03-15 10:30:00"
  }
]
```

---

### GET `?id=X`
Devuelve un cliente específico con todos sus campos.

**Respuesta 200:**
```json
{
  "id":              1,
  "nombre":          "Marta García",
  "empresa":         "Innovatech S.L.",
  "email":           "marta@innovatech.com",
  "telefono":        "612 345 678",
  "estado":          "caliente",
  "valor_estimado":  "12000.00",
  "usuario_id":      1,
  "creado_en":       "2026-03-15 10:30:00",
  "actualizado_en":  "2026-03-20 09:15:00"
}
```

**Errores posibles:**

| Código | Mensaje |
|---|---|
| 404 | `"Cliente no encontrado"` |

---

### POST (crear cliente)
Crea un nuevo cliente. `nombre` y `estado` son obligatorios.

**Body:**
```json
{
  "nombre":         "Nueva Empresa SL",
  "empresa":        "Nueva Empresa SL",
  "email":          "contacto@nueva.es",
  "telefono":       "600 111 222",
  "estado":         "frio",
  "valor_estimado": 3500.00
}
```

**Respuesta 201:**
```json
{ "ok": true, "id": 9 }
```

**Errores posibles:**

| Código | Mensaje |
|---|---|
| 422 | `"El nombre es obligatorio"` |
| 422 | `"Estado no válido (caliente, tibio, frio, ganado)"` |
| 422 | `"Formato de email no válido"` |
| 422 | `"El valor estimado debe ser numérico"` |

---

### PUT (actualizar cliente)
Actualiza los datos de un cliente existente. Requiere `id` en el body.

**Body:**
```json
{
  "id":             1,
  "nombre":         "Marta García",
  "empresa":        "Innovatech S.L.",
  "email":          "marta@innovatech.com",
  "telefono":       "612 345 678",
  "estado":         "ganado",
  "valor_estimado": 15000.00
}
```

**Respuesta 200:**
```json
{ "ok": true }
```

---

### DELETE `?id=X`
Elimina un cliente y todas sus notas (CASCADE).

**Respuesta 200:**
```json
{ "ok": true }
```

**Errores posibles:**

| Código | Mensaje |
|---|---|
| 400 | `"ID requerido"` |
| 404 | `"Cliente no encontrado"` |

---

## Notas — `api/notas.php`

### GET `?cliente_id=X`
Devuelve todas las notas de un cliente, ordenadas de más reciente a más antigua.

**Respuesta 200:**
```json
[
  {
    "id":         1,
    "contenido":  "Primera llamada realizada. Muy interesado.",
    "creado_en":  "2026-03-20 11:00:00",
    "autor":      "Admin Demo"
  }
]
```

**Errores posibles:**

| Código | Mensaje |
|---|---|
| 400 | `"cliente_id es obligatorio"` |
| 403 | `"Acceso denegado"` |

---

### POST (crear nota)
Añade una nota de actividad a un cliente.

**Body:**
```json
{
  "cliente_id": 1,
  "contenido":  "Reunión presencial acordada para el lunes."
}
```

**Respuesta 201:**
```json
{ "ok": true, "id": 7 }
```

---

### DELETE `?id=X`
Elimina una nota. Solo puede eliminar notas de clientes propios.

**Respuesta 200:**
```json
{ "ok": true }
```

---

## Dashboard — `api/dashboard.php`

### GET
Devuelve todas las métricas del usuario autenticado en una sola petición.

**Respuesta 200:**
```json
{
  "metricas": {
    "total_clientes":        8,
    "oportunidades_activas": 6,
    "ventas_ganadas":        2,
    "valor_pipeline":        36200.00,
    "distribucion": {
      "caliente": 2,
      "tibio":    2,
      "frio":     2,
      "ganado":   2
    }
  },
  "recientes": [
    {
      "id":             8,
      "nombre":         "Javier Moreno",
      "empresa":        "NextGen Apps",
      "estado":         "frio",
      "valor_estimado": "1500.00",
      "creado_en":      "2026-03-22 10:00:00"
    }
  ]
}
```

---

## Códigos de respuesta comunes

| Código | Significado |
|---|---|
| 200 | OK — petición procesada correctamente |
| 201 | Created — recurso creado |
| 400 | Bad Request — parámetros inválidos o faltantes |
| 401 | Unauthorized — sin sesión activa |
| 403 | Forbidden — el recurso no pertenece al usuario |
| 404 | Not Found — recurso no encontrado |
| 405 | Method Not Allowed — método HTTP no soportado |
| 422 | Unprocessable Entity — datos inválidos |
| 500 | Internal Server Error — error en servidor |
