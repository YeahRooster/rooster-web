const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// 1. Force white clay material and fix scale in loadExtraMesh
code = code.replace(
    /m\.traverse\(\(child\) => \{[\s\S]*?\}\);\s*scene\.add\(m\);/,
    `m.traverse((child) => {
                    if (child.isMesh) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: info.hex ? info.hex : 0xffffff,
                            roughness: 0.7,
                            metalness: 0.05
                        });
                    }
                });
                
                // Si es de cuerpo completo, lo achicamos un poco extra para que entre perfecto
                if (val === 'human_body' || val === 'animal_body') {
                    m.scale.multiplyScalar(0.7);
                }
                
                scene.add(m);`
);

fs.writeFileSync('app.js', code);
