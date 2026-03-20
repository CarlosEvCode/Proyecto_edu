# Guia Paso a Paso - Migrar Supabase (Estructura)

Esta guia permite reconstruir en otra cuenta Supabase la estructura del proyecto
colegio: tablas, relaciones, funciones, triggers, RLS e indices.

## 1) Preparar proyecto destino

1. Crear proyecto nuevo en Supabase.
2. Esperar a que termine el provisioning.
3. Abrir SQL Editor.

## 2) Ejecutar SQL en este orden

1. `00_instalacion_extensions.sql`
2. `01_migraciones_colegio.sql`
3. `02_snapshot_policies_functions_indexes.sql`

Recomendacion:

- Ejecutar cada archivo por separado.
- Validar errores antes de continuar.

## 3) Verificar que la estructura quedo igual

En Table Editor deben existir estas tablas de negocio en `public`:

- `niveles`, `aulas`, `apoderados`, `direcciones`, `estudiantes`
- `tbl_personal`, `tbl_plazas`
- `tbl_cargos`, `tbl_condiciones`, `tbl_especialidades`, `tbl_niveleseducativos`, `tbl_escalasmagisteriales`, `tbl_sistemaspensiones`
- `users_profiles`, `user_roles`, `audit_log`

## 4) Orden sugerido para cargar datos CSV

Si luego vas a importar datos, hazlo en orden de dependencias:

1. `user_roles`
2. catalogos: `niveles`, `tbl_cargos`, `tbl_condiciones`, `tbl_especialidades`, `tbl_niveleseducativos`, `tbl_escalasmagisteriales`, `tbl_sistemaspensiones`
3. `aulas`
4. `direcciones`
5. `apoderados`
6. `tbl_personal`
7. `tbl_plazas`
8. `estudiantes`
9. `users_profiles` (solo si realmente quieres migrar perfiles)

## 5) Auth y Storage

- `auth.users` no se migra con CSV simple desde Dashboard de forma directa como tabla comun.
- `storage.*` tampoco suele migrarse por CSV como flujo principal.

Revisa `GUIA_AUTH_SUPABASE.md` para auth.

## 6) Ajustes finales

1. Configurar URL/base keys del frontend al nuevo proyecto.
2. Revisar Authentication > URL Configuration (site url, redirect urls).
3. Validar login, lectura y escritura con un usuario real.
4. Revisar RLS con una cuenta `admin` y otra no admin.

## Nota importante

Hay una inconsistencia heredada en el origen:

- existe trigger/funcion de auditoria de roles (`audit_role_change`) que referencia
  `public.role_change_audit`, pero esa tabla fue eliminada en una migracion previa.

Si se actualiza `users_profiles.role`, podria fallar. Esta exportacion conserva el
estado original para que el nuevo dev decida como corregirlo.
