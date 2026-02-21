-- Script de corrección para Rooster (Ejecutar en Supabase SQL Editor)

-- 1. Agregar columna 'featured' para el Muro de Honor
ALTER TABLE social_posts 
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

-- 2. Agregar columnas de Avatar para alumnos (por si faltaron en el paso anterior)
ALTER TABLE alumnos 
ADD COLUMN IF NOT EXISTS avatar_id TEXT DEFAULT 'gallo';

ALTER TABLE alumnos 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. Confirmar que todo está bien
SELECT 'Migración completada con éxito' as status;
