const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

if (!code.includes('let dogSkullMesh = null;')) {
    code = code.replace(
        'let headMesh = null;',
        'let headMesh = null;\nlet handMesh = null;\nlet dogSkullMesh = null;\nlet humanBodyMesh = null;\nlet animalBodyMesh = null;'
    );
    fs.writeFileSync('app.js', code);
    console.log("Added missing variables");
}
