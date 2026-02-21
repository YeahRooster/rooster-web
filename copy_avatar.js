// Script temporal para copiar la imagen de avatar
const fs = require('fs');
const path = require('path');

const tempImage = 'C:\\Users\\Usuario\\AppData\\Local\\Temp\\tmp-7736-Xwgvg3u6ySH5';
const destDir = path.join(__dirname, 'public', 'avatars');
const destFile = path.join(destDir, 'mujer.png');

// Crear directorio si no existe
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    console.log('✅ Directorio creado:', destDir);
}

// Copiar archivo
try {
    fs.copyFileSync(tempImage, destFile);
    console.log('✅ Imagen copiada exitosamente a:', destFile);
} catch (error) {
    console.error('❌ Error:', error.message);
}
