-- =============================================
-- School Governance and Audit Baseline
-- =============================================

-- 1) User roles catalog and profile enhancements
create table if not exists public.user_roles (
  role text primary key,
  description text not null
);

insert into public.user_roles (role, description)
values
  ('admin', 'Acceso total para administración del sistema'),
  ('direccion', 'Gestión académica y administrativa de la institución'),
  ('secretaria', 'Gestión operativa y documental'),
  ('docente', 'Consulta y gestión limitada para docencia'),
  ('consulta', 'Solo lectura')
on conflict (role) do nothing;

alter table if exists public.users_profiles
  add column if not exists role text default 'consulta',
  add column if not exists school text,
  add column if not exists is_active boolean not null default true;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'users_profiles'
      and constraint_name = 'users_profiles_role_fkey'
  ) then
    alter table public.users_profiles
      add constraint users_profiles_role_fkey
      foreign key (role) references public.user_roles(role);
  end if;
end $$;

-- 2) Soft delete and audit fields for core tables
alter table if exists public.estudiantes
  add column if not exists deleted_at timestamptz,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid,
  add column if not exists deleted_by uuid;

alter table if exists public.tbl_personal
  add column if not exists deleted_at timestamptz,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid,
  add column if not exists deleted_by uuid;

create index if not exists idx_estudiantes_deleted_at on public.estudiantes(deleted_at);
create index if not exists idx_tbl_personal_deleted_at on public.tbl_personal(deleted_at);

-- 3) Audit log table
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default timezone('utc', now()),
  actor_id uuid,
  actor_role text,
  school text,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb
);

create index if not exists idx_audit_log_created_at on public.audit_log(created_at desc);
create index if not exists idx_audit_log_entity on public.audit_log(entity, entity_id);

-- 4) Helpers for role and school
create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select coalesce(up.role, 'consulta')
  from public.users_profiles up
  where up.id = auth.uid()
  limit 1;
$$;

create or replace function public.current_user_school()
returns text
language sql
stable
as $$
  select up.school
  from public.users_profiles up
  where up.id = auth.uid()
  limit 1;
$$;

create or replace function public.has_any_role(roles text[])
returns boolean
language sql
stable
as $$
  select public.current_user_role() = any(roles);
$$;

create or replace function public.can_manage_school_data()
returns boolean
language sql
stable
as $$
  select public.has_any_role(array['admin','direccion','secretaria']);
$$;

create or replace function public.can_read_school_data()
returns boolean
language sql
stable
as $$
  select public.has_any_role(array['admin','direccion','secretaria','docente','consulta']);
$$;

create or replace function public.write_audit_log(
  p_action text,
  p_entity text,
  p_entity_id text,
  p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (actor_id, actor_role, school, action, entity, entity_id, details)
  values (
    auth.uid(),
    public.current_user_role(),
    public.current_user_school(),
    p_action,
    p_entity,
    p_entity_id,
    coalesce(p_details, '{}'::jsonb)
  );
end;
$$;

grant execute on function public.write_audit_log(text, text, text, jsonb) to authenticated;

-- 5) Transactional RPC for students and personal
create or replace function public.create_student_full(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student jsonb := p_payload;
  v_dir jsonb := coalesce(p_payload->'direccion', '{}'::jsonb);
  v_guard jsonb := coalesce(p_payload->'apoderado', '{}'::jsonb);
  v_nombres text := btrim(coalesce(v_student->>'nombres',''));
  v_apellidos text := btrim(coalesce(v_student->>'apellidos',''));
  v_dni text := btrim(coalesce(v_student->>'dni',''));
  v_sexo text := btrim(coalesce(v_student->>'sexo',''));
  v_fecha_nac date;
  v_direccion_id bigint;
  v_apoderado_id bigint;
  v_aula_id bigint;
  v_student_id bigint;
begin
  if not public.can_manage_school_data() then
    raise exception 'No autorizado';
  end if;

  if v_nombres = '' or v_apellidos = '' or v_dni = '' or v_sexo = '' then
    raise exception 'Campos obligatorios: nombres, apellidos, dni, sexo';
  end if;

  if v_dni !~ '^\d{8}$' then
    raise exception 'DNI inválido';
  end if;

  if coalesce(v_student->>'fecha_nacimiento','') <> '' then
    v_fecha_nac := (v_student->>'fecha_nacimiento')::date;
    if v_fecha_nac > current_date then
      raise exception 'Fecha de nacimiento no puede ser futura';
    end if;
  end if;

  if coalesce(v_dir->>'departamento','') <> ''
    or coalesce(v_dir->>'provincia','') <> ''
    or coalesce(v_dir->>'distrito','') <> ''
    or coalesce(v_dir->>'domicilio','') <> '' then
    insert into public.direcciones(departamento, provincia, distrito, domicilio)
    values (
      nullif(btrim(v_dir->>'departamento'), ''),
      nullif(btrim(v_dir->>'provincia'), ''),
      nullif(btrim(v_dir->>'distrito'), ''),
      nullif(btrim(v_dir->>'domicilio'), '')
    )
    returning id into v_direccion_id;
  end if;

  if coalesce(v_guard->>'nombres','') <> '' or coalesce(v_guard->>'apellidos','') <> '' then
    if coalesce(v_guard->>'dni','') <> '' and (v_guard->>'dni') !~ '^\d{8}$' then
      raise exception 'DNI del apoderado inválido';
    end if;

    insert into public.apoderados(nombres, apellidos, dni, fecha_nacimiento, celular)
    values (
      nullif(btrim(v_guard->>'nombres'), ''),
      nullif(btrim(v_guard->>'apellidos'), ''),
      nullif(btrim(v_guard->>'dni'), ''),
      nullif(v_guard->>'fecha_nacimiento', '')::date,
      nullif(btrim(v_guard->>'celular'), '')
    )
    returning id into v_apoderado_id;
  end if;

  if coalesce(v_student->>'aula_id','') <> '' then
    v_aula_id := (v_student->>'aula_id')::bigint;
  elsif coalesce(v_student->>'grado','') <> '' and coalesce(v_student->>'seccion','') <> '' then
    select id into v_aula_id
    from public.aulas
    where grado = (v_student->>'grado')
      and seccion = (v_student->>'seccion')
    limit 1;

    if v_aula_id is null then
      raise exception 'Combinación de grado y sección no válida';
    end if;
  end if;

  insert into public.estudiantes(
    nombres,
    apellidos,
    dni,
    fecha_nacimiento,
    sexo,
    discapacidad,
    aula_id,
    apoderado_id,
    direccion_id,
    created_by,
    updated_by,
    deleted_at
  ) values (
    v_nombres,
    v_apellidos,
    v_dni,
    v_fecha_nac,
    v_sexo,
    nullif(btrim(v_student->>'discapacidad'), ''),
    v_aula_id,
    v_apoderado_id,
    v_direccion_id,
    auth.uid(),
    auth.uid(),
    null
  )
  returning id into v_student_id;

  perform public.write_audit_log(
    'create',
    'estudiantes',
    v_student_id::text,
    jsonb_build_object('dni', v_dni)
  );

  return jsonb_build_object('student_id', v_student_id);
end;
$$;

grant execute on function public.create_student_full(jsonb) to authenticated;

create or replace function public.soft_delete_student(p_student_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exists bigint;
begin
  if not public.can_manage_school_data() then
    raise exception 'No autorizado';
  end if;

  select id into v_exists
  from public.estudiantes
  where id = p_student_id
    and deleted_at is null;

  if v_exists is null then
    raise exception 'Estudiante no encontrado';
  end if;

  update public.estudiantes
  set deleted_at = timezone('utc', now()),
      deleted_by = auth.uid(),
      updated_by = auth.uid()
  where id = p_student_id;

  perform public.write_audit_log('soft_delete', 'estudiantes', p_student_id::text, '{}'::jsonb);

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.soft_delete_student(bigint) to authenticated;

create or replace function public.create_personal_full(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dni text := btrim(coalesce(p_payload->>'dni',''));
  v_nombres text := btrim(coalesce(p_payload->>'nombres',''));
  v_apellidos text := btrim(coalesce(p_payload->>'apellidos',''));
  v_codigo_modular text := btrim(coalesce(p_payload->>'codigo_modular',''));
  v_fecha_nac date;
  v_personal_dni text;
  v_plaza jsonb := coalesce(p_payload->'plaza', '{}'::jsonb);
begin
  if not public.can_manage_school_data() then
    raise exception 'No autorizado';
  end if;

  if v_dni = '' or v_nombres = '' or v_apellidos = '' or v_codigo_modular = '' then
    raise exception 'Campos obligatorios: nombres, apellidos, dni, codigo_modular';
  end if;

  if v_dni !~ '^\d{8}$' then
    raise exception 'DNI inválido';
  end if;

  if v_codigo_modular !~ '^[A-Za-z0-9-]{4,20}$' then
    raise exception 'Código modular inválido';
  end if;

  if coalesce(p_payload->>'fecha_nacimiento','') <> '' then
    v_fecha_nac := (p_payload->>'fecha_nacimiento')::date;
    if v_fecha_nac > current_date then
      raise exception 'Fecha de nacimiento no puede ser futura';
    end if;
  end if;

  insert into public.tbl_personal(
    dni,
    nombres,
    apellidos,
    fecha_nacimiento,
    numero_celular,
    codigo_modular,
    sistema_pensiones_id,
    fecha_inicio_ejercicio_general,
    created_by,
    updated_by,
    deleted_at
  ) values (
    v_dni,
    v_nombres,
    v_apellidos,
    v_fecha_nac,
    nullif(btrim(p_payload->>'numero_celular'), ''),
    v_codigo_modular,
    nullif(p_payload->>'sistema_pensiones_id','')::int,
    nullif(p_payload->>'fecha_inicio_ejercicio_general','')::date,
    auth.uid(),
    auth.uid(),
    null
  ) returning dni into v_personal_dni;

  if coalesce(v_plaza->>'codigo_plaza','') <> '' or coalesce(v_plaza->>'cargo_id','') <> '' then
    insert into public.tbl_plazas(
      codigo_plaza,
      dni_personal_asignado,
      cargo_id,
      especialidad_id,
      nivel_educativo_id,
      escala_magisterial_id,
      condicion_id,
      resolucion_nombramiento,
      fecha_nombramiento_carrera,
      fecha_ingreso_institucion,
      jornada_laboral,
      remuneracion_bruta
    ) values (
      coalesce(nullif(v_plaza->>'codigo_plaza',''), concat('PLAZA-', extract(epoch from now())::bigint::text)),
      v_personal_dni,
      nullif(v_plaza->>'cargo_id','')::int,
      nullif(v_plaza->>'especialidad_id','')::int,
      nullif(v_plaza->>'nivel_educativo_id','')::int,
      nullif(v_plaza->>'escala_magisterial_id','')::int,
      nullif(v_plaza->>'condicion_id','')::int,
      nullif(v_plaza->>'resolucion_nombramiento',''),
      nullif(v_plaza->>'fecha_nombramiento_carrera','')::date,
      nullif(v_plaza->>'fecha_ingreso_institucion','')::date,
      nullif(v_plaza->>'jornada_laboral','')::int,
      nullif(v_plaza->>'remuneracion_bruta','')::numeric
    );
  end if;

  perform public.write_audit_log('create', 'tbl_personal', v_personal_dni, jsonb_build_object('dni', v_personal_dni));

  return jsonb_build_object('dni', v_personal_dni);
end;
$$;

grant execute on function public.create_personal_full(jsonb) to authenticated;

create or replace function public.soft_delete_personal(p_dni text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dni text := btrim(coalesce(p_dni,''));
begin
  if not public.can_manage_school_data() then
    raise exception 'No autorizado';
  end if;

  update public.tbl_plazas
  set dni_personal_asignado = null
  where dni_personal_asignado = v_dni;

  update public.tbl_personal
  set deleted_at = timezone('utc', now()),
      deleted_by = auth.uid(),
      updated_by = auth.uid()
  where dni = v_dni
    and deleted_at is null;

  if not found then
    raise exception 'Personal no encontrado';
  end if;

  perform public.write_audit_log('soft_delete', 'tbl_personal', v_dni, '{}'::jsonb);

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.soft_delete_personal(text) to authenticated;

-- 6) Enable/adjust RLS baseline
alter table if exists public.users_profiles enable row level security;
alter table if exists public.estudiantes enable row level security;
alter table if exists public.tbl_personal enable row level security;
alter table if exists public.audit_log enable row level security;

drop policy if exists users_profiles_select_self_or_admin on public.users_profiles;
create policy users_profiles_select_self_or_admin
on public.users_profiles
for select
to authenticated
using (
  id = auth.uid() or public.has_any_role(array['admin','direccion'])
);

drop policy if exists users_profiles_update_self_or_admin on public.users_profiles;
create policy users_profiles_update_self_or_admin
on public.users_profiles
for update
to authenticated
using (
  id = auth.uid() or public.has_any_role(array['admin'])
)
with check (
  id = auth.uid() or public.has_any_role(array['admin'])
);

drop policy if exists estudiantes_read_non_deleted on public.estudiantes;
create policy estudiantes_read_non_deleted
on public.estudiantes
for select
to authenticated
using (
  deleted_at is null
  and public.can_read_school_data()
);

drop policy if exists estudiantes_manage_non_deleted on public.estudiantes;
create policy estudiantes_manage_non_deleted
on public.estudiantes
for all
to authenticated
using (
  public.can_manage_school_data()
)
with check (
  public.can_manage_school_data()
);

drop policy if exists personal_read_non_deleted on public.tbl_personal;
create policy personal_read_non_deleted
on public.tbl_personal
for select
to authenticated
using (
  deleted_at is null
  and public.can_read_school_data()
);

drop policy if exists personal_manage_non_deleted on public.tbl_personal;
create policy personal_manage_non_deleted
on public.tbl_personal
for all
to authenticated
using (
  public.can_manage_school_data()
)
with check (
  public.can_manage_school_data()
);

drop policy if exists audit_log_read_restricted on public.audit_log;
create policy audit_log_read_restricted
on public.audit_log
for select
to authenticated
using (
  public.has_any_role(array['admin','direccion'])
);
