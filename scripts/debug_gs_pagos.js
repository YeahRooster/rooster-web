const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyC0J3TAwWOXT3K-nSAgbn5wmLCGav6q4VhZWPBRdbUk0hSAMDI3zcu3ppoafmEMWgN/exec';

async function debugGS() {
    console.log("📡 Consultando Google Script...");
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=dumpAll`);
        const result = await response.json();

        if (result.status !== 'success') {
            console.error("❌ Error en GS:", result.message);
            return;
        }

        const { pagos } = result.data;
        console.log(`📊 Total filas en 'pagos' de Sheets: ${pagos.length}`);

        if (pagos.length > 0) {
            console.log("\n📋 Muestra de la primera fila:");
            console.log(JSON.stringify(pagos[0], null, 2));

            console.log("\n📋 Muestra de la segunda fila:");
            console.log(JSON.stringify(pagos[1], null, 2));
        } else {
            console.log("⚠️ La pestaña 'pagos' volvió vacía.");
        }
    } catch (e) {
        console.error("❌ Error de red/parseo:", e.message);
    }
}

debugGS();
