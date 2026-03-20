# Migracion Supabase - Colegio

Este directorio contiene la exportacion **sin datos** de la base Supabase actual,
lista para recrear la estructura en otra cuenta/proyecto.

Incluye:

- Migraciones historicas en orden cronologico (`01_migraciones_colegio.sql`).
- Snapshot actual de politicas RLS, funciones, triggers e indices (`02_snapshot_policies_functions_indexes.sql`).
- Extensiones requeridas para el esquema de la app (`00_instalacion_extensions.sql`).
- Guias operativas para restauracion e importacion (`*.md`).

No incluye:

- Registros de negocio (estudiantes, personal, etc).
- Datos de `auth`, `storage`, `realtime`.

## Como restaurar en otro Supabase

1. Crear proyecto nuevo en Supabase.
2. Ejecutar `00_instalacion_extensions.sql`.
3. Ejecutar `01_migraciones_colegio.sql`.
4. Ejecutar `02_snapshot_policies_functions_indexes.sql` (opcional pero recomendado para dejar el estado final exacto).
5. Revisar en Dashboard:
   - Authentication providers
   - URLs permitidas
   - Secrets/keys de Edge Functions (si luego agregan funciones)

## Guias adicionales en esta carpeta

- `GUIA_MIGRACION_PASO_A_PASO.md`
- `GUIA_IMPORTACION_CSV.md`
- `GUIA_AUTH_SUPABASE.md`
- `GUIA_USERS_AUTH_OPCIONAL.md`
- `CHECKLIST_VERIFICACION.md`

## Esquemas detectados en el proyecto origen

- `public` (schema de negocio del colegio)
- `auth` (gestionado por Supabase)
- `storage` (gestionado por Supabase)
- `realtime` (gestionado por Supabase)
- `supabase_migrations` (historial interno)
- `extensions`, `vault`, `graphql`, `graphql_public`, `pgbouncer`

## Tablas de negocio (public)

- `niveles`
- `aulas`
- `apoderados`
- `direcciones`
- `estudiantes`
- `users_profiles`
- `user_roles`
- `audit_log`
- `tbl_personal`
- `tbl_plazas`
- `tbl_cargos`
- `tbl_condiciones`
- `tbl_especialidades`
- `tbl_niveleseducativos`
- `tbl_escalasmagisteriales`
- `tbl_sistemaspensiones`
