-- Agregar columna mensaje a las notificaciones para permitir mensajes personalizados
ALTER TABLE social_notifications ADD COLUMN IF NOT EXISTS mensaje TEXT;
