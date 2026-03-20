# Checklist Verificacion Post-Migracion

Usa este checklist cuando termines de restaurar e importar.

## Infraestructura

- [ ] Proyecto Supabase nuevo creado.
- [ ] `00_instalacion_extensions.sql` ejecutado.
- [ ] `01_migraciones_colegio.sql` ejecutado.
- [ ] `02_snapshot_policies_functions_indexes.sql` ejecutado.

## Esquema

- [ ] Existen todas las tablas de `public` del proyecto colegio.
- [ ] FKs creadas sin errores.
- [ ] Indices principales creados.
- [ ] Funciones RPC visibles (`get_personal_with_relations`, `search_personal_with_filters`, etc).
- [ ] Triggers creados (`on_auth_user_created`, etc).

## RLS / Seguridad

- [ ] RLS habilitado en tablas sensibles.
- [ ] Politicas `p_*` presentes.
- [ ] Usuario admin puede leer/escribir.
- [ ] Usuario no admin respeta restricciones.

## Datos CSV

- [ ] CSV importados en orden correcto.
- [ ] Conteos de filas esperados por tabla.
- [ ] Sin errores de FK pendientes.
- [ ] Muestras de joins validadas.

## Auth

- [ ] Se puede registrar/invitar usuario.
- [ ] Se crea `users_profiles` automaticamente al crear usuario auth.
- [ ] Roles cargados correctamente en `users_profiles`.
- [ ] Flujo de login funcional desde frontend.

## Aplicacion

- [ ] Variables `SUPABASE_URL` y keys apuntan al nuevo proyecto.
- [ ] Login funciona.
- [ ] Lectura de estudiantes/personal funciona.
- [ ] Operaciones de creacion/edicion funcionan.

## Punto de atencion heredado

- [ ] Revisado tema `audit_role_change_trigger` vs tabla `role_change_audit`.
