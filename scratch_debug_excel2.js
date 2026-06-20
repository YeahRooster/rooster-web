const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyC0J3TAwWOXT3K-nSAgbn5wmLCGav6q4VhZWPBRdbUk0hSAMDI3zcu3ppoafmEMWgN/exec';

async function debugExcel() {
    const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=dumpAll`);
    const data = await res.json();
    const alumnos = data.data.alumnos;
    
    // Buscar un alumno que parezca tener telefono (algo que empiece con 15, 342, 11, etc y que no sea su DNI)
    for(const a of alumnos) {
        if(a.some(col => String(col).length > 9 && String(col).startsWith('3'))) {
            console.log("Alumno con posible telefono:", a);
            break;
        }
    }
}
debugExcel();
