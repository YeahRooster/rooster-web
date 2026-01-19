-- Insertar Taller de Dibujo Intensivo (Doble Carga)
-- Invisible para listados públicos (activo = false o manejo especial en frontend) pero con precios definidos.

INSERT INTO talleres (titulo, dia, horario, descripcion_corta, descripcion_larga, imagen_url, cupos_totales, cupos_ocupados, activo, precio_base, precio_desc_dia10, precio_desc_efectivo, precio_por_hora, tipo_cobro)
VALUES (
    'TALLER DE DIBUJO (DOBLE CARGA)', 
    'MULTIPLE', 
    'A COORDINAR', 
    'Modalidad intensiva de 2 clases por semana.', 
    'Acceso a dos turnos semanales de dibujo (ej: Martes y Jueves) con tarifa bonificada.', 
    '', -- Sin imagen específica 
    30, -- Cupo amplio compartido
    0, 
    false, -- Invisible en listado general de /talleres (solo accesible vía lógica interna)
    43000, -- Precio Base
    41000, -- Precio Desc. Día 10
    38000,  -- Precio Desc. Efectivo
    0,
    'MENSUAL'
);
