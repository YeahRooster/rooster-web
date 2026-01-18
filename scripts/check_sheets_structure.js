const fetch = require('node-fetch');

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxWIAakwf_zVWTsSSEzUC38LRUAJYckfFXbrMwBh137DsFCnZfkRexPBAsYB7l8Nzgz/exec';

async function check() {
    console.log("📥 Descargando datos crudos...");
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=dumpAll`);
    const data = await response.json();

    const pagos = data.data.pagos;
    console.log(`Filas encontradas: ${pagos.length}`);

    // Imprimir primeras 3 filas completas
    pagos.slice(0, 3).forEach((fila, i) => {
        console.log(`\n--- FILA ${i + 1} ---`);
        fila.forEach((val, idx) => {
            console.log(`[${idx}] ${val}`);
        });
    });
}
check();
