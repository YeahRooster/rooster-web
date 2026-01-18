const fetch = require('node-fetch');

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxWIAakwf_zVWTsSSEzUC38LRUAJYckfFXbrMwBh137DsFCnZfkRexPBAsYB7l8Nzgz/exec';

async function inspect() {
    console.log("🔍 Consultando Google Script dumpAll...");
    try {
        const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=dumpAll`);
        const json = await res.json();

        if (json.status !== 'success') {
            console.error("❌ Error en respuesta:", json);
            return;
        }

        const data = json.data;
        console.log("✅ Keys recibidas:", Object.keys(data));

        if (!data.profesores) {
            console.error("❌ 'profesores' es undefined o null");
        } else {
            console.log(`👨‍🏫 Profesores (length: ${data.profesores.length})`);
            if (data.profesores.length > 0) {
                console.log("   Primer profesor:", data.profesores[0]);
            } else {
                console.log("   ⚠️ Array de profesores vacío.");
            }
        }

        // Check if other critical sheets are empty
        console.log(`📊 Talleres length: ${data.talleres?.length}`);

    } catch (error) {
        console.error("❌ Error en el fetch:", error);
    }
}

inspect();
