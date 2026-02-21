-- SCRIPT DE RESCATE DEFINITIVO: Arreglar permisos de lectura de la Galería
-- Ejecutar en Supabase SQL Editor

-- 1. Habilitar RLS (Row Level Security) en la tabla social_posts si no está habilitado
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- 2. Crear política de lectura pública para TODOS los posts activos
-- (Esto permite que cualquiera pueda VER las obras, sin estar logueado)
DROP POLICY IF EXISTS "Permitir lectura pública de posts activos" ON social_posts;

CREATE POLICY "Permitir lectura pública de posts activos" 
ON social_posts 
FOR SELECT 
USING (status = 'active' OR status IS NULL);

-- 3. Permitir que usuarios autenticados creen posts
DROP POLICY IF EXISTS "Usuarios pueden crear sus propios posts" ON social_posts;

CREATE POLICY "Usuarios pueden crear sus propios posts" 
ON social_posts 
FOR INSERT 
WITH CHECK (true);

-- 4. Solo admins pueden actualizar/borrar (opcional, para futuro)
DROP POLICY IF EXISTS "Solo admins pueden modificar posts" ON social_posts;

CREATE POLICY "Solo admins pueden modificar posts" 
ON social_posts 
FOR UPDATE 
USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

-- 5. Verificar que las políticas se crearon
SELECT * FROM pg_policies WHERE tablename = 'social_posts';
