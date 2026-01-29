const fetch = require('node-fetch');

async function testApi() {
    const dni = '1234';
    const url = `http://localhost:3000/api/v2/payments/suggest-amount?alumno_dni=${dni}&metodo_pago=TRANSFERENCIA`;
    console.log('Probando URL:', url);

    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log('Respuesta API:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error:', err);
    }
}

testApi();
