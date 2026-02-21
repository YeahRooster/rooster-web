const fs = require('fs');
const path = require('path');

// Mapeo de archivos temporales a nombres finales
const avatarFiles = [
    { temp: 'C:/Users/Usuario/.gemini/antigravity/brain/tempmediaStorage/media__1770962812980.jpg', name: 'nino.png' },
    { temp: 'C:/Users/Usuario/AppData/Local/Temp/tmp-7761-zUmK1Iy3ytsW', name: 'nina.png' },
    { temp: 'C:/Users/Usuario/AppData/Local/Temp/tmp-7761-q1m1Hru0tPLs', name: 'hombre.png' },
    { temp: 'C:/Users/Usuario/AppData/Local/Temp/tmp-7761-mV6MjG1ytR0e', name: 'mujer.png' },
    { temp: 'C:/Users/Usuario/AppData/Local/Temp/tmp-7761-1eVBBYOqWWf7', name: 'gallo.png' },
    { temp: 'C:/Users/Usuario/AppData/Local/Temp/tmp-7761-MuKqwSDXgGaw', name: 'gallina.png' }
];

const destDir = path.join(__dirname, 'public', 'avatars');

// Crear directorio si no existe
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    console.log('✅ Directorio creado:', destDir);
}

// Copiar cada archivo
let successCount = 0;
avatarFiles.forEach(({ temp, name }) => {
    const destFile = path.join(destDir, name);
    try {
        if (fs.existsSync(temp)) {
            fs.copyFileSync(temp, destFile);
            console.log(`✅ ${name} copiado exitosamente`);
            successCount++;
        } else {
            console.log(`⚠️  ${name} - archivo temporal no encontrado: ${temp}`);
        }
    } catch (error) {
        console.error(`❌ Error copiando ${name}:`, error.message);
    }
});

console.log(`\n🎉 Total: ${successCount}/6 avatares copiados exitosamente`);
