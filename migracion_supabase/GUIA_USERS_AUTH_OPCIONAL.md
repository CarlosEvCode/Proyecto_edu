# Guia opcional - Migrar `users_profiles` y usuarios Auth

Esta guia explica que hacer con usuarios cuando mueves el proyecto a otra cuenta.

## Recomendacion principal (la mejor para tu caso)

Como tienes pocos usuarios, lo ideal es:

1. No importar `users_profiles_rows.csv` al inicio.
2. Crear usuarios nuevos en Auth (Dashboard > Authentication > Users).
3. Dejar que el trigger `on_auth_user_created` cree automaticamente `public.users_profiles`.
4. Ajustar rol/school manualmente en `users_profiles`.

Ventaja: mas limpio, menos riesgo con claves y metadatos heredados.

## Si aun asi deseas migrar `users_profiles_rows.csv`

Solo hacerlo cuando ya existan esos mismos `id` en `auth.users`.

Por que:

- `public.users_profiles.id` tiene FK hacia `auth.users(id)`.
- Si importas perfiles sin tener el usuario auth, fallara por llave foranea.

## Flujo correcto para migrar perfiles existentes

1. Crear primero los usuarios en `auth.users` (por invite/admin API).
2. Confirmar que existen los UUID esperados.
3. Importar `users_profiles_rows.csv`.
4. Validar roles y `is_active`.

## Query de verificacion

```sql
select p.id, p.email, p.role, p.is_active,
       case when u.id is null then 'sin_auth' else 'ok' end as estado_auth
from public.users_profiles p
left join auth.users u on u.id = p.id
order by p.created_at desc;
```

Si aparece `sin_auth`, ese perfil no tiene usuario real en Auth y debes corregirlo.

## Nota de seguridad

No intentes copiar tablas internas `auth.*` por CSV. Para auth usar:

- invitaciones,
- restablecimiento de password,
- o scripts admin API controlados.
