-- EJECUTAR ESTO EN EL SQL EDITOR DE SUPABASE DASHBOARD
-- Estas sentencias optimizan las búsquedas por DNI, haciendo que el login y el cálculo de deudas scan instantáneos.

-- Índices para la tabla PAGOS
CREATE INDEX IF NOT EXISTS idx_pagos_alumno_dni ON pagos(alumno_dni);
CREATE INDEX IF NOT EXISTS idx_pagos_taller ON pagos(taller);

-- Índices para la tabla INSCRIPCIONES
CREATE INDEX IF NOT EXISTS idx_inscripciones_alumno_dni ON inscripciones(alumno_dni);
CREATE INDEX IF NOT EXISTS idx_inscripciones_taller_nombre ON inscripciones(taller_nombre);

-- Índices para la tabla ALUMNOS
CREATE INDEX IF NOT EXISTS idx_alumnos_dni ON alumnos(dni);

-- Índices para la tabla RECURSOS
CREATE INDEX IF NOT EXISTS idx_recursos_taller ON recursos(taller);
