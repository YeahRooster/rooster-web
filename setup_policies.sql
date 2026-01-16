-- POLÍTICAS DE LECTURA PARA APIS v2
-- Esto permite que la web lea los datos necesarios sin comprometer la escritura

-- Alumnos: Lectura pública (restringida por DNI en el código de la API)
CREATE POLICY "Lectura pública de alumnos" ON alumnos FOR SELECT USING (true);

-- Inscripciones: Lectura pública
CREATE POLICY "Lectura pública de inscripciones" ON inscripciones FOR SELECT USING (true);

-- Pagos: Lectura pública
CREATE POLICY "Lectura pública de pagos" ON pagos FOR SELECT USING (true);

-- Profesores: Lectura pública
CREATE POLICY "Lectura pública de profesores" ON profesores FOR SELECT USING (true);

-- Recursos (Cloudinary): Lectura pública
CREATE POLICY "Lectura pública de recursos" ON recursos FOR SELECT USING (true);
