const fs = require('fs');
let code = fs.readFileSync('app/comunidad/nuevo/page.js', 'utf8');

if (!code.includes("editContent.replace(/&nbsp;/g, ' ')")) {
    code = code.replace(
        'contenido: editContent,',
        "contenido: editContent.replace(/&nbsp;/g, ' '), // Prevenir problemas de copy-paste con espacios duros"
    );
    fs.writeFileSync('app/comunidad/nuevo/page.js', code);
}
