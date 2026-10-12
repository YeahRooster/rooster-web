const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// 1. Declare handMesh
if (!code.includes('handMesh')) {
    code = code.replace(
        'let skullMesh, headMesh, dogSkullMesh, humanBodyMesh, animalBodyMesh;',
        'let skullMesh, headMesh, handMesh, dogSkullMesh, humanBodyMesh, animalBodyMesh;'
    );
    
    // 2. Load hand.glb
    code = code.replace(
        "loadExtra('LeePerrySmith.glb', 0xccaa99),",
        "loadExtra('LeePerrySmith.glb', 0xccaa99),\n          loadExtra('hand.glb', 0xccaacc),"
    );
    
    // 3. Assign result
    code = code.replace(
        "headMesh = results[0];",
        "headMesh = results[0];\n          handMesh = results[1];" // Wait, I need to shift the indices of results carefully.
    );
}

fs.writeFileSync('patch_hand_app.js', '/* will write safer logic here */');
