const fetch = require('node-fetch');

async function testFeatureAPI() {
    console.log('🧪 PROBANDO API DE DESTACAR OBRAS...\n');

    // 1. Intentar destacar el post ID 2
    try {
        console.log('📤 Intentando destacar post ID 2...');
        const res = await fetch('http://localhost:3000/api/v2/gallery/feature', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ post_id: 2, featured: true })
        });

        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Respuesta:', JSON.stringify(data, null, 2));

        if (data.status === 'success') {
            console.log('\n✅ API respondió correctamente');
        } else {
            console.log('\n❌ ERROR:', data.message);
        }
    } catch (error) {
        console.log('\n❌ ERROR DE CONEXIÓN:', error.message);
    }

    // 2. Verificar el GET endpoint
    console.log('\n\n📥 Probando GET featured posts...');
    try {
        const res = await fetch('http://localhost:3000/api/v2/gallery/feature');
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Respuesta:', JSON.stringify(data, null, 2).substring(0, 500));
    } catch (error) {
        console.log('❌ ERROR:', error.message);
    }
}

testFeatureAPI();
