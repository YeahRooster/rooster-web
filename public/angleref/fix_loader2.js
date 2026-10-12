const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

const regex = /scene\.add\(skullMesh\);\s*currentActiveMesh = skullMesh;\s*loadingIndicator\.classList\.add\('hidden'\);\s*updateAnglesFromCamera\(\);\s*filterGallery\(\);\s*\},/s;

const newLogic = `scene.add(skullMesh);
        skullMesh.visible = true;

        loadingText.innerText = 'Cargando modelos adicionales...';
        
        const loadExtra = (filename, colorHex) => {
            return new Promise((resolve) => {
                loader.load(filename, (gltf) => {
                    const m = gltf.scene;
                    const bx = new THREE.Box3().setFromObject(m);
                    const sz = bx.getSize(new THREE.Vector3());
                    const ct = bx.getCenter(new THREE.Vector3());
                    const s = 1.8 / Math.max(sz.x, sz.y, sz.z);
                    m.scale.setScalar(s);
                    m.position.sub(ct.multiplyScalar(s));
                    m.traverse((child) => {
                        if (child.isMesh) {
                            child.material.roughness = 0.6;
                            if (colorHex) child.material.color.setHex(colorHex);
                        }
                    });
                    scene.add(m);
                    m.visible = false;
                    resolve(m);
                }, undefined, (err) => {
                    console.warn("No se encontró " + filename);
                    resolve(null);
                });
            });
        };

        Promise.all([
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
            animalBodyMesh = results[4];
            
            loadingIndicator.style.display = 'none';
            updateAnglesFromCamera();
            filterGallery();
        });
      },`;

if (regex.test(code)) {
    code = code.replace(regex, newLogic);
    fs.writeFileSync('app.js', code);
    console.log("Fixed loadModels successfully!");
} else {
    console.log("Regex still didn't match.");
}
