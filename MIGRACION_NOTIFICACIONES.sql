-- Agregar campos de control para notificaciones de pago en la tabla alumnos
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS notificaciones_activas BOOLEAN DEFAULT TRUE;
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS ultima_notificacion_mes INTEGER; -- Mes (1-12)
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS ultima_notificacion_anio INTEGER; -- Año
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS ultima_notificacion_tipo TEXT; -- 'PROXIMO' o 'VENCIDO'
