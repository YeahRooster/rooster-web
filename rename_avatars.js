const fs = require('fs');
const path = require('path');

const avatarsDir = path.join(__dirname, 'public', 'avatars');

const mappings = {
    'Gemini_Generated_Image_btzu72btzu72btzu.png': 'nina.png',
    'Gemini_Generated_Image_ihafzzihafzzihaf.png': 'gallo.png',
    'Gemini_Generated_Image_knpcp0knpcp0knpc.png': 'gallina.png',
    'Gemini_Generated_Image_or6f0por6f0por6f.png': 'hombre.png',
    'Gemini_Generated_Image_pykf57pykf57pykf.png': 'mujer.png',
    'Gemini_Generated_Image_uzeneduzeneduzen.png': 'nino.png'
};

Object.entries(mappings).forEach(([oldName, newName]) => {
    const oldPath = path.join(avatarsDir, oldName);
    const newPath = path.join(avatarsDir, newName);

    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`Renamed ${oldName} to ${newName}`);
    } else {
        console.log(`File not found: ${oldName}`);
    }
});
