-- Agrega columnas para el sistema de avatares
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS avatar_id TEXT DEFAULT 'gallo';
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Comentario para documentar
COMMENT ON COLUMN alumnos.avatar_id IS 'Identificador del avatar predefinido (gallo, gallina, etc) o "custom"';
COMMENT ON COLUMN alumnos.avatar_url IS 'URL de la imagen subida por el usuario si avatar_id es "custom"';
