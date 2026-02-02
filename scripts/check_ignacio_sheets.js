const fetch = require('node-fetch');

async function checkSheets() {
    const url = 'https://script.google.com/macros/s/AKfycbyC0J3TAwWOXT3K-nSAgbn5wmLCGav6q4VhZWPBRdbUk0hSAMDI3zcu3ppoafmEMWgN/exec?action=dumpAll';
    console.log('Consultando Sheets...');
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'success') {
        console.error('Error:', data.message);
        return;
    }

    const dni = '43425198';

    console.log('\n--- ALUMNOS ---');
    console.log(data.data.alumnos.find(a => String(a[0]) === dni));

    console.log('\n--- INSCRIPCIONES ---');
    console.log(data.data.inscripciones.filter(i => String(i[1]) === dni));

    console.log('\n--- PAGOS ---');
    console.log(data.data.pagos.filter(p => String(p[0]) === dni));
}

checkSheets();
