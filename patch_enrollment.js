const fs = require('fs');
let c = fs.readFileSync('app/api/v2/admin/enrollment/route.js', 'utf8');

const target = `        // 2. Insertar inscripcin
        const { error } = await supabaseAdmin
            .from('inscripciones')
            .insert({
                alumno_dni: String(dni).trim(),
                taller_id: taller_id
            });`;

const replacement = `        // 2. Insertar inscripcin
        const { data: dbTaller } = await supabaseAdmin.from('talleres').select('titulo').eq('id', taller_id).single();
        const tallerNombre = dbTaller ? dbTaller.titulo : null;

        const { error } = await supabaseAdmin
            .from('inscripciones')
            .insert({
                alumno_dni: String(dni).trim(),
                taller_id: taller_id,
                taller_nombre: tallerNombre
            });`;

c = c.replace(target, replacement);
fs.writeFileSync('app/api/v2/admin/enrollment/route.js', c, 'utf8');
