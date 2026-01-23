const fetch = require('node-fetch');

async function testApi() {
    const url = 'http://localhost:3000/api/v2/workshops'; // Asumiendo que está corriendo localmente
    console.log(`📡 Llamando a: ${url}`);

    try {
        const res = await fetch(url);
        const data = await res.json();

        console.log(`📊 Respuesta recibida: ${Array.isArray(data) ? data.length : 'No es un array'} elementos`);

        if (Array.isArray(data)) {
            const conteo = {};
            data.forEach(w => {
                conteo[w.title] = (conteo[w.title] || 0) + 1;
            });

            console.log("\n📈 Desglose por título:");
            Object.entries(conteo).forEach(([titulo, cant]) => {
                console.log(`- ${titulo}: ${cant} registros`);
            });

            // Ver si hay IDs duplicados en la respuesta
            const ids = data.map(w => w.id);
            const uniquelyIds = new Set(ids);
            if (ids.length !== uniquelyIds.size) {
                console.log(`⚠️ ALERTA: Hay IDs duplicados en la respuesta de la API (${ids.length - uniquelyIds.size} duplicados)`);
            }
        }
    } catch (e) {
        console.error("❌ Error conectando a la API. Asegúrate de que el servidor esté corriendo (npm run dev).", e.message);
    }
}

testApi();
