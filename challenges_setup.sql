-- 1. Tabla de Desafíos (Retos)
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descripcion TEXT, -- Instrucciones/Reglas
    talleres_participantes TEXT[], -- Nombres de talleres que pueden concursar
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_cierre_subida TIMESTAMP WITH TIME ZONE NOT NULL, -- Fin etapa 1 / Inicio etapa 2 (Sola se define por el cierre de subidas)
    fecha_cierre_votacion TIMESTAMP WITH TIME ZONE NOT NULL, -- Fin etapa 2
    ganador_dni TEXT,
    ganador_nombre TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Obras para el Desafío (Subidas)
CREATE TABLE IF NOT EXISTS challenge_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    alumno_dni TEXT NOT NULL,
    alumno_nombre TEXT,
    imagen_url TEXT NOT NULL,
    bio TEXT, -- Descripción coincidente con el modal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(challenge_id, alumno_dni) -- Un alumno solo sube una obra por desafío
);

-- 3. Tabla de Votos (Anónimos)
CREATE TABLE IF NOT EXISTS challenge_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES challenge_submissions(id) ON DELETE CASCADE,
    voter_dni TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(voter_dni, submission_id) -- Un voto por obra por alumno
);

-- 4. Tabla de Bloqueo de Votos (Regla del 3er voto)
CREATE TABLE IF NOT EXISTS challenge_vote_locks (
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    voter_dni TEXT NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (challenge_id, voter_dni)
);

-- 5. Agregar columna de Medallas en tabla Alumnos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alumnos' AND column_name='medallas') THEN
        ALTER TABLE alumnos ADD COLUMN medallas INTEGER DEFAULT 0;
    END IF;
END $$;

-- 6. Función Ayudante para que el Asistente pueda ejecutar SQL (opcional pero recomendada)
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
