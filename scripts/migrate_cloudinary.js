require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const cloudinary = require('cloudinary').v2;
const fetch = require('node-fetch');

// Configuración Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuración Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbypPL5Bfg_-XsOlXprxArej_qDwLRcDYsYktGJiIgxcCq23rhw56dxn0ElkdaYwLkYi/exec';

async function migrateResources() {
    console.log("🚀 Iniciando migración de Archivos a Cloudinary...");

    try {
        // 1. Obtener talleres activos para buscar sus recursos
        const { data: talleres, error: tErr } = await supabase.from('talleres').select('titulo');
        if (tErr) throw tErr;

        const uniqueTalleres = [...new Set(talleres.map(t => t.titulo))];
        console.log(`🔎 Buscando recursos para ${uniqueTalleres.length} talleres...`);

        // YA NO BORRAMOS 'recursos' de forma masiva para preservar lo subido por profes desde la web

        for (const taller of uniqueTalleres) {
            console.log(`\n📂 Procesando taller: ${taller}`);
            const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=getTeacherData&taller=${encodeURIComponent(taller)}`);
            const data = await res.json();

            if (data.status === 'success' && data.resources?.length > 0) {
                console.log(`   Encontrados ${data.resources.length} archivos en Drive.`);

                for (const file of data.resources) {
                    console.log(`   ⏳ Subiendo: ${file.nombre}...`);

                    // Link de descarga directa de Google Drive
                    const downloadUrl = `https://docs.google.com/uc?export=download&id=${file.id}`;

                    try {
                        // Subida a Cloudinary
                        const uploadRes = await cloudinary.uploader.upload(downloadUrl, {
                            folder: `rooster/recursos/${taller.replace(/\s+/g, '_')}`,
                            public_id: file.nombre.split('.')[0],
                            resource_type: "auto"
                        });

                        // Registrar en Supabase
                        const { error: insErr } = await supabase.from('recursos').insert({
                            taller: taller,
                            nombre_archivo: file.nombre,
                            url_archivo: uploadRes.secure_url,
                            fecha_subida: new Date()
                        });

                        if (insErr) console.error(`   ❌ Error en Supabase para ${file.nombre}:`, insErr.message);
                        else console.log(`   ✅ ¡Listo!: ${uploadRes.secure_url}`);

                    } catch (uploadErr) {
                        console.error(`   ❌ Falló subida de ${file.nombre}:`, uploadErr.message);
                    }
                }
            } else {
                console.log(`   (Sin archivos)`);
            }
        }

        console.log("\n✨ MIGRACIÓN DE ARCHIVOS COMPLETADA CON ÉXITO ✨");

    } catch (error) {
        console.error("❌ ERROR CRÍTICO:", error);
    }
}

migrateResources();
