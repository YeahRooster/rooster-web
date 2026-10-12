const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

code = code.replace(
    /const loadExtra = async \(filename, colorHex\) => \{[\s\S]*?return new Promise\(\(resolve\) => \{[\s\S]*?loader\.load\(filename, \(gltf\) => \{[\s\S]*?\}, undefined, \(err\) => \{[\s\S]*?resolve\(null\);\s*\}\);\s*\}\);\s*\};/s,
    `const loadExtra = async (filename, colorHex) => {
            try {
                const res = await fetch(filename, { method: 'HEAD' });
                if (!res.ok) {
                    return null;
                }
            } catch(e) {
                return null;
            }

            return new Promise((resolve) => {
                loadingText.innerText = 'Descargando ' + filename + '...';
                loader.load(filename, (gltf) => {
                    try {
                        const m = gltf.scene;
                        const bx = new THREE.Box3().setFromObject(m);
                        const sz = bx.getSize(new THREE.Vector3());
                        const ct = bx.getCenter(new THREE.Vector3());
                        
                        let maxDim = Math.max(sz.x, sz.y, sz.z);
                        if (maxDim === 0 || isNaN(maxDim)) maxDim = 1; // Prevent Infinity
                        
                        const s = 1.8 / maxDim;
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
                    } catch(e) {
                        resolve(null);
                    }
                }, undefined, (err) => {
                    resolve(null);
                });
            });
        };`
);

fs.writeFileSync('app.js', code);
