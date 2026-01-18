-- Arreglar restricción de email para permitir múltiples VACÍOS
-- pero mantener unicidad en los que SÍ tienen email

-- 1. Eliminar la restricción antigua
ALTER TABLE alumnos DROP CONSTRAINT IF EXISTS alumnos_email_key;

-- 2. Crear índice único parcial (solo aplica a emails NO vacíos)
CREATE UNIQUE INDEX IF NOT EXISTS alumnos_email_unique 
ON alumnos(email) 
WHERE email IS NOT NULL AND email != '';

-- Esto permite:
-- ✅ Múltiples alumnos con email NULL o vacío
-- ✅ Cada email real solo puede usarse una vez
