-- Extensiones detectadas como instaladas en el proyecto origen.
-- Ejecutar en un proyecto Supabase nuevo antes de las migraciones.

create schema if not exists extensions;

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

-- Nota: `pg_stat_statements`, `pg_graphql` y `supabase_vault`
-- suelen estar gestionadas por la plataforma Supabase.
-- Se dejan como referencia para verificar su presencia.

-- create extension if not exists "pg_stat_statements" with schema extensions;
-- create extension if not exists "pg_graphql" with schema graphql;
-- create extension if not exists "supabase_vault" with schema vault;
