require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwkhRWNT4Iwp5r5YsMESXDTY9T8wGdXRwBtzYQ5K9IDwJN295EupvX4LDrAaBk1HvUS/exec';

async function checkRecursos() {
    console.log("📥 Extrayendo dump para ver recursos...");
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=dumpAll`);
    const data = await response.json();

    if (data.status === 'success') {
        const { recursos } = data.data;
        console.log(`📂 Recursos encontrados en el dump: ${recursos?.length || 0}`);
        if (recursos && recursos.length > 0) {
            console.log("Primer recurso:", JSON.stringify(recursos[0], null, 2));
        }
    } else {
        console.error("Error:", data.message);
    }
}

checkRecursos();
