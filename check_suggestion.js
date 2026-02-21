async function checkSuggestion(dni) {
    console.log(`💰 Verificando sugerencia de pago para DNI: ${dni}`);
    try {
        const res = await fetch(`http://localhost:3000/api/v2/payments/suggest-amount?alumno_dni=${dni}`);
        const data = await res.json();
        console.log("✅ Sugerencia:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkSuggestion('54989452'); // Eva
