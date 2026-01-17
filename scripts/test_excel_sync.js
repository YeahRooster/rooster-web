const fetch = require('node-fetch');

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzIygSzWDhILfypJMRnHTkThFzHEx1Ex0ZjJKJq9PvnCXfmg9N40LbDKhCd1v3BzDc6/exec';

async function testSync() {
    console.log("🧪 Probando sincronización con Excel...");
    try {
        const res = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'updateStatus',
                dni: '123',
                status: 'ACTIVO'
            })
        });

        const raw = await res.text();
        console.log("📄 Respuesta RAW:", raw);

        try {
            const json = JSON.parse(raw);
            console.log("✅ Respuesta JSON:", json);
        } catch (e) {
            console.log("⚠️ No es JSON, pero la petición se envió.");
        }
    } catch (error) {
        console.error("❌ Error en el test:", error);
    }
}

testSync();
