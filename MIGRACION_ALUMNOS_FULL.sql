-- Asegurar que la tabla alumnos tenga la columna telefono y notificaciones_activas
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS notificaciones_activas BOOLEAN DEFAULT true;
