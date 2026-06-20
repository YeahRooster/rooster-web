const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyC0J3TAwWOXT3K-nSAgbn5wmLCGav6q4VhZWPBRdbUk0hSAMDI3zcu3ppoafmEMWgN/exec';

async function debugExcel() {
    const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=dumpAll`);
    const data = await res.json();
    console.log("Primeros 5 alumnos:", data.data.alumnos.slice(0, 5));
}
debugExcel();
