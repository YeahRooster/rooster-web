const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyC0J3TAwWOXT3K-nSAgbn5wmLCGav6q4VhZWPBRdbUk0hSAMDI3zcu3ppoafmEMWgN/exec';

async function inspect() {
    const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=dumpAll`);
    const data = await res.json();
    const alumnos = data.data.alumnos;
    console.log(`Total alumnos en Sheet: ${alumnos.length}`);
    
    // Veamos los primeros 30 alumnos
    console.log("\nPrimeros 30 alumnos (DNI, Nombre, Col2, Col3, Col4, Col5, Col6, Col7):");
    alumnos.slice(0, 30).forEach((a, idx) => {
        console.log(`[${idx}] DNI: ${a[0]} | Nom: ${a[1]} | C2: ${a[2]} | C3: ${a[3]} | C4: ${a[4]} | C5: ${a[5]} | C6: ${a[6]} | C7: ${a[7]}`);
    });
}
inspect();
