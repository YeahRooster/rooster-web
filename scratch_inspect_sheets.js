const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyC0J3TAwWOXT3K-nSAgbn5wmLCGav6q4VhZWPBRdbUk0hSAMDI3zcu3ppoafmEMWgN/exec';

async function inspectSheets() {
    const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=dumpAll`);
    const data = await res.json();
    console.log("Keys in result.data:", Object.keys(data.data));
    
    if (data.data.inscripciones && data.data.inscripciones.length > 0) {
        console.log("\nMuestra inscripcion:", data.data.inscripciones[0]);
    }
    if (data.data.pagos && data.data.pagos.length > 0) {
        console.log("\nMuestra pago:", data.data.pagos[0]);
        console.log("Muestra pago 2:", data.data.pagos[1]);
    }
    if (data.data.profesores && data.data.profesores.length > 0) {
        console.log("\nMuestra profesor:", data.data.profesores[0]);
    }
}
inspectSheets();
