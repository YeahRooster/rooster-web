require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const sql = `
CREATE TABLE IF NOT EXISTS comunidad_posts (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    imagenes JSONB DEFAULT '[]'::jsonb,
    autor_nombre VARCHAR(100) NOT NULL,
    autor_dni VARCHAR(20) NOT NULL,
    autor_rol VARCHAR(20) DEFAULT 'profesor',
    oculto BOOLEAN DEFAULT false,
    fecha_publicacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comunidad_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES comunidad_posts(id) ON DELETE CASCADE,
    alumno_dni VARCHAR(20) REFERENCES alumnos(dni) ON DELETE CASCADE,
    comentario TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comunidad_likes (
    post_id INTEGER REFERENCES comunidad_posts(id) ON DELETE CASCADE,
    alumno_dni VARCHAR(20) REFERENCES alumnos(dni) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (post_id, alumno_dni)
);
`;

supabase.rpc('exec_sql', { sql: sql }).then(res => {
    console.log(res);
}).catch(console.error);
