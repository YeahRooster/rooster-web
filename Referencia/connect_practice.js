const fs = require('fs');

let js = fs.readFileSync('app.js', 'utf8');

// 1. Add import
if (!js.includes("import { setupPracticeTool } from './practice.js';")) {
  js = js.replace(
    "import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';",
    "import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';\nimport { setupPracticeTool } from './practice.js';"
  );
}

// 2. Add setupPracticeTool call in DOMContentLoaded
if (!js.includes("setupPracticeTool(state, getItemType);")) {
  js = js.replace(
    "loadDataset();",
    "loadDataset();\n  setupPracticeTool(state, getItemType);"
  );
}

fs.writeFileSync('app.js', js);
console.log('Successfully connected practice.js into app.js!');
