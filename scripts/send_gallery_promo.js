const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function sendGalleryPromo() {
    console.log("🚀 Starting Gallery Promotion Notification...");

    // 1. Fetch targeted students (Dibujo, Dibujo Virtual, Manga)
    // We look into 'inscripciones' to see who is enrolled in these talleres
    const { data: inscripciones, error: errInsc } = await supabase
        .from('inscripciones')
        .select('alumno_dni, taller_nombre');

    if (errInsc) {
        console.error("❌ Error fetching enrollments:", errInsc);
        return;
    }

    const targetedDnis = new Set();
    const keywords = ['dibujo', 'manga']; // Catch 'Dibujo', 'Dibujo Virtual', 'Manga'

    inscripciones.forEach(ins => {
        const title = (ins.taller_nombre || '').toLowerCase();
        if (keywords.some(kw => title.includes(kw))) {
            targetedDnis.add(ins.alumno_dni);
        }
    });

    console.log(`🎯 Targeted students found: ${targetedDnis.size}`);

    const message = "Ya varios de los alumnos están subiendo sus obras, ¡no te olvides de compartir la tuya ingresando en galería!";

    const notifications = Array.from(targetedDnis).map(dni => ({
        destinatario_dni: dni,
        actor_nombre: 'Rooster',
        tipo: 'GALLERY_PROMO',
        mensaje: message,
        leida: false
    }));

    // 2. Insert notifications in chunks (Supabase limit)
    const chunkSize = 50;
    let successCount = 0;

    for (let i = 0; i < notifications.length; i += chunkSize) {
        const chunk = notifications.slice(i, i + chunkSize);
        const { error } = await supabase.from('social_notifications').insert(chunk);
        if (error) {
            console.error(`❌ Error inserting chunk ${i}:`, error);
        } else {
            successCount += chunk.length;
        }
    }

    console.log(`✅ Finished! ${successCount} notifications sent.`);
}

sendGalleryPromo();
