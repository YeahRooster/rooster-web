const fs = require('fs');

// 1. Swap URLs for Anciana 80 años in faces-dataset.json to fix the single inverted outlier
const dbPath = 'faces-dataset.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const anciana90 = db.find(x => x.id === 8);
const ancianaMinus90 = db.find(x => x.id === 13);

if (anciana90 && ancianaMinus90) {
  const tempUrl = anciana90.url;
  const tempFullUrl = anciana90.fullUrl;
  
  anciana90.url = ancianaMinus90.url;
  anciana90.fullUrl = ancianaMinus90.fullUrl;
  
  ancianaMinus90.url = tempUrl;
  ancianaMinus90.fullUrl = tempFullUrl;

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  console.log('Swapped Anciana 80 years URLs successfully!');
}

// 2. Fix Yaw direction in app.js
let js = fs.readFileSync('app.js', 'utf8');

// In updateAnglesFromCamera, negate yaw calculation so screen-right is positive and screen-left is negative
js = js.replace(
  /let yawRad = Math\.atan2\(camPos\.x, camPos\.z\);/,
  'let yawRad = -Math.atan2(camPos.x, camPos.z);'
);

// In setCameraPreset, negate yawDeg so clicking "Perfil Der" positions camera to view the model facing RIGHT on screen
js = js.replace(
  /const yawRad = THREE\.MathUtils\.degToRad\(yawDeg\);/,
  'const yawRad = THREE.MathUtils.degToRad(-yawDeg);'
);

fs.writeFileSync('app.js', js);
console.log('Fixed Yaw directionality in app.js successfully!');
