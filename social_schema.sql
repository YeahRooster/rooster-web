-- TABLAS PARA LA RED SOCIAL DE ROOSTER

-- 1. Tabla de Publicaciones (Obras de Arte)
CREATE TABLE IF NOT EXISTS social_posts (
    id BIGSERIAL PRIMARY KEY,
    alumno_dni TEXT NOT NULL REFERENCES alumnos(dni) ON DELETE CASCADE,
    alumno_nombre TEXT, -- Denormalizado para velocidad
    imagen_url TEXT NOT NULL,
    titulo TEXT,
    descripcion TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Likes
CREATE TABLE IF NOT EXISTS social_likes (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    usuario_dni TEXT NOT NULL, -- Puede ser alumno o profe
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, usuario_dni) -- Un solo like por persona
);

-- 3. Tabla de Notificaciones
CREATE TABLE IF NOT EXISTS social_notifications (
    id BIGSERIAL PRIMARY KEY,
    destinatario_dni TEXT NOT NULL,
    actor_nombre TEXT, -- Quien disparó la notificación (ej: "Juan")
    post_id BIGINT REFERENCES social_posts(id) ON DELETE SET NULL,
    tipo TEXT DEFAULT 'like', -- Por ahora solo 'like'
    leida BOOLEAN DEFAULT FALSE,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Habilitar RLS
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Lectura pública de posts" ON social_posts FOR SELECT USING (true);
CREATE POLICY "Escritura de posts para alumnos" ON social_posts FOR INSERT WITH CHECK (true);

CREATE POLICY "Lectura pública de likes" ON social_likes FOR SELECT USING (true);
CREATE POLICY "Gestión de likes para usuarios" ON social_likes FOR ALL USING (true);

CREATE POLICY "Lectura de notificaciones propias" ON social_notifications FOR SELECT USING (true);
CREATE POLICY "Gestión de notificaciones" ON social_notifications FOR ALL USING (true);
