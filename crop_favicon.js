const sharp = require('sharp');

const imgPath = 'C:/Users/Usuario/.gemini/antigravity/brain/938bca05-0c9c-413f-b6f3-ee895def9f13/.user_uploaded/media_1791090710070.png';
const outPath = 'app/icon.png';

async function run() {
    try {
        const trimmed = await sharp(imgPath).trim().toBuffer();
        const trimmedMeta = await sharp(trimmed).metadata();
        
        console.log("Trimmed dimensions:", trimmedMeta.width, trimmedMeta.height);
        
        // Let's crop a square from the left of the trimmed image
        // We'll give it a little bit of padding so the "R" doesn't touch the edges completely
        const side = Math.min(trimmedMeta.width, trimmedMeta.height);
        
        await sharp(trimmed)
            .extract({ left: 0, top: 0, width: Math.floor(side * 0.9), height: side }) // Taking a slightly narrower slice since the R itself is narrower than the full height sometimes, or we just take the left square.
            .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toFile(outPath);
            
        console.log("Saved icon to", outPath);
    } catch (e) {
        console.error("Error processing image:", e);
    }
}
run();
