-- Configurar costo de inscripción anual
-- General: $10.000
-- Excepciones: Virtuales y Particulares ($0)

ALTER TABLE talleres 
ADD COLUMN IF NOT EXISTS precio_inscripcion NUMERIC DEFAULT 0;

UPDATE talleres 
SET precio_inscripcion = 10000;

UPDATE talleres 
SET precio_inscripcion = 0 
WHERE titulo ILIKE '%VIRTUAL%' 
   OR titulo ILIKE '%ONLINE%' 
   OR titulo ILIKE '%ZOOM%';

UPDATE talleres 
SET precio_inscripcion = 0 
WHERE titulo ILIKE '%PARTICULAR%' 
   OR titulo ILIKE '%CLASE PERSONALIZADA%';
