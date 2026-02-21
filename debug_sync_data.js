const { GOOGLE_SCRIPT_URL } = require('./config/google_script');

async function debugRawData() {
    console.log("🔗 Conectando con Google Script:", GOOGLE_SCRIPT_URL);
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=dumpAll`);
        const result = await response.json();

        if (result.status !== 'success') {
            console.error("Error:", result.message);
            return;
        }

        const { alumnos, inscripciones, pagos } = result.data;

        console.log("\n📌 Muestra ALUMNOS (primeros 3):");
        alumnos.slice(0, 3).forEach((row, i) => console.log(`Fila ${i}:`, JSON.stringify(row)));

        console.log("\n📌 Muestra INSCRIPCIONES (primeros 3):");
        inscripciones.slice(0, 3).forEach((row, i) => console.log(`Fila ${i}:`, JSON.stringify(row)));

        console.log("\n📌 Muestra PAGOS (primeros 3):");
        pagos.slice(0, 3).forEach((row, i) => console.log(`Fila ${i}:`, JSON.stringify(row)));

    } catch (error) {
        console.error("Error fatal:", error.message);
    }
}

debugRawData();
