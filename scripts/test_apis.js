const fetch = require('node-fetch');

async function testAPIs() {
    console.log("🧪 Testeando APIs v2 localmente...");

    try {
        // En un entorno de desarrollo, el servidor corre en localhost:3000
        const baseUrl = 'http://localhost:3000';

        console.log(`\n1. Probando /api/v2/workshops...`);
        const resW = await fetch(`${baseUrl}/api/v2/workshops`);
        const workshops = await resW.json();
        console.log(`Talleres recibidos: ${Array.isArray(workshops) ? workshops.length : 'ERROR'}`);
        if (Array.isArray(workshops) && workshops.length > 0) {
            console.log("Primer taller:", JSON.stringify(workshops[0], null, 2));
        } else {
            console.log("Respuesta API Talleres:", JSON.stringify(workshops, null, 2));
        }

    } catch (err) {
        console.log("❌ Error testeando APIs (Probablemente el servidor no está corriendo en localhost:3000):", err.message);
        console.log("💡 Esto es normal si no tengo el server levantado, pero intentaré verificar por qué la API podría fallar.");
    }
}

testAPIs();
