# Guia Auth Supabase (migracion segura)

Esta parte es clave: las tablas de `auth` son administradas por Supabase y no se
tratan igual que tablas de negocio.

## Lo que ya contempla esta carpeta

- Trigger `on_auth_user_created` en `auth.users`.
- Funcion `public.handle_new_user()` que crea fila en `public.users_profiles`.

Eso significa:

- Si creas usuarios nuevos en Auth, su perfil se crea automaticamente.

## Opciones para migrar usuarios

### Opcion A (recomendada): no migrar passwords, reenrolar usuarios

1. Crear usuarios por invitacion o admin API.
2. Hacer que definan nueva contrasena (reset/invite flow).
3. Mantener/ajustar `users_profiles.role` y `school`.

Ventaja: mas seguro y simple.

### Opcion B: migracion avanzada de Auth

Solo si el nuevo dev maneja scripts admin y entiende riesgos:

- migrar emails/metadatos por Admin API;
- forzar reset de password despues.

No se recomienda copiar tablas internas de `auth` manualmente.

## Flujo sugerido para este proyecto

1. Ejecutar SQL de estructura.
2. Crear primer usuario admin en Auth del proyecto nuevo.
3. Verificar que aparece en `public.users_profiles`.
4. Ajustar rol en `users_profiles` a `admin` si hace falta.
5. Crear resto de usuarios por invitacion.

## Verificaciones utiles

```sql
select id, email, role, is_active
from public.users_profiles
order by created_at desc
limit 20;
```

```sql
select role, count(*)
from public.users_profiles
group by role;
```

## Detalle a revisar por el nuevo desarrollador

Existe un trigger de auditoria de rol (`audit_role_change_trigger`) que depende de
`public.role_change_audit`, tabla eliminada en migraciones historicas.

Antes de cambiar roles en produccion, deben:

- o recrear `public.role_change_audit`,
- o remover ese trigger/funcion.
