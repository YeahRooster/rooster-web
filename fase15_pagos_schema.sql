-- =====================================================
-- FASE 15: Sistema Avanzado de Gestión de Pagos
-- Modificaciones de Base de Datos
-- =====================================================

-- 1. TABLA TALLERES: Agregar sistema de precios manuales
-- --------------------------------------------------------
ALTER TABLE talleres 
ADD COLUMN IF NOT EXISTS precio_base NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS precio_desc_dia10 NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS precio_desc_efectivo NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS precio_por_hora NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tipo_cobro TEXT DEFAULT 'MENSUAL';

-- Valores iniciales para talleres existentes
UPDATE talleres SET 
  precio_base = 30000,
  precio_desc_dia10 = 27000,
  precio_desc_efectivo = 25500,
  tipo_cobro = 'MENSUAL'
WHERE titulo LIKE '%DIBUJO%';

UPDATE talleres SET 
  precio_base = 33000,
  precio_desc_dia10 = 29700,
  precio_desc_efectivo = 28000,
  tipo_cobro = 'MENSUAL'
WHERE titulo LIKE '%CERÁMICA%' OR titulo LIKE '%CERAMICA%';

-- 2. TABLA INSCRIPCIONES: Control de ciclo anual
-- -----------------------------------------------
ALTER TABLE inscripciones
ADD COLUMN IF NOT EXISTS fecha_inicio_ciclo DATE,
ADD COLUMN IF NOT EXISTS fecha_vencimiento_ciclo DATE,
ADD COLUMN IF NOT EXISTS estado_inscripcion TEXT DEFAULT 'VIGENTE',
ADD COLUMN IF NOT EXISTS modalidad TEXT DEFAULT 'PRESENCIAL';

-- Inicializar fechas para inscripciones existentes
UPDATE inscripciones 
SET fecha_inicio_ciclo = COALESCE(fecha_inscripcion, CURRENT_DATE)
WHERE fecha_inicio_ciclo IS NULL;

UPDATE inscripciones 
SET fecha_vencimiento_ciclo = fecha_inicio_ciclo + INTERVAL '12 months'
WHERE fecha_vencimiento_ciclo IS NULL AND fecha_inicio_ciclo IS NOT NULL;

-- Trigger para calcular vencimiento automáticamente
CREATE OR REPLACE FUNCTION set_vencimiento_inscripcion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.fecha_inicio_ciclo IS NOT NULL AND NEW.fecha_vencimiento_ciclo IS NULL THEN
    NEW.fecha_vencimiento_ciclo := NEW.fecha_inicio_ciclo + INTERVAL '12 months';
  END IF;
  
  -- Actualizar estado según vencimiento
  IF NEW.fecha_vencimiento_ciclo <= CURRENT_DATE + INTERVAL '30 days' THEN
    NEW.estado_inscripcion := 'POR_VENCER';
  ELSIF NEW.fecha_vencimiento_ciclo <= CURRENT_DATE THEN
    NEW.estado_inscripcion := 'VENCIDA';
  ELSE
    NEW.estado_inscripcion := 'VIGENTE';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vencimiento ON inscripciones;
CREATE TRIGGER trigger_vencimiento
BEFORE INSERT OR UPDATE ON inscripciones
FOR EACH ROW EXECUTE FUNCTION set_vencimiento_inscripcion();

-- 3. TABLA PAGOS: Estructura mejorada
-- ------------------------------------
ALTER TABLE pagos
ADD COLUMN IF NOT EXISTS cuota_numero INTEGER,
ADD COLUMN IF NOT EXISTS monto_base NUMERIC,
ADD COLUMN IF NOT EXISTS descuento_aplicado NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS monto_final NUMERIC,
ADD COLUMN IF NOT EXISTS metodo_pago TEXT,
ADD COLUMN IF NOT EXISTS fecha_real_pago DATE,
ADD COLUMN IF NOT EXISTS comprobante_url TEXT,
ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- 4. TABLA ALUMNOS: Agregar país para detectar pasarela
-- -------------------------------------------------------
ALTER TABLE alumnos 
ADD COLUMN IF NOT EXISTS pais TEXT DEFAULT 'Argentina';

-- 5. Comentarios descriptivos
-- ---------------------------
COMMENT ON COLUMN talleres.precio_base IS 'Precio mensual sin descuentos';
COMMENT ON COLUMN talleres.precio_desc_dia10 IS 'Precio si paga hasta día 10 del mes';
COMMENT ON COLUMN talleres.precio_desc_efectivo IS 'Precio si paga en efectivo';
COMMENT ON COLUMN talleres.precio_por_hora IS 'Para talleres de clases particulares';
COMMENT ON COLUMN talleres.tipo_cobro IS 'MENSUAL o POR_HORA';

COMMENT ON COLUMN inscripciones.fecha_inicio_ciclo IS 'Cuando pagó la inscripción anual';
COMMENT ON COLUMN inscripciones.fecha_vencimiento_ciclo IS '12 meses después del inicio';
COMMENT ON COLUMN inscripciones.estado_inscripcion IS 'VIGENTE, POR_VENCER o VENCIDA';

COMMENT ON COLUMN pagos.cuota_numero IS 'Número de cuota dentro del ciclo del alumno (1-12)';
COMMENT ON COLUMN pagos.monto_final IS 'Monto realmente cobrado (puede ser editado manualmente)';
