const fetch = require('node-fetch');

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyC0J3TAwWOXT3K-nSAgbn5wmLCGav6q4VhZWPBRdbUk0hSAMDI3zcu3ppoafmEMWgN/exec';

async function diagnoseGAS() {
    console.log("📥 Consultando GAS dumpAll...");
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=dumpAll`);
        const data = await response.json();

        if (data.status !== 'success') {
            console.error("❌ GAS Error:", data.message);
            return;
        }

        const keys = Object.keys(data.data);
        console.log("✅ Secciones encontradas:", keys.join(', '));

        keys.forEach(key => {
            const rows = data.data[key];
            console.log(`\n--- ${key.toUpperCase()} (Total: ${rows.length} filas) ---`);
            if (rows.length > 0) {
                console.log("Muestra (fila 1):", rows[0]);
            } else {
                console.log("⚠️ La sección está vacía.");
            }
        });

    } catch (err) {
        console.error("❌ Error de red/parsing:", err);
    }
}

diagnoseGAS();
