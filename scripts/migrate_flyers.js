require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const cloudinary = require('cloudinary').v2;

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

async function migrateWorkshopImages() {
    console.log("🖼️ Iniciando migración de Flyers a Cloudinary...");

    try {
        const { data: talleres, error: tErr } = await supabase.from('talleres').select('id, titulo, imagen_url');
        if (tErr) throw tErr;

        console.log(`🔎 Encontrados ${talleres.length} turnos para procesar.`);

        for (const t of talleres) {
            const url = t.imagen_url;
            if (url && (url.includes('google.com') || url.includes('drive.google'))) {
                console.log(`⏳ Migrando imagen para: ${t.titulo} (${url.substring(0, 30)}...)`);

                try {
                    // Extraer ID de Drive si es posible
                    let driveId = '';
                    const matchId = url.match(/id=([^&]+)/) || url.match(/\/d\/([^/]+)/);
                    if (matchId) driveId = matchId[1];

                    if (!driveId) {
                        console.warn(`   ⚠️ No se pudo extraer ID de Drive para ${t.titulo}. Saltando...`);
                        continue;
                    }

                    const downloadUrl = `https://docs.google.com/uc?export=download&id=${driveId}`;

                    const uploadRes = await cloudinary.uploader.upload(downloadUrl, {
                        folder: "rooster/talleres",
                        public_id: `${t.titulo.replace(/\s+/g, '_')}_${t.id}`,
                        resource_type: "image"
                    });

                    // Actualizar Supabase
                    const { error: updErr } = await supabase
                        .from('talleres')
                        .update({ imagen_url: uploadRes.secure_url })
                        .eq('id', t.id);

                    if (updErr) console.error(`   ❌ Error actualizando DB:`, updErr.message);
                    else console.log(`   ✅ ¡Listo!: ${uploadRes.secure_url}`);

                } catch (err) {
                    console.error(`   ❌ Falló migración de ${t.titulo}:`, err.message);
                }
            } else {
                console.log(`   ⏩ Taller ${t.titulo} ya tiene imagen externa o nula. Saltando.`);
            }
        }

        console.log("\n🚀 ¡MIGRACIÓN DE FLYERS TERMINADA!");
    } catch (error) {
        console.error("❌ ERROR CRÍTICO:", error);
    }
}

migrateWorkshopImages();
