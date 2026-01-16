-- ACTUALIZACIÓN: Control de Acceso de Alumnos
-- Ejecutar en el Editor SQL de Supabase

-- 1. Agregar columna activo a alumnos (inactivos por defecto)
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT false;

-- 2. Activar a todos los alumnos actuales para no bloquear a nadie existente
UPDATE alumnos SET activo = true;

-- 3. Nota: Los nuevos alumnos creados desde la web entrarán con activo = false
-- y deberán ser aprobados desde el Dashboard.
