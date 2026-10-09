const fs = require('fs');
let code = fs.readFileSync('app/api/v2/comunidad/posts/route.js', 'utf8');

if (!code.includes('const { titulo, contenido, imagenes, autor_nombre, autor_dni, autor_rol, fecha_publicacion, notificar } = body;')) {
    code = code.replace(
        'const { titulo, contenido, imagenes, autor_nombre, autor_dni, autor_rol, fecha_publicacion } = body;',
        'const { titulo, contenido, imagenes, autor_nombre, autor_dni, autor_rol, fecha_publicacion, notificar } = body;'
    );
    
    const notificationLogic = `
        if (error) throw error;

        if (notificar) {
            // Get all active students
            const { data: alumnos } = await supabaseAdmin.from('alumnos').select('dni').eq('activo', true);
            if (alumnos && alumnos.length > 0) {
                const notifications = alumnos.map(a => ({
                    destinatario_dni: a.dni,
                    actor_nombre: autor_nombre,
                    tipo: 'COMUNIDAD',
                    mensaje: \`Nuevo tema en la comunidad: "\${titulo}"\`,
                    leida: false
                }));
                // Insert in chunks
                const chunkSize = 50;
                for (let i = 0; i < notifications.length; i += chunkSize) {
                    await supabaseAdmin.from('social_notifications').insert(notifications.slice(i, i + chunkSize));
                }
            }
        }

        return NextResponse.json({ status: 'success', post: data });`;
        
    code = code.replace(
        /if \(error\) throw error;\s*return NextResponse\.json\(\{ status: 'success', post: data \}\);/,
        notificationLogic
    );
    
    fs.writeFileSync('app/api/v2/comunidad/posts/route.js', code);
}
