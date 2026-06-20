const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyC0J3TAwWOXT3K-nSAgbn5wmLCGav6q4VhZWPBRdbUk0hSAMDI3zcu3ppoafmEMWgN/exec';

async function debugExcel() {
    const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=dumpAll`);
    const data = await res.json();
    const alumnos = data.data.alumnos;
    
    let count = 0;
    for(const a of alumnos) {
        if(String(a[3]).length > 8 && !String(a[3]).includes('alu') && !String(a[3]).includes('a')) {
            console.log("Alumno con telefono limpio:", a);
            count++;
            if(count > 2) break;
        }
    }
}
debugExcel();
