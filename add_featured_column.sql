-- Agregar columna featured para el Muro de Honor
ALTER TABLE social_posts 
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

-- Crear índice para consultas rápidas del muro
CREATE INDEX IF NOT EXISTS idx_social_posts_featured ON social_posts(featured) WHERE featured = TRUE;
