-- ¡MISION RESCATE! Script para recuperar obras "desaparecidas" (Ejecutar en Supabase SQL Editor)

-- 1. Marcar como ACTIVAS todas las obras que no tienen estado definido (las viejas)
UPDATE social_posts 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- 2. Asegurar que las nuevas obras tengan estado activo por defecto
ALTER TABLE social_posts 
ALTER COLUMN status SET DEFAULT 'active';

-- 3. Verificación (debería devolver filas tras el UPDATE)
SELECT count(*) as obras_recuperadas FROM social_posts WHERE status = 'active';
