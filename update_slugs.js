require('dotenv').config({path:'.env.local'});
const {createClient} = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function generateSlug(name) {
    return name.toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

async function run() {
    const { data: alumnos, error } = await supabaseAdmin.from('alumnos').select('dni, nombre, slug');
    if (error) throw error;
    
    const usedSlugs = new Set();
    
    for (let alumno of alumnos) {
        if (alumno.slug) {
            usedSlugs.add(alumno.slug);
            continue;
        }
        let baseSlug = generateSlug(alumno.nombre);
        if (!baseSlug) baseSlug = 'alumno';
        
        let newSlug = baseSlug;
        let counter = 1;
        while (usedSlugs.has(newSlug)) {
            newSlug = baseSlug + '-' + counter;
            counter++;
        }
        
        usedSlugs.add(newSlug);
        console.log(`Updating ${alumno.nombre} -> ${newSlug}`);
        
        await supabaseAdmin.from('alumnos').update({ slug: newSlug }).eq('dni', alumno.dni);
    }
    console.log('Done!');
}
run();
