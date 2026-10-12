const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

code = code.replace(
    /const loadExtra = async \(filename, colorHex\) => \{/g,
    `const loadExtra = async (filename, colorHex) => {
            loadingText.innerText = 'Cargando ' + filename + '...';`
);

fs.writeFileSync('app.js', code);
