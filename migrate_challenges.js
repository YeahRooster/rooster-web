const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyChallengesMigration() {
    const migration = `
        -- Tabla de Desafíos
        CREATE TABLE IF NOT EXISTS challenges (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            titulo TEXT NOT NULL,
            descripcion TEXT,
            talleres_participantes TEXT[],
            fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
            fecha_cierre_subida TIMESTAMP WITH TIME ZONE NOT NULL,
            fecha_cierre_votacion TIMESTAMP WITH TIME ZONE NOT NULL,
            ganador_dni TEXT,
            ganador_nombre TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Tabla de Subidas
        CREATE TABLE IF NOT EXISTS challenge_submissions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
            alumno_dni TEXT NOT NULL,
            alumno_nombre TEXT,
            imagen_url TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(challenge_id, alumno_dni)
        );

        -- Tabla de Votos
        CREATE TABLE IF NOT EXISTS challenge_votes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
            submission_id UUID REFERENCES challenge_submissions(id) ON DELETE CASCADE,
            voter_dni TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(voter_dni, submission_id)
        );

        -- Tabla de Bloqueo de Votos
        CREATE TABLE IF NOT EXISTS challenge_vote_locks (
            challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
            voter_dni TEXT NOT NULL,
            is_locked BOOLEAN DEFAULT FALSE,
            PRIMARY KEY (challenge_id, voter_dni)
        );

        -- Columna de Medallas en Alumnos
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alumnos' AND column_name='medallas') THEN
                ALTER TABLE alumnos ADD COLUMN medallas INTEGER DEFAULT 0;
            END IF;
        END $$;
    `;

    console.log("🚀 Aplicando migración de Desafíos via RPC...");
    const { error } = await supabase.rpc('exec_sql', { sql: migration });

    if (error) {
        console.error("❌ Error al aplicar migración:", error);
    } else {
        console.log("✅ Migración de Desafíos aplicada con éxito.");
    }
}

applyChallengesMigration();
