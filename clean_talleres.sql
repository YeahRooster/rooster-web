-- SCRIPT DE LIMPIEZA Y REAJUSTE DE TABLA TALLERES
-- Esto permite que Supabase maneje los IDs automáticamente

TRUNCATE TABLE inscripciones CASCADE;
TRUNCATE TABLE talleres CASCADE;

-- Si queremos que el ID no se choque con los del excel si los mandamos manual,
-- pero mejor dejamos que Supabase asigne los nuevos IDs.
ALTER SEQUENCE talleres_id_seq RESTART WITH 1;
