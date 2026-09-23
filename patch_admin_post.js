const fs = require('fs');
let c = fs.readFileSync('app/api/v2/admin/students/route.js', 'utf8');

const target = `        if (talleres && talleres.length > 0) {
            const inscripciones = talleres.map(tId => ({
                alumno_dni: cleanDni,
                taller_id: tId
            }));`;

const replacement = `        if (talleres && talleres.length > 0) {
            const { data: dbTalleres } = await supabaseAdmin.from('talleres').select('id, titulo').in('id', talleres);
            const talleresMap = {};
            if (dbTalleres) dbTalleres.forEach(t => talleresMap[t.id] = t.titulo);
            
            const inscripciones = talleres.map(tId => ({
                alumno_dni: cleanDni,
                taller_id: tId,
                taller_nombre: talleresMap[tId] || null
            }));`;

c = c.replace(target, replacement);
fs.writeFileSync('app/api/v2/admin/students/route.js', c, 'utf8');
