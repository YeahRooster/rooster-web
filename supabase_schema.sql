-- SCRIPT DE CREACIÓN DE TABLAS - ROOSTER v2.0
-- Copiá y pegá esto en el "SQL Editor" de Supabase y dale a "Run"

-- 1. TABLA DE TALLERES
CREATE TABLE IF NOT EXISTS talleres (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    dia TEXT,
    horario TEXT,
    descripcion_corta TEXT,
    descripcion_larga TEXT,
    imagen_url TEXT,
    cupos_totales INTEGER DEFAULT 15,
    cupos_ocupados INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. TABLA DE ALUMNOS
CREATE TABLE IF NOT EXISTS alumnos (
    dni TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE,
    password TEXT NOT NULL, -- Aquí guardaremos la pass (luego la encriptaremos)
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. TABLA DE PROFESORES
CREATE TABLE IF NOT EXISTS profesores (
    dni TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    password TEXT NOT NULL,
    taller_asignado TEXT, -- Nombre del taller
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. TABLA DE INSCRIPCIONES
CREATE TABLE IF NOT EXISTS inscripciones (
    id SERIAL PRIMARY KEY,
    alumno_dni TEXT REFERENCES alumnos(dni) ON DELETE CASCADE,
    taller_id INTEGER REFERENCES talleres(id) ON DELETE SET NULL,
    taller_nombre TEXT, -- Respaldo del nombre del taller
    fecha_inscripcion DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. TABLA DE PAGOS
CREATE TABLE IF NOT EXISTS pagos (
    id SERIAL PRIMARY KEY,
    alumno_dni TEXT REFERENCES alumnos(dni) ON DELETE CASCADE,
    taller TEXT NOT NULL,
    mes TEXT NOT NULL,
    anio INTEGER NOT NULL,
    estado TEXT DEFAULT 'pendiente', -- 'pagado' o 'pendiente'
    monto DECIMAL(10,2),
    fecha_pago TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. TABLA DE RECURSOS (Materiales de profes)
CREATE TABLE IF NOT EXISTS recursos (
    id SERIAL PRIMARY KEY,
    taller TEXT NOT NULL,
    nombre_archivo TEXT NOT NULL,
    url_archivo TEXT NOT NULL, -- URL de Cloudinary o Drive
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    profesor_dni TEXT REFERENCES profesores(dni) ON DELETE SET NULL
);

-- Habilitar RLS (Row Level Security) por seguridad (luego configuraremos las políticas)
ALTER TABLE talleres ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE profesores ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recursos ENABLE ROW LEVEL SECURITY;

-- Políticas básicas para permitir lectura pública de talleres por ahora
CREATE POLICY "Talleres son legibles por todos" ON talleres FOR SELECT USING (true);
