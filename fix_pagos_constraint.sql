-- Arreglar restricción UNIQUE para tabla PAGOS
-- Esto es necesario para que el upsert de la migración funcione correctamente
-- y evite duplicar pagos si se corre el script varias veces.

-- 1. Eliminar restricciones viejas si existen
ALTER TABLE pagos DROP CONSTRAINT IF EXISTS pagos_unique_key;

-- 2. Crear nueva restricción compuesta
-- Un alumno no puede tener dos pagos para el mismo TALLER en el mismo MES y AÑO
CREATE UNIQUE INDEX IF NOT EXISTS pagos_alumno_taller_mes_anio_idx
ON pagos (alumno_dni, taller, mes, anio);

-- 3. Agregar constraint usando el índice
ALTER TABLE pagos 
ADD CONSTRAINT pagos_unique_key 
UNIQUE USING INDEX pagos_alumno_taller_mes_anio_idx;
