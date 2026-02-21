async function triggerSync() {
    console.log("🚀 Disparando sincronización forzada...");
    try {
        const res = await fetch('http://localhost:3000/api/v2/admin/sync', {
            method: 'POST'
        });
        const data = await res.json();
        console.log("✅ Resultado sync:", data);
    } catch (e) {
        console.error("Error al disparar sync:", e.message);
    }
}

triggerSync();
