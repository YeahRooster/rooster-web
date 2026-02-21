const fetch = require('node-fetch');

async function testAPI() {
    console.log('🔍 PROBANDO API DE GALERÍA...\n');

    try {
        const res = await fetch('http://localhost:3000/api/social/posts?status=active');
        console.log('Status Code:', res.status);
        console.log('Headers:', res.headers.raw());

        const text = await res.text();
        console.log('\n📄 RESPUESTA CRUDA:');
        console.log(text.substring(0, 500)); // Primeros 500 caracteres

        // Intentar parsear como JSON
        try {
            const json = JSON.parse(text);
            console.log('\n✅ JSON VÁLIDO');
            console.log('Status:', json.status);

            if (json.data) {
                console.log('Cantidad de posts:', json.data.length);
                if (json.data.length > 0) {
                    console.log('\n📸 PRIMER POST:');
                    console.log(JSON.stringify(json.data[0], null, 2));
                }
            } else if (json.error || json.message) {
                console.log('❌ ERROR EN RESPUESTA:', json.message || json.error);
            }
        } catch (e) {
            console.log('\n❌ NO ES JSON VÁLIDO:', e.message);
        }

    } catch (error) {
        console.log('❌ ERROR DE CONEXIÓN:', error.message);
    }
}

testAPI();
