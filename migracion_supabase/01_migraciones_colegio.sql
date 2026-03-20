-- Export de migraciones historicas (sin datos)
-- Origen: supabase_migrations.schema_migrations
-- Proyecto: colegio

-- ============================================================================
-- 20251020182331_create_niveles_table
-- ============================================================================
CREATE TABLE public.niveles (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL
);

-- ============================================================================
-- 20251020182422_create_apoderados_table
-- ============================================================================
CREATE TABLE public.apoderados (
  id BIGSERIAL PRIMARY KEY,
  apellidos TEXT,
  nombres TEXT,
  dni TEXT,
  fecha_nacimiento DATE,
  celular TEXT
);

-- ============================================================================
-- 20251020182507_create_direcciones_table_retry
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.direcciones (
  id BIGSERIAL PRIMARY KEY,
  departamento TEXT,
  provincia TEXT,
  distrito TEXT,
  domicilio TEXT
);

-- ============================================================================
-- 20251020182515_create_aulas_table_retry
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.aulas (
  id BIGSERIAL PRIMARY KEY,
  grado TEXT NOT NULL,
  seccion TEXT NOT NULL,
  anio INTEGER NOT NULL,
  nivel_id BIGINT REFERENCES public.niveles(id)
);

-- ============================================================================
-- 20251020182539_create_estudiantes_final
-- ============================================================================
CREATE TABLE public.estudiantes (
  id BIGSERIAL PRIMARY KEY,
  apellidos TEXT,
  nombres TEXT,
  dni TEXT,
  fecha_nacimiento DATE,
  sexo TEXT,
  discapacidad TEXT,
  apoderado_id BIGINT REFERENCES public.apoderados(id),
  aula_id BIGINT REFERENCES public.aulas(id),
  direccion_id BIGINT REFERENCES public.direcciones(id)
);

-- ============================================================================
-- 20251020213540_enable_public_read_access_rls
-- ============================================================================
CREATE POLICY "Allow public read access" ON estudiantes FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON aulas FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON apoderados FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON direcciones FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON niveles FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON estudiantes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON estudiantes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON estudiantes FOR DELETE USING (true);

CREATE POLICY "Allow public insert" ON apoderados FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON apoderados FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON apoderados FOR DELETE USING (true);

CREATE POLICY "Allow public insert" ON direcciones FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON direcciones FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON direcciones FOR DELETE USING (true);

-- ============================================================================
-- 20251021131534_create_users_profiles_table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'profesor',
  school VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_profiles_email_idx ON public.users_profiles(email);

ALTER TABLE public.users_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.users_profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles"
ON public.users_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can update their own profile"
ON public.users_profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND role = (
    SELECT role FROM public.users_profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Admin can update any profile"
ON public.users_profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can insert their own profile"
ON public.users_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can delete profiles"
ON public.users_profiles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'profesor')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- 20251021131605_update_estudiantes_rls_auth_aware
-- ============================================================================
DROP POLICY IF EXISTS "Allow public read access" ON public.estudiantes;
DROP POLICY IF EXISTS "Allow public insert/update/delete" ON public.estudiantes;

CREATE POLICY "Admins can view all students"
ON public.estudiantes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Teachers can view all students"
ON public.estudiantes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users_profiles prof
    WHERE prof.id = auth.uid() AND prof.role = 'profesor'
  )
);

CREATE POLICY "Guardians can view their children"
ON public.estudiantes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE id = auth.uid() AND role = 'apoderado'
  )
);

CREATE POLICY "Admins can insert students"
ON public.estudiantes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update students"
ON public.estudiantes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete students"
ON public.estudiantes FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- 20251021131616_update_related_tables_rls
-- ============================================================================
DROP POLICY IF EXISTS "Allow public read access" ON public.aulas;
DROP POLICY IF EXISTS "Allow public insert/update/delete" ON public.aulas;

CREATE POLICY "Authenticated users can view aulas"
ON public.aulas FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert aulas"
ON public.aulas FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update aulas"
ON public.aulas FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete aulas"
ON public.aulas FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Allow public read access" ON public.apoderados;
DROP POLICY IF EXISTS "Allow public insert/update/delete" ON public.apoderados;

CREATE POLICY "Authenticated users can view apoderados"
ON public.apoderados FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert apoderados"
ON public.apoderados FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update apoderados"
ON public.apoderados FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete apoderados"
ON public.apoderados FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Allow public read access" ON public.direcciones;
DROP POLICY IF EXISTS "Allow public insert/update/delete" ON public.direcciones;

CREATE POLICY "Authenticated users can view direcciones"
ON public.direcciones FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert direcciones"
ON public.direcciones FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update direcciones"
ON public.direcciones FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete direcciones"
ON public.direcciones FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Allow public read access" ON public.niveles;
DROP POLICY IF EXISTS "Allow public insert/update/delete" ON public.niveles;

CREATE POLICY "Authenticated users can view niveles"
ON public.niveles FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert niveles"
ON public.niveles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update niveles"
ON public.niveles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete niveles"
ON public.niveles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- 20251021133021_fix_users_profiles_rls_recursion
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users_profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.users_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users_profiles;
DROP POLICY IF EXISTS "Admin can update any profile" ON public.users_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users_profiles;
DROP POLICY IF EXISTS "Admin can delete profiles" ON public.users_profiles;

CREATE POLICY "Anyone can view profiles"
ON public.users_profiles FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.users_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.users_profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Only admins can delete profiles"
ON public.users_profiles FOR DELETE
USING (
  (SELECT role FROM public.users_profiles WHERE id = auth.uid()) = 'admin'
);

-- ============================================================================
-- 20251021133531_disable_email_confirmation_for_auth
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW(),
      confirmed_at = NOW()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_confirm_email_trigger ON auth.users;
CREATE TRIGGER auto_confirm_email_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.auto_confirm_email();

-- ============================================================================
-- 20251021133706_fix_auth_triggers_conflict
-- ============================================================================
DROP TRIGGER IF EXISTS auto_confirm_email_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP FUNCTION IF EXISTS public.auto_confirm_email();
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'profesor')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- 20251112032619_enable_rls_policies
-- ============================================================================
ALTER TABLE tbl_personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_plazas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_especialidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_condiciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_niveleseducativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_escalasmagisteriales ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_sistemaspensiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leer especialidades" ON tbl_especialidades
  FOR SELECT
  USING (true);

CREATE POLICY "Admin gestiona especialidades" ON tbl_especialidades
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Leer cargos" ON tbl_cargos
  FOR SELECT
  USING (true);

CREATE POLICY "Admin gestiona cargos" ON tbl_cargos
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Leer condiciones" ON tbl_condiciones
  FOR SELECT
  USING (true);

CREATE POLICY "Admin gestiona condiciones" ON tbl_condiciones
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Leer niveles educativos" ON tbl_niveleseducativos
  FOR SELECT
  USING (true);

CREATE POLICY "Admin gestiona niveles educativos" ON tbl_niveleseducativos
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Leer escalas magisteriales" ON tbl_escalasmagisteriales
  FOR SELECT
  USING (true);

CREATE POLICY "Admin gestiona escalas magisteriales" ON tbl_escalasmagisteriales
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Leer sistemas pensiones" ON tbl_sistemaspensiones
  FOR SELECT
  USING (true);

CREATE POLICY "Admin gestiona sistemas pensiones" ON tbl_sistemaspensiones
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin ve personal" ON tbl_personal
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin gestiona personal" ON tbl_personal
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin edita personal" ON tbl_personal
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin elimina personal" ON tbl_personal
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin ve plazas" ON tbl_plazas
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin gestiona plazas" ON tbl_plazas
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin edita plazas" ON tbl_plazas
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin elimina plazas" ON tbl_plazas
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- 20251112151627_reset_escalas_magisteriales_sequence
-- ============================================================================
DELETE FROM tbl_escalasmagisteriales;
ALTER SEQUENCE tbl_escalasmagisteriales_id_seq RESTART WITH 1;
SELECT last_value, is_called FROM tbl_escalasmagisteriales_id_seq;

-- ============================================================================
-- 20251117133348_fix_rls_admin_role_assignment
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_user_admin_role()
RETURNS trigger AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'),
    '{role}',
    '"admin"'
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS set_user_admin_role_trigger ON public.users_profiles;
CREATE TRIGGER set_user_admin_role_trigger
AFTER INSERT ON public.users_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_user_admin_role();

UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'),
  '{role}',
  '"admin"'
)
WHERE raw_app_meta_data->'role' IS NULL;

SELECT id, email, raw_app_meta_data->'role' as role FROM auth.users;

-- ============================================================================
-- 20251117133442_create_jwt_role_claim_function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.users_profiles WHERE id = user_id LIMIT 1;
  RETURN COALESCE(user_role, 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TABLE IF NOT EXISTS public.role_change_audit (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  old_role text,
  new_role text,
  changed_at timestamp DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.audit_role_change()
RETURNS trigger AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.role_change_audit (user_id, old_role, new_role)
    VALUES (NEW.id, OLD.role, NEW.role);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS audit_role_change_trigger ON public.users_profiles;
CREATE TRIGGER audit_role_change_trigger
BEFORE UPDATE ON public.users_profiles
FOR EACH ROW
EXECUTE FUNCTION public.audit_role_change();

-- ============================================================================
-- 20251117133601_cleanup_and_recreate_rls_policies
-- ============================================================================
ALTER TABLE public.tbl_personal DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin ve personal" ON public.tbl_personal;
DROP POLICY IF EXISTS "Admin gestiona personal" ON public.tbl_personal;
DROP POLICY IF EXISTS "Admin edita personal" ON public.tbl_personal;
DROP POLICY IF EXISTS "Admin elimina personal" ON public.tbl_personal;
DROP POLICY IF EXISTS "Usuarios autenticados leen personal" ON public.tbl_personal;
DROP POLICY IF EXISTS "Solo admin crea personal" ON public.tbl_personal;
DROP POLICY IF EXISTS "Solo admin modifica personal" ON public.tbl_personal;
DROP POLICY IF EXISTS "Solo admin elimina personal" ON public.tbl_personal;

ALTER TABLE public.tbl_personal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados leen personal"
ON public.tbl_personal FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Solo admin crea personal"
ON public.tbl_personal FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

CREATE POLICY "Solo admin modifica personal"
ON public.tbl_personal FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin')
WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

CREATE POLICY "Solo admin elimina personal"
ON public.tbl_personal FOR DELETE
TO authenticated
USING ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

ALTER TABLE public.tbl_plazas DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin ve plazas" ON public.tbl_plazas;
DROP POLICY IF EXISTS "Admin gestiona plazas" ON public.tbl_plazas;
DROP POLICY IF EXISTS "Admin edita plazas" ON public.tbl_plazas;
DROP POLICY IF EXISTS "Admin elimina plazas" ON public.tbl_plazas;
DROP POLICY IF EXISTS "Usuarios autenticados leen plazas" ON public.tbl_plazas;
DROP POLICY IF EXISTS "Solo admin crea plazas" ON public.tbl_plazas;
DROP POLICY IF EXISTS "Solo admin modifica plazas" ON public.tbl_plazas;
DROP POLICY IF EXISTS "Solo admin elimina plazas" ON public.tbl_plazas;

ALTER TABLE public.tbl_plazas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados leen plazas"
ON public.tbl_plazas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Solo admin crea plazas"
ON public.tbl_plazas FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

CREATE POLICY "Solo admin modifica plazas"
ON public.tbl_plazas FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin')
WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

CREATE POLICY "Solo admin elimina plazas"
ON public.tbl_plazas FOR DELETE
TO authenticated
USING ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

ALTER TABLE public.tbl_cargos DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin gestiona cargos" ON public.tbl_cargos;
DROP POLICY IF EXISTS "Leer cargos" ON public.tbl_cargos;
DROP POLICY IF EXISTS "Solo admin gestiona cargos" ON public.tbl_cargos;
DROP POLICY IF EXISTS "Solo admin actualiza cargos" ON public.tbl_cargos;

ALTER TABLE public.tbl_cargos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leer cargos"
ON public.tbl_cargos FOR SELECT
USING (true);

CREATE POLICY "Solo admin gestiona cargos"
ON public.tbl_cargos FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

CREATE POLICY "Solo admin actualiza cargos"
ON public.tbl_cargos FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin')
WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

ALTER TABLE public.tbl_especialidades DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin gestiona especialidades" ON public.tbl_especialidades;
DROP POLICY IF EXISTS "Leer especialidades" ON public.tbl_especialidades;
DROP POLICY IF EXISTS "Solo admin gestiona especialidades" ON public.tbl_especialidades;
DROP POLICY IF EXISTS "Solo admin actualiza especialidades" ON public.tbl_especialidades;

ALTER TABLE public.tbl_especialidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leer especialidades"
ON public.tbl_especialidades FOR SELECT
USING (true);

CREATE POLICY "Solo admin gestiona especialidades"
ON public.tbl_especialidades FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

CREATE POLICY "Solo admin actualiza especialidades"
ON public.tbl_especialidades FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin')
WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

ALTER TABLE public.tbl_niveleseducativos DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin gestiona niveles educativos" ON public.tbl_niveleseducativos;
DROP POLICY IF EXISTS "Leer niveles educativos" ON public.tbl_niveleseducativos;
DROP POLICY IF EXISTS "Solo admin gestiona niveles educativos" ON public.tbl_niveleseducativos;
DROP POLICY IF EXISTS "Solo admin actualiza niveles educativos" ON public.tbl_niveleseducativos;

ALTER TABLE public.tbl_niveleseducativos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leer niveles educativos"
ON public.tbl_niveleseducativos FOR SELECT
USING (true);

CREATE POLICY "Solo admin gestiona niveles educativos"
ON public.tbl_niveleseducativos FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

CREATE POLICY "Solo admin actualiza niveles educativos"
ON public.tbl_niveleseducativos FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin')
WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

ALTER TABLE public.tbl_sistemaspensiones DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leer sistemas de pensiones" ON public.tbl_sistemaspensiones;
DROP POLICY IF EXISTS "Solo admin gestiona sistemas de pensiones" ON public.tbl_sistemaspensiones;
DROP POLICY IF EXISTS "Solo admin actualiza sistemas de pensiones" ON public.tbl_sistemaspensiones;

ALTER TABLE public.tbl_sistemaspensiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leer sistemas de pensiones"
ON public.tbl_sistemaspensiones FOR SELECT
USING (true);

CREATE POLICY "Solo admin gestiona sistemas de pensiones"
ON public.tbl_sistemaspensiones FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

CREATE POLICY "Solo admin actualiza sistemas de pensiones"
ON public.tbl_sistemaspensiones FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin')
WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

ALTER TABLE public.tbl_escalasmagisteriales DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leer escalas magisteriales" ON public.tbl_escalasmagisteriales;
DROP POLICY IF EXISTS "Solo admin gestiona escalas magisteriales" ON public.tbl_escalasmagisteriales;
DROP POLICY IF EXISTS "Solo admin actualiza escalas magisteriales" ON public.tbl_escalasmagisteriales;

ALTER TABLE public.tbl_escalasmagisteriales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leer escalas magisteriales"
ON public.tbl_escalasmagisteriales FOR SELECT
USING (true);

CREATE POLICY "Solo admin gestiona escalas magisteriales"
ON public.tbl_escalasmagisteriales FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

CREATE POLICY "Solo admin actualiza escalas magisteriales"
ON public.tbl_escalasmagisteriales FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin')
WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

ALTER TABLE public.tbl_condiciones DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leer condiciones" ON public.tbl_condiciones;
DROP POLICY IF EXISTS "Solo admin gestiona condiciones" ON public.tbl_condiciones;
DROP POLICY IF EXISTS "Solo admin actualiza condiciones" ON public.tbl_condiciones;

ALTER TABLE public.tbl_condiciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leer condiciones"
ON public.tbl_condiciones FOR SELECT
USING (true);

CREATE POLICY "Solo admin gestiona condiciones"
ON public.tbl_condiciones FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

CREATE POLICY "Solo admin actualiza condiciones"
ON public.tbl_condiciones FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin')
WITH CHECK ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');

-- ============================================================================
-- 20251117134107_create_get_personal_with_relations_rpc
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_personal_with_relations(
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 24
)
RETURNS SETOF json AS $$
SELECT json_build_object(
  'dni', p.dni,
  'nombres', p.nombres,
  'apellidos', p.apellidos,
  'fecha_nacimiento', p.fecha_nacimiento,
  'numero_celular', p.numero_celular,
  'codigo_modular', p.codigo_modular,
  'sistema_pensiones_id', p.sistema_pensiones_id,
  'fecha_inicio_ejercicio_general', p.fecha_inicio_ejercicio_general,
  'sistema_pensiones', CASE
    WHEN sp.id IS NOT NULL THEN json_build_object('id', sp.id, 'nombre', sp.nombre)
    ELSE NULL
  END,
  'plaza', CASE
    WHEN pl.codigo_plaza IS NOT NULL THEN json_build_object(
      'codigo_plaza', pl.codigo_plaza,
      'remuneracion_bruta', pl.remuneracion_bruta,
      'jornada_laboral', pl.jornada_laboral,
      'resolucion_nombramiento', pl.resolucion_nombramiento,
      'fecha_nombramiento_carrera', pl.fecha_nombramiento_carrera,
      'fecha_ingreso_institucion', pl.fecha_ingreso_institucion,
      'nivel_educativo', CASE
        WHEN ne.id IS NOT NULL THEN json_build_object('id', ne.id, 'nombre', ne.nombre)
        ELSE NULL
      END,
      'cargo', CASE
        WHEN c.id IS NOT NULL THEN json_build_object('id', c.id, 'nombre', c.nombre)
        ELSE NULL
      END,
      'especialidad', CASE
        WHEN e.id IS NOT NULL THEN json_build_object('id', e.id, 'nombre', e.nombre)
        ELSE NULL
      END,
      'escala_magisterial', CASE
        WHEN em.id IS NOT NULL THEN json_build_object('id', em.id, 'nombre', em.nombre)
        ELSE NULL
      END,
      'condicion', CASE
        WHEN cond.id IS NOT NULL THEN json_build_object('id', cond.id, 'nombre', cond.nombre)
        ELSE NULL
      END
    )
    ELSE NULL
  END
)
FROM tbl_personal p
LEFT JOIN tbl_sistemaspensiones sp ON p.sistema_pensiones_id = sp.id
LEFT JOIN tbl_plazas pl ON p.dni = pl.dni_personal_asignado
LEFT JOIN tbl_niveleseducativos ne ON pl.nivel_educativo_id = ne.id
LEFT JOIN tbl_cargos c ON pl.cargo_id = c.id
LEFT JOIN tbl_especialidades e ON pl.especialidad_id = e.id
LEFT JOIN tbl_escalasmagisteriales em ON pl.escala_magisterial_id = em.id
LEFT JOIN tbl_condiciones cond ON pl.condicion_id = cond.id
ORDER BY p.apellidos ASC, p.nombres ASC
OFFSET p_offset
LIMIT p_limit
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

CREATE INDEX IF NOT EXISTS idx_tbl_plazas_dni_personal_asignado
ON tbl_plazas(dni_personal_asignado);

CREATE INDEX IF NOT EXISTS idx_tbl_personal_apellidos_nombres
ON tbl_personal(apellidos, nombres);

CREATE INDEX IF NOT EXISTS idx_tbl_plazas_cargo_id
ON tbl_plazas(cargo_id);

CREATE INDEX IF NOT EXISTS idx_tbl_plazas_especialidad_id
ON tbl_plazas(especialidad_id);

-- ============================================================================
-- 20251117135042_update_rpc_sort_by_cargo_hierarchy
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_personal_with_relations(
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 24
)
RETURNS SETOF json AS $$
SELECT json_build_object(
  'dni', p.dni,
  'nombres', p.nombres,
  'apellidos', p.apellidos,
  'fecha_nacimiento', p.fecha_nacimiento,
  'numero_celular', p.numero_celular,
  'codigo_modular', p.codigo_modular,
  'sistema_pensiones_id', p.sistema_pensiones_id,
  'fecha_inicio_ejercicio_general', p.fecha_inicio_ejercicio_general,
  'sistema_pensiones', CASE
    WHEN sp.id IS NOT NULL THEN json_build_object('id', sp.id, 'nombre', sp.nombre)
    ELSE NULL
  END,
  'plaza', CASE
    WHEN pl.codigo_plaza IS NOT NULL THEN json_build_object(
      'codigo_plaza', pl.codigo_plaza,
      'remuneracion_bruta', pl.remuneracion_bruta,
      'jornada_laboral', pl.jornada_laboral,
      'resolucion_nombramiento', pl.resolucion_nombramiento,
      'fecha_nombramiento_carrera', pl.fecha_nombramiento_carrera,
      'fecha_ingreso_institucion', pl.fecha_ingreso_institucion,
      'nivel_educativo', CASE
        WHEN ne.id IS NOT NULL THEN json_build_object('id', ne.id, 'nombre', ne.nombre)
        ELSE NULL
      END,
      'cargo', CASE
        WHEN c.id IS NOT NULL THEN json_build_object('id', c.id, 'nombre', c.nombre)
        ELSE NULL
      END,
      'especialidad', CASE
        WHEN e.id IS NOT NULL THEN json_build_object('id', e.id, 'nombre', e.nombre)
        ELSE NULL
      END,
      'escala_magisterial', CASE
        WHEN em.id IS NOT NULL THEN json_build_object('id', em.id, 'nombre', em.nombre)
        ELSE NULL
      END,
      'condicion', CASE
        WHEN cond.id IS NOT NULL THEN json_build_object('id', cond.id, 'nombre', cond.nombre)
        ELSE NULL
      END
    )
    ELSE NULL
  END
)
FROM tbl_personal p
LEFT JOIN tbl_sistemaspensiones sp ON p.sistema_pensiones_id = sp.id
LEFT JOIN tbl_plazas pl ON p.dni = pl.dni_personal_asignado
LEFT JOIN tbl_niveleseducativos ne ON pl.nivel_educativo_id = ne.id
LEFT JOIN tbl_cargos c ON pl.cargo_id = c.id
LEFT JOIN tbl_especialidades e ON pl.especialidad_id = e.id
LEFT JOIN tbl_escalasmagisteriales em ON pl.escala_magisterial_id = em.id
LEFT JOIN tbl_condiciones cond ON pl.condicion_id = cond.id
ORDER BY
  COALESCE(c.id, 999) ASC,
  p.apellidos ASC,
  p.nombres ASC
OFFSET p_offset
LIMIT p_limit
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

SELECT 'Funcion actualizada correctamente' as resultado;

-- ============================================================================
-- 20251117135338_create_search_personal_rpc
-- ============================================================================
CREATE OR REPLACE FUNCTION public.search_personal_with_filters(
  p_search text DEFAULT '',
  p_cargo_id integer DEFAULT NULL,
  p_especialidad_id integer DEFAULT NULL,
  p_nivel_id integer DEFAULT NULL,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 24
)
RETURNS SETOF json AS $$
SELECT json_build_object(
  'dni', p.dni,
  'nombres', p.nombres,
  'apellidos', p.apellidos,
  'fecha_nacimiento', p.fecha_nacimiento,
  'numero_celular', p.numero_celular,
  'codigo_modular', p.codigo_modular,
  'sistema_pensiones_id', p.sistema_pensiones_id,
  'fecha_inicio_ejercicio_general', p.fecha_inicio_ejercicio_general,
  'sistema_pensiones', CASE
    WHEN sp.id IS NOT NULL THEN json_build_object('id', sp.id, 'nombre', sp.nombre)
    ELSE NULL
  END,
  'plaza', CASE
    WHEN pl.codigo_plaza IS NOT NULL THEN json_build_object(
      'codigo_plaza', pl.codigo_plaza,
      'remuneracion_bruta', pl.remuneracion_bruta,
      'jornada_laboral', pl.jornada_laboral,
      'resolucion_nombramiento', pl.resolucion_nombramiento,
      'fecha_nombramiento_carrera', pl.fecha_nombramiento_carrera,
      'fecha_ingreso_institucion', pl.fecha_ingreso_institucion,
      'nivel_educativo', CASE
        WHEN ne.id IS NOT NULL THEN json_build_object('id', ne.id, 'nombre', ne.nombre)
        ELSE NULL
      END,
      'cargo', CASE
        WHEN c.id IS NOT NULL THEN json_build_object('id', c.id, 'nombre', c.nombre)
        ELSE NULL
      END,
      'especialidad', CASE
        WHEN e.id IS NOT NULL THEN json_build_object('id', e.id, 'nombre', e.nombre)
        ELSE NULL
      END,
      'escala_magisterial', CASE
        WHEN em.id IS NOT NULL THEN json_build_object('id', em.id, 'nombre', em.nombre)
        ELSE NULL
      END,
      'condicion', CASE
        WHEN cond.id IS NOT NULL THEN json_build_object('id', cond.id, 'nombre', cond.nombre)
        ELSE NULL
      END
    )
    ELSE NULL
  END
)
FROM tbl_personal p
LEFT JOIN tbl_sistemaspensiones sp ON p.sistema_pensiones_id = sp.id
LEFT JOIN tbl_plazas pl ON p.dni = pl.dni_personal_asignado
LEFT JOIN tbl_niveleseducativos ne ON pl.nivel_educativo_id = ne.id
LEFT JOIN tbl_cargos c ON pl.cargo_id = c.id
LEFT JOIN tbl_especialidades e ON pl.especialidad_id = e.id
LEFT JOIN tbl_escalasmagisteriales em ON pl.escala_magisterial_id = em.id
LEFT JOIN tbl_condiciones cond ON pl.condicion_id = cond.id
WHERE
  (p_search = ''
   OR p.nombres ILIKE '%' || p_search || '%'
   OR p.apellidos ILIKE '%' || p_search || '%'
   OR p.dni ILIKE '%' || p_search || '%'
   OR p.codigo_modular ILIKE '%' || p_search || '%')
  AND (p_cargo_id IS NULL OR c.id = p_cargo_id)
  AND (p_especialidad_id IS NULL OR e.id = p_especialidad_id)
  AND (p_nivel_id IS NULL OR ne.id = p_nivel_id)
ORDER BY
  COALESCE(c.id, 999) ASC,
  p.apellidos ASC,
  p.nombres ASC
OFFSET p_offset
LIMIT p_limit
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

SELECT 'Funcion de busqueda creada correctamente' as resultado;

-- ============================================================================
-- 20251117141005_drop_role_change_audit_table
-- ============================================================================
DROP TABLE IF EXISTS role_change_audit;

-- ============================================================================
-- 20251118200432_update_rpc_sort_by_cargo_nivel_especialidad
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_personal_with_relations(p_offset integer DEFAULT 0, p_limit integer DEFAULT 24)
 RETURNS SETOF json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
SELECT json_build_object(
  'dni', p.dni,
  'nombres', p.nombres,
  'apellidos', p.apellidos,
  'fecha_nacimiento', p.fecha_nacimiento,
  'numero_celular', p.numero_celular,
  'codigo_modular', p.codigo_modular,
  'sistema_pensiones_id', p.sistema_pensiones_id,
  'fecha_inicio_ejercicio_general', p.fecha_inicio_ejercicio_general,
  'sistema_pensiones', CASE
    WHEN sp.id IS NOT NULL THEN json_build_object('id', sp.id, 'nombre', sp.nombre)
    ELSE NULL
  END,
  'plaza', CASE
    WHEN pl.codigo_plaza IS NOT NULL THEN json_build_object(
      'codigo_plaza', pl.codigo_plaza,
      'remuneracion_bruta', pl.remuneracion_bruta,
      'jornada_laboral', pl.jornada_laboral,
      'resolucion_nombramiento', pl.resolucion_nombramiento,
      'fecha_nombramiento_carrera', pl.fecha_nombramiento_carrera,
      'fecha_ingreso_institucion', pl.fecha_ingreso_institucion,
      'nivel_educativo', CASE
        WHEN ne.id IS NOT NULL THEN json_build_object('id', ne.id, 'nombre', ne.nombre)
        ELSE NULL
      END,
      'cargo', CASE
        WHEN c.id IS NOT NULL THEN json_build_object('id', c.id, 'nombre', c.nombre)
        ELSE NULL
      END,
      'especialidad', CASE
        WHEN e.id IS NOT NULL THEN json_build_object('id', e.id, 'nombre', e.nombre)
        ELSE NULL
      END,
      'escala_magisterial', CASE
        WHEN em.id IS NOT NULL THEN json_build_object('id', em.id, 'nombre', em.nombre)
        ELSE NULL
      END,
      'condicion', CASE
        WHEN cond.id IS NOT NULL THEN json_build_object('id', cond.id, 'nombre', cond.nombre)
        ELSE NULL
      END
    )
    ELSE NULL
  END
)
FROM tbl_personal p
LEFT JOIN tbl_sistemaspensiones sp ON p.sistema_pensiones_id = sp.id
LEFT JOIN tbl_plazas pl ON p.dni = pl.dni_personal_asignado
LEFT JOIN tbl_niveleseducativos ne ON pl.nivel_educativo_id = ne.id
LEFT JOIN tbl_cargos c ON pl.cargo_id = c.id
LEFT JOIN tbl_especialidades e ON pl.especialidad_id = e.id
LEFT JOIN tbl_escalasmagisteriales em ON pl.escala_magisterial_id = em.id
LEFT JOIN tbl_condiciones cond ON pl.condicion_id = cond.id
ORDER BY
  COALESCE(c.id, 999) ASC,
  CASE WHEN ne.id = 3 THEN 1
       WHEN ne.id = 2 THEN 2
       WHEN ne.id = 1 THEN 3
       ELSE 999 END ASC,
  CASE WHEN e.nombre = 'Profesor de Aula' THEN 999
       ELSE COALESCE(e.id, 0) END ASC,
  p.apellidos ASC,
  p.nombres ASC
OFFSET p_offset
LIMIT p_limit
$function$;

-- ============================================================================
-- 20251118200504_update_search_personal_sort_order
-- ============================================================================
CREATE OR REPLACE FUNCTION public.search_personal_with_filters(p_search text DEFAULT ''::text, p_cargo_id integer DEFAULT NULL::integer, p_especialidad_id integer DEFAULT NULL::integer, p_nivel_id integer DEFAULT NULL::integer, p_offset integer DEFAULT 0, p_limit integer DEFAULT 24)
 RETURNS SETOF json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
SELECT json_build_object(
  'dni', p.dni,
  'nombres', p.nombres,
  'apellidos', p.apellidos,
  'fecha_nacimiento', p.fecha_nacimiento,
  'numero_celular', p.numero_celular,
  'codigo_modular', p.codigo_modular,
  'sistema_pensiones_id', p.sistema_pensiones_id,
  'fecha_inicio_ejercicio_general', p.fecha_inicio_ejercicio_general,
  'sistema_pensiones', CASE
    WHEN sp.id IS NOT NULL THEN json_build_object('id', sp.id, 'nombre', sp.nombre)
    ELSE NULL
  END,
  'plaza', CASE
    WHEN pl.codigo_plaza IS NOT NULL THEN json_build_object(
      'codigo_plaza', pl.codigo_plaza,
      'remuneracion_bruta', pl.remuneracion_bruta,
      'jornada_laboral', pl.jornada_laboral,
      'resolucion_nombramiento', pl.resolucion_nombramiento,
      'fecha_nombramiento_carrera', pl.fecha_nombramiento_carrera,
      'fecha_ingreso_institucion', pl.fecha_ingreso_institucion,
      'nivel_educativo', CASE
        WHEN ne.id IS NOT NULL THEN json_build_object('id', ne.id, 'nombre', ne.nombre)
        ELSE NULL
      END,
      'cargo', CASE
        WHEN c.id IS NOT NULL THEN json_build_object('id', c.id, 'nombre', c.nombre)
        ELSE NULL
      END,
      'especialidad', CASE
        WHEN e.id IS NOT NULL THEN json_build_object('id', e.id, 'nombre', e.nombre)
        ELSE NULL
      END,
      'escala_magisterial', CASE
        WHEN em.id IS NOT NULL THEN json_build_object('id', em.id, 'nombre', em.nombre)
        ELSE NULL
      END,
      'condicion', CASE
        WHEN cond.id IS NOT NULL THEN json_build_object('id', cond.id, 'nombre', cond.nombre)
        ELSE NULL
      END
    )
    ELSE NULL
  END
)
FROM tbl_personal p
LEFT JOIN tbl_sistemaspensiones sp ON p.sistema_pensiones_id = sp.id
LEFT JOIN tbl_plazas pl ON p.dni = pl.dni_personal_asignado
LEFT JOIN tbl_niveleseducativos ne ON pl.nivel_educativo_id = ne.id
LEFT JOIN tbl_cargos c ON pl.cargo_id = c.id
LEFT JOIN tbl_especialidades e ON pl.especialidad_id = e.id
LEFT JOIN tbl_escalasmagisteriales em ON pl.escala_magisterial_id = em.id
LEFT JOIN tbl_condiciones cond ON pl.condicion_id = cond.id
WHERE
  (p_search = ''
   OR p.nombres ILIKE '%' || p_search || '%'
   OR p.apellidos ILIKE '%' || p_search || '%'
   OR p.dni ILIKE '%' || p_search || '%'
   OR p.codigo_modular ILIKE '%' || p_search || '%')
  AND (p_cargo_id IS NULL OR c.id = p_cargo_id)
  AND (p_especialidad_id IS NULL OR e.id = p_especialidad_id)
  AND (p_nivel_id IS NULL OR ne.id = p_nivel_id)
ORDER BY
  COALESCE(c.id, 999) ASC,
  CASE WHEN ne.id = 3 THEN 1
       WHEN ne.id = 2 THEN 2
       WHEN ne.id = 1 THEN 3
       ELSE 999 END ASC,
  CASE WHEN e.nombre = 'Profesor de Aula' THEN 999
       ELSE COALESCE(e.id, 0) END ASC,
  p.apellidos ASC,
  p.nombres ASC
OFFSET p_offset
LIMIT p_limit
$function$;

-- ============================================================================
-- 20251118202122_update_rpc_sort_nivel_cargo_apellido
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_personal_with_relations(p_offset integer DEFAULT 0, p_limit integer DEFAULT 24)
 RETURNS SETOF json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
SELECT json_build_object(
  'dni', p.dni,
  'nombres', p.nombres,
  'apellidos', p.apellidos,
  'fecha_nacimiento', p.fecha_nacimiento,
  'numero_celular', p.numero_celular,
  'codigo_modular', p.codigo_modular,
  'sistema_pensiones_id', p.sistema_pensiones_id,
  'fecha_inicio_ejercicio_general', p.fecha_inicio_ejercicio_general,
  'sistema_pensiones', CASE
    WHEN sp.id IS NOT NULL THEN json_build_object('id', sp.id, 'nombre', sp.nombre)
    ELSE NULL
  END,
  'plaza', CASE
    WHEN pl.codigo_plaza IS NOT NULL THEN json_build_object(
      'codigo_plaza', pl.codigo_plaza,
      'remuneracion_bruta', pl.remuneracion_bruta,
      'jornada_laboral', pl.jornada_laboral,
      'resolucion_nombramiento', pl.resolucion_nombramiento,
      'fecha_nombramiento_carrera', pl.fecha_nombramiento_carrera,
      'fecha_ingreso_institucion', pl.fecha_ingreso_institucion,
      'nivel_educativo', CASE
        WHEN ne.id IS NOT NULL THEN json_build_object('id', ne.id, 'nombre', ne.nombre)
        ELSE NULL
      END,
      'cargo', CASE
        WHEN c.id IS NOT NULL THEN json_build_object('id', c.id, 'nombre', c.nombre)
        ELSE NULL
      END,
      'especialidad', CASE
        WHEN e.id IS NOT NULL THEN json_build_object('id', e.id, 'nombre', e.nombre)
        ELSE NULL
      END,
      'escala_magisterial', CASE
        WHEN em.id IS NOT NULL THEN json_build_object('id', em.id, 'nombre', em.nombre)
        ELSE NULL
      END,
      'condicion', CASE
        WHEN cond.id IS NOT NULL THEN json_build_object('id', cond.id, 'nombre', cond.nombre)
        ELSE NULL
      END
    )
    ELSE NULL
  END
)
FROM tbl_personal p
LEFT JOIN tbl_sistemaspensiones sp ON p.sistema_pensiones_id = sp.id
LEFT JOIN tbl_plazas pl ON p.dni = pl.dni_personal_asignado
LEFT JOIN tbl_niveleseducativos ne ON pl.nivel_educativo_id = ne.id
LEFT JOIN tbl_cargos c ON pl.cargo_id = c.id
LEFT JOIN tbl_especialidades e ON pl.especialidad_id = e.id
LEFT JOIN tbl_escalasmagisteriales em ON pl.escala_magisterial_id = em.id
LEFT JOIN tbl_condiciones cond ON pl.condicion_id = cond.id
ORDER BY
  CASE WHEN ne.id = 3 THEN 1
       WHEN ne.id = 2 THEN 2
       WHEN ne.id = 1 THEN 3
       ELSE 999 END ASC,
  COALESCE(c.id, 999) ASC,
  p.apellidos ASC,
  p.nombres ASC
OFFSET p_offset
LIMIT p_limit
$function$;

-- ============================================================================
-- 20251118202145_update_search_sort_nivel_cargo_apellido
-- ============================================================================
CREATE OR REPLACE FUNCTION public.search_personal_with_filters(p_search text DEFAULT ''::text, p_cargo_id integer DEFAULT NULL::integer, p_especialidad_id integer DEFAULT NULL::integer, p_nivel_id integer DEFAULT NULL::integer, p_offset integer DEFAULT 0, p_limit integer DEFAULT 24)
 RETURNS SETOF json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
SELECT json_build_object(
  'dni', p.dni,
  'nombres', p.nombres,
  'apellidos', p.apellidos,
  'fecha_nacimiento', p.fecha_nacimiento,
  'numero_celular', p.numero_celular,
  'codigo_modular', p.codigo_modular,
  'sistema_pensiones_id', p.sistema_pensiones_id,
  'fecha_inicio_ejercicio_general', p.fecha_inicio_ejercicio_general,
  'sistema_pensiones', CASE
    WHEN sp.id IS NOT NULL THEN json_build_object('id', sp.id, 'nombre', sp.nombre)
    ELSE NULL
  END,
  'plaza', CASE
    WHEN pl.codigo_plaza IS NOT NULL THEN json_build_object(
      'codigo_plaza', pl.codigo_plaza,
      'remuneracion_bruta', pl.remuneracion_bruta,
      'jornada_laboral', pl.jornada_laboral,
      'resolucion_nombramiento', pl.resolucion_nombramiento,
      'fecha_nombramiento_carrera', pl.fecha_nombramiento_carrera,
      'fecha_ingreso_institucion', pl.fecha_ingreso_institucion,
      'nivel_educativo', CASE
        WHEN ne.id IS NOT NULL THEN json_build_object('id', ne.id, 'nombre', ne.nombre)
        ELSE NULL
      END,
      'cargo', CASE
        WHEN c.id IS NOT NULL THEN json_build_object('id', c.id, 'nombre', c.nombre)
        ELSE NULL
      END,
      'especialidad', CASE
        WHEN e.id IS NOT NULL THEN json_build_object('id', e.id, 'nombre', e.nombre)
        ELSE NULL
      END,
      'escala_magisterial', CASE
        WHEN em.id IS NOT NULL THEN json_build_object('id', em.id, 'nombre', em.nombre)
        ELSE NULL
      END,
      'condicion', CASE
        WHEN cond.id IS NOT NULL THEN json_build_object('id', cond.id, 'nombre', cond.nombre)
        ELSE NULL
      END
    )
    ELSE NULL
  END
)
FROM tbl_personal p
LEFT JOIN tbl_sistemaspensiones sp ON p.sistema_pensiones_id = sp.id
LEFT JOIN tbl_plazas pl ON p.dni = pl.dni_personal_asignado
LEFT JOIN tbl_niveleseducativos ne ON pl.nivel_educativo_id = ne.id
LEFT JOIN tbl_cargos c ON pl.cargo_id = c.id
LEFT JOIN tbl_especialidades e ON pl.especialidad_id = e.id
LEFT JOIN tbl_escalasmagisteriales em ON pl.escala_magisterial_id = em.id
LEFT JOIN tbl_condiciones cond ON pl.condicion_id = cond.id
WHERE
  (p_search = ''
   OR p.nombres ILIKE '%' || p_search || '%'
   OR p.apellidos ILIKE '%' || p_search || '%'
   OR p.dni ILIKE '%' || p_search || '%'
   OR p.codigo_modular ILIKE '%' || p_search || '%')
  AND (p_cargo_id IS NULL OR c.id = p_cargo_id)
  AND (p_especialidad_id IS NULL OR e.id = p_especialidad_id)
  AND (p_nivel_id IS NULL OR ne.id = p_nivel_id)
ORDER BY
  CASE WHEN ne.id = 3 THEN 1
       WHEN ne.id = 2 THEN 2
       WHEN ne.id = 1 THEN 3
       ELSE 999 END ASC,
  COALESCE(c.id, 999) ASC,
  p.apellidos ASC,
  p.nombres ASC
OFFSET p_offset
LIMIT p_limit
$function$;

-- ============================================================================
-- 20260319053334_school_governance_foundation
-- ============================================================================
create table if not exists public.user_roles (
  role varchar(50) primary key,
  description text not null
);

insert into public.user_roles (role, description)
values
  ('admin', 'Acceso total para administracion del sistema'),
  ('direccion', 'Gestion academica y administrativa de la institucion'),
  ('secretaria', 'Gestion operativa y documental'),
  ('docente', 'Consulta y gestion limitada para docencia'),
  ('consulta', 'Solo lectura')
on conflict (role) do update set description = excluded.description;

update public.users_profiles
set role = 'docente'
where role is null or lower(role) in ('profesor', 'teacher');

update public.users_profiles
set role = 'consulta'
where role is not null
  and role not in ('admin', 'direccion', 'secretaria', 'docente', 'consulta');

alter table public.users_profiles
  alter column role set default 'docente';

alter table public.users_profiles
  add column if not exists is_active boolean not null default true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'users_profiles'
      AND constraint_name = 'users_profiles_role_fkey'
  ) THEN
    ALTER TABLE public.users_profiles
      ADD CONSTRAINT users_profiles_role_fkey
      FOREIGN KEY (role) REFERENCES public.user_roles(role);
  END IF;
END $$;

alter table public.estudiantes
  add column if not exists deleted_at timestamptz,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid,
  add column if not exists deleted_by uuid;

alter table public.tbl_personal
  add column if not exists deleted_at timestamptz,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid,
  add column if not exists deleted_by uuid;

create index if not exists idx_estudiantes_deleted_at on public.estudiantes(deleted_at);
create index if not exists idx_tbl_personal_deleted_at on public.tbl_personal(deleted_at);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default timezone('utc', now()),
  actor_id uuid,
  actor_role varchar(50),
  school varchar(255),
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb
);

create index if not exists idx_audit_log_created_at on public.audit_log(created_at desc);
create index if not exists idx_audit_log_entity on public.audit_log(entity, entity_id);

create or replace function public.current_user_role()
returns varchar
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(up.role, 'consulta')::varchar
  from public.users_profiles up
  where up.id = auth.uid()
  limit 1;
$$;

create or replace function public.current_user_school()
returns varchar
language sql
stable
security definer
set search_path = public
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
  select (public.current_user_role())::text = any(roles);
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
  insert into public.audit_log(actor_id, actor_role, school, action, entity, entity_id, details)
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
    raise exception 'DNI invalido';
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
      raise exception 'DNI del apoderado invalido';
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
      raise exception 'Combinacion de grado y seccion no valida';
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

  perform public.write_audit_log('create', 'estudiantes', v_student_id::text, jsonb_build_object('dni', v_dni));

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
  where id = p_student_id and deleted_at is null;

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
  v_personal_dni char(8);
  v_plaza jsonb := coalesce(p_payload->'plaza', '{}'::jsonb);
begin
  if not public.can_manage_school_data() then
    raise exception 'No autorizado';
  end if;

  if v_dni = '' or v_nombres = '' or v_apellidos = '' or v_codigo_modular = '' then
    raise exception 'Campos obligatorios: nombres, apellidos, dni, codigo_modular';
  end if;

  if v_dni !~ '^\d{8}$' then
    raise exception 'DNI invalido';
  end if;

  if v_codigo_modular !~ '^[A-Za-z0-9-]{4,20}$' then
    raise exception 'Codigo modular invalido';
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

  perform public.write_audit_log('create', 'tbl_personal', v_personal_dni::text, jsonb_build_object('dni', v_personal_dni::text));

  return jsonb_build_object('dni', v_personal_dni::text);
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
  v_dni char(8) := btrim(coalesce(p_dni,''));
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
  where dni = v_dni and deleted_at is null;

  if not found then
    raise exception 'Personal no encontrado';
  end if;

  perform public.write_audit_log('soft_delete', 'tbl_personal', v_dni::text, '{}'::jsonb);

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.soft_delete_personal(text) to authenticated;

-- ============================================================================
-- 20260319053357_school_rls_cleanup_and_policies
-- ============================================================================
alter table public.users_profiles enable row level security;
alter table public.niveles enable row level security;
alter table public.aulas enable row level security;
alter table public.apoderados enable row level security;
alter table public.direcciones enable row level security;
alter table public.estudiantes enable row level security;
alter table public.tbl_niveleseducativos enable row level security;
alter table public.tbl_cargos enable row level security;
alter table public.tbl_especialidades enable row level security;
alter table public.tbl_escalasmagisteriales enable row level security;
alter table public.tbl_condiciones enable row level security;
alter table public.tbl_sistemaspensiones enable row level security;
alter table public.tbl_personal enable row level security;
alter table public.tbl_plazas enable row level security;
alter table public.audit_log enable row level security;

DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'users_profiles','niveles','aulas','apoderados','direcciones','estudiantes',
        'tbl_niveleseducativos','tbl_cargos','tbl_especialidades','tbl_escalasmagisteriales',
        'tbl_condiciones','tbl_sistemaspensiones','tbl_personal','tbl_plazas','audit_log'
      )
  LOOP
    EXECUTE format('drop policy if exists %I on public.%I', rec.policyname, rec.tablename);
  END LOOP;
END $$;

create policy p_users_profiles_select
on public.users_profiles
for select
to authenticated
using (
  id = auth.uid() or public.has_any_role(array['admin','direccion'])
);

create policy p_users_profiles_insert
on public.users_profiles
for insert
to authenticated
with check (
  id = auth.uid() or public.has_any_role(array['admin'])
);

create policy p_users_profiles_update
on public.users_profiles
for update
to authenticated
using (
  id = auth.uid() or public.has_any_role(array['admin'])
)
with check (
  id = auth.uid() or public.has_any_role(array['admin'])
);

create policy p_users_profiles_delete
on public.users_profiles
for delete
to authenticated
using (public.has_any_role(array['admin']));

create policy p_niveles_select on public.niveles for select to authenticated using (public.can_read_school_data());
create policy p_aulas_select on public.aulas for select to authenticated using (public.can_read_school_data());
create policy p_apoderados_select on public.apoderados for select to authenticated using (public.can_read_school_data());
create policy p_direcciones_select on public.direcciones for select to authenticated using (public.can_read_school_data());
create policy p_estudiantes_select on public.estudiantes for select to authenticated using (public.can_read_school_data() and deleted_at is null);
create policy p_tbl_niveleseducativos_select on public.tbl_niveleseducativos for select to authenticated using (public.can_read_school_data());
create policy p_tbl_cargos_select on public.tbl_cargos for select to authenticated using (public.can_read_school_data());
create policy p_tbl_especialidades_select on public.tbl_especialidades for select to authenticated using (public.can_read_school_data());
create policy p_tbl_escalasmagisteriales_select on public.tbl_escalasmagisteriales for select to authenticated using (public.can_read_school_data());
create policy p_tbl_condiciones_select on public.tbl_condiciones for select to authenticated using (public.can_read_school_data());
create policy p_tbl_sistemaspensiones_select on public.tbl_sistemaspensiones for select to authenticated using (public.can_read_school_data());
create policy p_tbl_personal_select on public.tbl_personal for select to authenticated using (public.can_read_school_data() and deleted_at is null);
create policy p_tbl_plazas_select on public.tbl_plazas for select to authenticated using (public.can_read_school_data());

create policy p_estudiantes_insert on public.estudiantes for insert to authenticated with check (public.can_manage_school_data());
create policy p_estudiantes_update on public.estudiantes for update to authenticated using (public.can_manage_school_data()) with check (public.can_manage_school_data());
create policy p_estudiantes_delete on public.estudiantes for delete to authenticated using (public.can_manage_school_data());

create policy p_apoderados_insert on public.apoderados for insert to authenticated with check (public.can_manage_school_data());
create policy p_apoderados_update on public.apoderados for update to authenticated using (public.can_manage_school_data()) with check (public.can_manage_school_data());
create policy p_apoderados_delete on public.apoderados for delete to authenticated using (public.can_manage_school_data());

create policy p_direcciones_insert on public.direcciones for insert to authenticated with check (public.can_manage_school_data());
create policy p_direcciones_update on public.direcciones for update to authenticated using (public.can_manage_school_data()) with check (public.can_manage_school_data());
create policy p_direcciones_delete on public.direcciones for delete to authenticated using (public.can_manage_school_data());

create policy p_tbl_personal_insert on public.tbl_personal for insert to authenticated with check (public.can_manage_school_data());
create policy p_tbl_personal_update on public.tbl_personal for update to authenticated using (public.can_manage_school_data()) with check (public.can_manage_school_data());
create policy p_tbl_personal_delete on public.tbl_personal for delete to authenticated using (public.can_manage_school_data());

create policy p_tbl_plazas_insert on public.tbl_plazas for insert to authenticated with check (public.can_manage_school_data());
create policy p_tbl_plazas_update on public.tbl_plazas for update to authenticated using (public.can_manage_school_data()) with check (public.can_manage_school_data());
create policy p_tbl_plazas_delete on public.tbl_plazas for delete to authenticated using (public.can_manage_school_data());

create policy p_tbl_niveleseducativos_manage on public.tbl_niveleseducativos for all to authenticated using (public.has_any_role(array['admin'])) with check (public.has_any_role(array['admin']));
create policy p_tbl_cargos_manage on public.tbl_cargos for all to authenticated using (public.has_any_role(array['admin'])) with check (public.has_any_role(array['admin']));
create policy p_tbl_especialidades_manage on public.tbl_especialidades for all to authenticated using (public.has_any_role(array['admin'])) with check (public.has_any_role(array['admin']));
create policy p_tbl_escalasmagisteriales_manage on public.tbl_escalasmagisteriales for all to authenticated using (public.has_any_role(array['admin'])) with check (public.has_any_role(array['admin']));
create policy p_tbl_condiciones_manage on public.tbl_condiciones for all to authenticated using (public.has_any_role(array['admin'])) with check (public.has_any_role(array['admin']));
create policy p_tbl_sistemaspensiones_manage on public.tbl_sistemaspensiones for all to authenticated using (public.has_any_role(array['admin'])) with check (public.has_any_role(array['admin']));

create policy p_audit_log_select
on public.audit_log
for select
to authenticated
using (public.has_any_role(array['admin','direccion']));

create policy p_audit_log_insert
on public.audit_log
for insert
to authenticated
with check (public.has_any_role(array['admin','direccion','secretaria']));

-- ============================================================================
-- 20260319053446_school_security_followup
-- ============================================================================
create or replace function public.has_any_role(roles text[])
returns boolean
language sql
stable
set search_path = public
as $$
  select (public.current_user_role())::text = any(roles);
$$;

create or replace function public.can_manage_school_data()
returns boolean
language sql
stable
set search_path = public
as $$
  select public.has_any_role(array['admin','direccion','secretaria']);
$$;

create or replace function public.can_read_school_data()
returns boolean
language sql
stable
set search_path = public
as $$
  select public.has_any_role(array['admin','direccion','secretaria','docente','consulta']);
$$;

alter table public.user_roles enable row level security;

DO $$
DECLARE rec record;
BEGIN
  FOR rec IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname='public' AND tablename='user_roles'
  LOOP
    EXECUTE format('drop policy if exists %I on public.user_roles', rec.policyname);
  END LOOP;
END $$;

create policy p_user_roles_select
on public.user_roles
for select
to authenticated
using (public.can_read_school_data());

create policy p_user_roles_manage
on public.user_roles
for all
to authenticated
using (public.has_any_role(array['admin']))
with check (public.has_any_role(array['admin']));

-- ============================================================================
-- 20260319054105_optimize_rls_and_indexes
-- ============================================================================
create index if not exists idx_aulas_nivel_id on public.aulas(nivel_id);
create index if not exists idx_estudiantes_apoderado_id on public.estudiantes(apoderado_id);
create index if not exists idx_estudiantes_aula_id on public.estudiantes(aula_id);
create index if not exists idx_estudiantes_direccion_id on public.estudiantes(direccion_id);
create index if not exists idx_tbl_personal_sistema_pensiones_id on public.tbl_personal(sistema_pensiones_id);
create index if not exists idx_tbl_plazas_condicion_id on public.tbl_plazas(condicion_id);
create index if not exists idx_tbl_plazas_escala_magisterial_id on public.tbl_plazas(escala_magisterial_id);
create index if not exists idx_tbl_plazas_nivel_educativo_id on public.tbl_plazas(nivel_educativo_id);
create index if not exists idx_users_profiles_role on public.users_profiles(role);

DROP POLICY IF EXISTS p_users_profiles_select ON public.users_profiles;
DROP POLICY IF EXISTS p_users_profiles_insert ON public.users_profiles;
DROP POLICY IF EXISTS p_users_profiles_update ON public.users_profiles;
DROP POLICY IF EXISTS p_users_profiles_delete ON public.users_profiles;

create policy p_users_profiles_select
on public.users_profiles
for select
to authenticated
using (
  id = (select auth.uid()) or public.has_any_role(array['admin','direccion'])
);

create policy p_users_profiles_insert
on public.users_profiles
for insert
to authenticated
with check (
  id = (select auth.uid()) or public.has_any_role(array['admin'])
);

create policy p_users_profiles_update
on public.users_profiles
for update
to authenticated
using (
  id = (select auth.uid()) or public.has_any_role(array['admin'])
)
with check (
  id = (select auth.uid()) or public.has_any_role(array['admin'])
);

create policy p_users_profiles_delete
on public.users_profiles
for delete
to authenticated
using (public.has_any_role(array['admin']));

DROP POLICY IF EXISTS p_tbl_niveleseducativos_manage ON public.tbl_niveleseducativos;
DROP POLICY IF EXISTS p_tbl_cargos_manage ON public.tbl_cargos;
DROP POLICY IF EXISTS p_tbl_especialidades_manage ON public.tbl_especialidades;
DROP POLICY IF EXISTS p_tbl_escalasmagisteriales_manage ON public.tbl_escalasmagisteriales;
DROP POLICY IF EXISTS p_tbl_condiciones_manage ON public.tbl_condiciones;
DROP POLICY IF EXISTS p_tbl_sistemaspensiones_manage ON public.tbl_sistemaspensiones;
DROP POLICY IF EXISTS p_user_roles_manage ON public.user_roles;

create policy p_tbl_niveleseducativos_insert on public.tbl_niveleseducativos for insert to authenticated with check (public.has_any_role(array['admin']));
create policy p_tbl_niveleseducativos_update on public.tbl_niveleseducativos for update to authenticated using (public.has_any_role(array['admin'])) with check (public.has_any_role(array['admin']));
create policy p_tbl_niveleseducativos_delete on public.tbl_niveleseducativos for delete to authenticated using (public.has_any_role(array['admin']));

create policy p_tbl_cargos_insert on public.tbl_cargos for insert to authenticated with check (public.has_any_role(array['admin']));
create policy p_tbl_cargos_update on public.tbl_cargos for update to authenticated using (public.has_any_role(array['admin'])) with check (public.has_any_role(array['admin']));
create policy p_tbl_cargos_delete on public.tbl_cargos for delete to authenticated using (public.has_any_role(array['admin']));

create policy p_tbl_especialidades_insert on public.tbl_especialidades for insert to authenticated with check (public.has_any_role(array['admin']));
create policy p_tbl_especialidades_update on public.tbl_especialidades for update to authenticated using (public.has_any_role(array['admin'])) with check (public.has_any_role(array['admin']));
create policy p_tbl_especialidades_delete on public.tbl_especialidades for delete to authenticated using (public.has_any_role(array['admin']));

create policy p_tbl_escalasmagisteriales_insert on public.tbl_escalasmagisteriales for insert to authenticated with check (public.has_any_role(array['admin']));
create policy p_tbl_escalasmagisteriales_update on public.tbl_escalasmagisteriales for update to authenticated using (public.has_any_role(array['admin'])) with check (public.has_any_role(array['admin']));
create policy p_tbl_escalasmagisteriales_delete on public.tbl_escalasmagisteriales for delete to authenticated using (public.has_any_role(array['admin']));

create policy p_tbl_condiciones_insert on public.tbl_condiciones for insert to authenticated with check (public.has_any_role(array['admin']));
create policy p_tbl_condiciones_update on public.tbl_condiciones for update to authenticated using (public.has_any_role(array['admin'])) with check (public.has_any_role(array['admin']));
create policy p_tbl_condiciones_delete on public.tbl_condiciones for delete to authenticated using (public.has_any_role(array['admin']));

create policy p_tbl_sistemaspensiones_insert on public.tbl_sistemaspensiones for insert to authenticated with check (public.has_any_role(array['admin']));
create policy p_tbl_sistemaspensiones_update on public.tbl_sistemaspensiones for update to authenticated using (public.has_any_role(array['admin'])) with check (public.has_any_role(array['admin']));
create policy p_tbl_sistemaspensiones_delete on public.tbl_sistemaspensiones for delete to authenticated using (public.has_any_role(array['admin']));

create policy p_user_roles_insert on public.user_roles for insert to authenticated with check (public.has_any_role(array['admin']));
create policy p_user_roles_update on public.user_roles for update to authenticated using (public.has_any_role(array['admin'])) with check (public.has_any_role(array['admin']));
create policy p_user_roles_delete on public.user_roles for delete to authenticated using (public.has_any_role(array['admin']));
