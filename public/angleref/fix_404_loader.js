const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// The original injected block has Promise.all.
// Let's replace the loadExtra function to pre-check if the file exists using fetch to prevent GLTFLoader crashes on 404.

const newLoadExtra = `const loadExtra = async (filename, colorHex) => {
            try {
                const res = await fetch(filename, { method: 'HEAD' });
                if (!res.ok) {
                    console.warn("No se encontró " + filename);
                    return null;
                }
            } catch(e) {
                return null;
            }

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
                    resolve(null);
                });
            });
        };`;

code = code.replace(/const loadExtra = \(filename, colorHex\) => \{.*?\}\);\s*\};\s*Promise\.all/s, newLoadExtra + '\n\n        Promise.all');

// Also remove the duplicate old LeePerrySmith loading block that I left behind by accident
const oldLeeBlock = /\/\/ 2\. Cargar LeePerrySmith\.glb en segundo plano.*?\}\);/s;
code = code.replace(oldLeeBlock, '');

fs.writeFileSync('app.js', code);
