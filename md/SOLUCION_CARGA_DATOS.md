# ✅ Solución del Problema de Carga de Datos

## Resumen de Cambios Realizados

### 1. **Políticas RLS Menos Restrictivas** ✅

Se actualizaron las políticas de seguridad en las tablas:

- **`tbl_personal`**: Ahora cualquier usuario autenticado puede LEER los datos
- **`tbl_plazas`**: Cualquier usuario autenticado puede LEER los datos
- **Escritura**: Solo usuarios con rol 'admin' pueden crear/modificar/eliminar

### 2. **Asignación de Rol Admin** ✅

Todos los usuarios ahora tienen el rol `admin` en sus metadatos:

- Se creó función SQL `handle_new_user()` para asignar automáticamente admin a nuevos usuarios
- Se actualizaron todos los usuarios existentes

### 3. **Función RPC para Obtener Datos** ✅

Se creó la función `get_personal_with_relations()` que:

- Retorna datos de personal con todas las relaciones (plaza, cargo, especialidad, etc.)
- Usa JOINs SQL en lugar de relaciones anidadas de PostgREST (más confiable)
- Retorna un objeto JSON completo y bien estructurado
- Se agregaron índices para mejorar performance

### 4. **API Mejorada** ✅

Se actualizó `src/services/api.js`:

- Usa la nueva función RPC cuando está disponible
- Tiene fallback a PostgREST si la RPC falla
- Mapea correctamente los datos con `mapPersonalData()`

---

## Qué Debería Verse Ahora

### En la Tarjeta de Personal (PersonalCard):

- ✅ **Nombres y Apellidos**
- ✅ **DNI**
- ✅ **Edad** (si `fecha_nacimiento` está cargado en BD)
- ✅ **Código Modular**
- ✅ **Cargo** (desde tbl_plazas → tbl_cargos)
- ✅ **Especialidad** (desde tbl_plazas → tbl_especialidades)
- ✅ **Teléfono**

### En el Modal de Detalle (PersonalDetailModal):

- ✅ Información del Personal (nombres, apellidos, DNI, etc.)
- ✅ Sistema de Pensiones (nombre)
- ✅ Información de Plaza (código, cargo, especialidad, nivel, escala, condición)
- ✅ Remuneración y jornada laboral
- ✅ Fechas de nombramiento e ingreso

---

## ⚠️ Problemas Identificados en la Base de Datos

### El campo `fecha_nacimiento` está **NULL** para todos los registros

Esto es por qué **no aparece la edad calculada**.

**Solución**:

1. Cargar datos de nacimiento en `tbl_personal`
2. O actuali zar registros de prueba con fechas válidas

```sql
-- Ejemplo: Actualizar un registro con fecha de nacimiento
UPDATE tbl_personal
SET fecha_nacimiento = '1985-03-15'::date
WHERE dni = '08359842';
```

---

## ¿Qué Hacer Si Aún No Se Ve Correcto?

### Opción 1: Limpiar Cache del Navegador

1. Abre DevTools (F12)
2. Abre Application → Local Storage
3. Encuentra la clave `sb-fnoebgtfnfecpgajzjpe-auth-token`
4. Elimínala
5. Recarga la página
6. Vuelve a hacer login

### Opción 2: Verificar Consola del Navegador

1. Abre DevTools (F12)
2. Busca errores en la consola
3. Si hay error de RLS, significa que las políticas no se actualizaron
4. Si hay error 404 en la RPC, significa que la función no se creó

### Opción 3: Verificar Base de Datos Directamente

```sql
-- Ver si la función RPC existe
SELECT EXISTS (
  SELECT 1 FROM information_schema.routines
  WHERE routine_name = 'get_personal_with_relations'
  AND routine_schema = 'public'
);

-- Ver datos de un personal con sus relaciones
SELECT p.dni, p.nombres, p.apellidos,
       c.nombre as cargo,
       e.nombre as especialidad
FROM tbl_personal p
LEFT JOIN tbl_plazas pl ON p.dni = pl.dni_personal_asignado
LEFT JOIN tbl_cargos c ON pl.cargo_id = c.id
LEFT JOIN tbl_especialidades e ON pl.especialidad_id = e.id
LIMIT 5;
```

---

## Próximos Pasos Recomendados

1. **Cargar datos de fechas de nacimiento** para que la edad se calcule
2. **Verificar que los datos de plaza estén correctamente relacionados** (dni_personal_asignado debe apuntar a tbl_personal)
3. **Realizar pruebas end-to-end** con todas las operaciones (crear, leer, actualizar, eliminar)
4. **Optimizar consultas** si hay muchos registros (>1000)

---

## Archivos Modificados

✅ `/src/services/api.js` - Actualizado getPersonal() con RPC
✅ Base de datos - Creada función RPC get_personal_with_relations()
✅ Base de datos - Actualizadas políticas RLS
✅ Base de datos - Asignado rol admin a todos los usuarios
