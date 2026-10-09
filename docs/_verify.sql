-- Read-only schema snapshot for comparison with 06_BACKEND_SCHEMA.md.
-- Run in the Supabase SQL Editor and paste the result sets back for drift review.

-- Tables and views in public.
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_type, table_name;

-- Every public column, including type, nullability, default and ordinal position.
SELECT table_name, ordinal_position, column_name, data_type, udt_name,
       is_nullable, column_default, character_maximum_length,
      numeric_precision, numeric_scale, is_generated, generation_expression
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Enum labels in declaration order.
SELECT ns.nspname AS schema_name, typ.typname AS enum_name,
       enum.enumlabel AS enum_label, enum.enumsortorder
FROM pg_type typ
JOIN pg_namespace ns ON ns.oid = typ.typnamespace
JOIN pg_enum enum ON enum.enumtypid = typ.oid
WHERE ns.nspname = 'public'
ORDER BY typ.typname, enum.enumsortorder;

-- Primary, foreign-key, unique, check, and exclusion constraints.
SELECT ns.nspname AS schema_name, cls.relname AS table_name,
       con.conname AS constraint_name,
       CASE con.contype
         WHEN 'p' THEN 'PRIMARY KEY'
         WHEN 'f' THEN 'FOREIGN KEY'
         WHEN 'u' THEN 'UNIQUE'
         WHEN 'c' THEN 'CHECK'
         WHEN 'x' THEN 'EXCLUSION'
         ELSE con.contype::text
       END AS constraint_type,
       pg_get_constraintdef(con.oid, true) AS definition
FROM pg_constraint con
JOIN pg_class cls ON cls.oid = con.conrelid
JOIN pg_namespace ns ON ns.oid = cls.relnamespace
WHERE ns.nspname = 'public'
ORDER BY cls.relname, con.conname;

-- Explicit and constraint-backed indexes.
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Views and their current definitions.
SELECT schemaname, viewname, definition
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- RLS enabled/forced state per public table.
SELECT ns.nspname AS schema_name, cls.relname AS table_name,
       cls.relrowsecurity AS rls_enabled,
       cls.relforcerowsecurity AS rls_forced
FROM pg_class cls
JOIN pg_namespace ns ON ns.oid = cls.relnamespace
WHERE ns.nspname = 'public'
  AND cls.relkind IN ('r', 'p')
ORDER BY cls.relname;

-- RLS policy names, roles, commands, USING and WITH CHECK expressions.
SELECT schemaname, tablename, policyname, permissive, roles, cmd,
       qual AS using_expression, with_check AS check_expression
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename, policyname;

-- Non-internal triggers, attached functions, and trigger definitions.
SELECT ns.nspname AS schema_name, cls.relname AS table_name,
       trg.tgname AS trigger_name,
       proc.proname AS function_name,
       pg_get_triggerdef(trg.oid, true) AS definition
FROM pg_trigger trg
JOIN pg_class cls ON cls.oid = trg.tgrelid
JOIN pg_namespace ns ON ns.oid = cls.relnamespace
JOIN pg_proc proc ON proc.oid = trg.tgfoid
WHERE NOT trg.tgisinternal
  AND ns.nspname IN ('public', 'storage', 'auth')
ORDER BY ns.nspname, cls.relname, trg.tgname;

-- Public functions, including argument/result types, security mode and configuration.
SELECT ns.nspname AS schema_name, proc.proname AS function_name,
       pg_get_function_identity_arguments(proc.oid) AS identity_arguments,
       pg_get_function_result(proc.oid) AS result_type,
       lang.lanname AS language,
       proc.prosecdef AS security_definer,
       proc.provolatile AS volatility,
       proc.proconfig AS function_settings,
       pg_get_userbyid(proc.proowner) AS owner,
       proc.proacl AS acl
FROM pg_proc proc
JOIN pg_namespace ns ON ns.oid = proc.pronamespace
JOIN pg_language lang ON lang.oid = proc.prolang
WHERE ns.nspname = 'public'
ORDER BY proc.proname, identity_arguments;

-- Column-level grants, especially products and seller_profiles.
SELECT table_schema, table_name, column_name, grantee, privilege_type,
       is_grantable
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name IN ('products', 'seller_profiles')
ORDER BY table_name, column_name, grantee, privilege_type;

-- Table-level grants for public catalog/profile access.
SELECT table_schema, table_name, grantee, privilege_type, is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('products', 'seller_profiles', 'seller_public_profiles')
ORDER BY table_name, grantee, privilege_type;

-- Storage buckets and public/private plus upload restrictions.
SELECT id, name, public, file_size_limit, allowed_mime_types,
  created_at, updated_at
FROM storage.buckets
ORDER BY id;

-- Storage object policies (bucket-specific object access rules).
SELECT schemaname, tablename, policyname, permissive, roles, cmd,
       qual AS using_expression, with_check AS check_expression
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;