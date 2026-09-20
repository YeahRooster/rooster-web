const fs = require('fs'); 
let c = fs.readFileSync('app/api/v2/teacher/data/route.js', 'utf8'); 

c = c.replace("alumnos (nombre)", "alumnos!inner(nombre, dado_de_baja)"); 

c = c.replace(".ilike('taller_nombre', tallerNombre.trim());", ".ilike('taller_nombre', tallerNombre.trim())\n            .eq('alumnos.dado_de_baja', false);"); 

fs.writeFileSync('app/api/v2/teacher/data/route.js', c, 'utf8');
