const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

if (!code.includes('let skullMesh, headMesh, handMesh')) {
    code = code.replace(
        'let skullMesh, headMesh, dogSkullMesh, humanBodyMesh, animalBodyMesh;',
        'let skullMesh, headMesh, handMesh, dogSkullMesh, humanBodyMesh, animalBodyMesh;'
    );
    
    code = code.replace(
        `Promise.all([
          loadExtra('LeePerrySmith.glb', 0xccaa99),
          loadExtra('dog_skull.glb', 0xdddddd),
          loadExtra('human_body.glb', 0xbbbbcc),
          loadExtra('animal_body.glb', 0xccccaa)
      ]).then((results) => {
          headMesh = results[0];
          dogSkullMesh = results[1];
          humanBodyMesh = results[2];
          animalBodyMesh = results[3];`,
        `Promise.all([
          loadExtra('LeePerrySmith.glb', 0xccaa99),
          loadExtra('hand.glb', 0xdcb8a3),
          loadExtra('dog_skull.glb', 0xdddddd),
          loadExtra('human_body.glb', 0xbbbbcc),
          loadExtra('animal_body.glb', 0xccccaa)
      ]).then((results) => {
          headMesh = results[0];
          handMesh = results[1];
          dogSkullMesh = results[2];
          humanBodyMesh = results[3];
          animalBodyMesh = results[4];`
    );

    code = code.replace(
        "if (headMesh) headMesh.visible = (val === 'head');",
        "if (headMesh) headMesh.visible = (val === 'head');\n    if (handMesh) handMesh.visible = (val === 'hand');"
    );

    fs.writeFileSync('app.js', code);
}
