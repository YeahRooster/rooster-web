const fs = require('fs');

// 1. index.html: quitar el icono del boton
let html = fs.readFileSync('index.html', 'utf8');
const before = html.length;
html = html.replace(/(<button id="btnSearchFaces"[^>]*>)\s*<span class="icon">[\s\S]*?<\/span>/, '$1');
fs.writeFileSync('index.html', html);
console.log('Icono eliminado:', before !== html.length);

// 2. app.js
let js = fs.readFileSync('app.js', 'utf8');

// 2a. Quitar renglon de autor en tarjetas
js = js.replace(/\s*<span class="ref-author">\$\{item\.author \|\| item\.source\}<\/span>/, '');

// 2b. Girar el craneo de perro 180 grados (antes de calcular la caja, para que quede centrado)
if (!js.includes("if (val === 'dog_skull') m.rotation.y = Math.PI;")) {
  js = js.replace(
    /(const m = gltf\.scene;\r?\n)(\s*)(const bx = new THREE\.Box3\(\)\.setFromObject\(m\);)/,
    "$1$2if (val === 'dog_skull') m.rotation.y = Math.PI;\n$2$3"
  );
}

fs.writeFileSync('app.js', js);
console.log('Autor eliminado:', !js.includes('ref-author'));
console.log('Rotacion perro:', js.includes("m.rotation.y = Math.PI"));
