# Guia Importacion CSV (Sin perder integridad)

Si, exportar tus tablas en CSV es una forma correcta para mover datos de negocio.
Lo importante es respetar orden y llaves foraneas.

## Que si conviene migrar por CSV

- Tablas de negocio en `public`.
- Catalogos (`tbl_*`, `niveles`, etc).
- Entidades (`estudiantes`, `tbl_personal`, etc).

## Que NO conviene migrar por CSV directamente

- `auth.users` y tablas internas de `auth`.
- `storage.*`, `realtime.*`, `supabase_migrations.*`.

Para auth, usar flujo de invitacion/reset o script admin (ver `GUIA_AUTH_SUPABASE.md`).

## Orden recomendado de importacion

Importa en este orden para evitar errores de FK:

1. `user_roles`
2. `niveles`
3. `tbl_cargos`
4. `tbl_condiciones`
5. `tbl_especialidades`
6. `tbl_niveleseducativos`
7. `tbl_escalasmagisteriales`
8. `tbl_sistemaspensiones`
9. `aulas`
10. `direcciones`
11. `apoderados`
12. `tbl_personal`
13. `tbl_plazas`
14. `estudiantes`
15. `users_profiles` (opcional, solo si vas a mapear usuarios reales)

## Reglas practicas para CSV

- Mantener nombres de columnas exactamente iguales.
- No cambiar tipos (fechas, numeros, uuid).
- Usar UTF-8.
- Evitar celdas con formato raro (especialmente fechas).
- Si hay IDs manuales, respetar los mismos valores para mantener relaciones.

## Importar desde Supabase Dashboard

1. Table Editor > seleccionar tabla.
2. `Insert` / `Import data from CSV`.
3. Mapear columnas si lo pide.
4. Ejecutar.
5. Repetir con la siguiente tabla del orden.

## Problemas comunes

- Error FK: importaste una tabla hija antes que la padre.
- Error de tipo date/timestamp: formato invalido en CSV.
- Error unique: hay duplicados en columnas unicas (ej. `codigo_modular`, `email`).

## Despues de importar

Validar con queries simples:

```sql
select count(*) from public.estudiantes;
select count(*) from public.tbl_personal;
select count(*) from public.tbl_plazas;
```

Y validar joins:

```sql
select e.id, e.dni, a.id as aula_id
from public.estudiantes e
left join public.aulas a on a.id = e.aula_id
where e.aula_id is not null
limit 20;
```

## Recomendacion final

Haz primero una prueba con un subconjunto pequeno de CSV en un proyecto temporal.
Cuando todo valide, repites en el proyecto final.
