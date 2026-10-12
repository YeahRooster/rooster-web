const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// Find where loadModels starts
const startIndex = code.indexOf('function loadModels() {');
const endIndex = code.indexOf('function loadFallbackHead() {');

if (startIndex !== -1 && endIndex !== -1) {
    const before = code.substring(0, startIndex);
    const after = code.substring(endIndex);

    const newLoadModels = `
const fileMap = {
    'head': { file: 'LeePerrySmith.glb', hex: 0xccaa99 },
    'hand': { file: 'hand.glb', hex: 0xdcb8a3 },
    'dog_skull': { file: 'dog_skull.glb', hex: 0xdddddd },
    'human_body': { file: 'human_body.glb', hex: 0xbbbbcc },
    'animal_body': { file: 'animal_body.glb', hex: 0xccccaa }
};

window.loadExtraMesh = (val) => {
    return new Promise((resolve) => {
        const info = fileMap[val];
        if (!info) return resolve(null);
        
        loadingIndicator.style.display = 'flex';
        loadingIndicator.classList.remove('hidden');
        loadingText.innerText = 'Cargando ' + info.file + '...';
        
        loader.load(info.file, (gltf) => {
            try {
                const m = gltf.scene;
                const bx = new THREE.Box3().setFromObject(m);
                const sz = bx.getSize(new THREE.Vector3());
                const ct = bx.getCenter(new THREE.Vector3());
                let maxDim = Math.max(sz.x, sz.y, sz.z);
                if (maxDim === 0 || isNaN(maxDim)) maxDim = 1;
                const s = 1.8 / maxDim;
                m.scale.setScalar(s);
                m.position.sub(ct.multiplyScalar(s));
                m.traverse((child) => {
                    if (child.isMesh) {
                        child.material.roughness = 0.6;
                        if (info.hex) child.material.color.setHex(info.hex);
                    }
                });
                scene.add(m);
                m.visible = false;
                
                if (val === 'head') headMesh = m;
                if (val === 'hand') handMesh = m;
                if (val === 'dog_skull') dogSkullMesh = m;
                if (val === 'human_body') humanBodyMesh = m;
                if (val === 'animal_body') animalBodyMesh = m;
                
                loadingIndicator.style.display = 'none';
                loadingIndicator.classList.add('hidden');
                resolve(m);
            } catch(e) {
                console.error(e);
                loadingIndicator.style.display = 'none';
                resolve(null);
            }
        }, undefined, (err) => {
            console.error(err);
            alert("No se pudo cargar " + info.file + " porque no existe en la carpeta o el archivo es invalido.");
            loadingIndicator.style.display = 'none';
            loadingIndicator.classList.add('hidden');
            resolve(null);
        });
    });
};

function loadModels() {
    loadingText.innerText = 'Cargando Calavera Anatómica 3D...';
    loader.load('ScatteringSkull.glb', (gltf) => {
        skullMesh = gltf.scene;
        const box = new THREE.Box3().setFromObject(skullMesh);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const scale = 1.8 / Math.max(size.x, size.y, size.z);
        skullMesh.scale.setScalar(scale);
        skullMesh.position.sub(center.multiplyScalar(scale));
        skullMesh.traverse((child) => {
            if (child.isMesh) {
                child.material.roughness = 0.45;
                child.material.metalness = 0.05;
            }
        });
        scene.add(skullMesh);
        skullMesh.visible = true;
        currentActiveMesh = skullMesh;

        loadingIndicator.style.display = 'none';
        loadingIndicator.classList.add('hidden');
        updateAnglesFromCamera();
        fetchDataset();
    }, undefined, (err) => {
        loadFallbackHead();
    });
}
`;

    // Now fix the change listener
    let codeModified = before + newLoadModels + after;
    
    // Rewrite the change listener
    const changeRegex = /modelSelector\.addEventListener\('change', \(e\) => \{[\s\S]*?filterGallery\(\);\s*\}\);/s;
    const newChangeListener = `modelSelector.addEventListener('change', async (e) => {
    const val = e.target.value;
    
    // Hide all
    if (skullMesh) skullMesh.visible = false;
    if (headMesh) headMesh.visible = false;
    if (handMesh) handMesh.visible = false;
    if (dogSkullMesh) dogSkullMesh.visible = false;
    if (humanBodyMesh) humanBodyMesh.visible = false;
    if (animalBodyMesh) animalBodyMesh.visible = false;

    // Load if missing
    let targetMesh = null;
    if (val === 'skull') targetMesh = skullMesh;
    else if (val === 'head' && headMesh) targetMesh = headMesh;
    else if (val === 'hand' && handMesh) targetMesh = handMesh;
    else if (val === 'dog_skull' && dogSkullMesh) targetMesh = dogSkullMesh;
    else if (val === 'human_body' && humanBodyMesh) targetMesh = humanBodyMesh;
    else if (val === 'animal_body' && animalBodyMesh) targetMesh = animalBodyMesh;
    else if (val !== 'skull') {
        targetMesh = await window.loadExtraMesh(val);
    }

    if (targetMesh) {
        targetMesh.visible = true;
        currentActiveMesh = targetMesh;
        updateAnglesFromCamera();
    } else {
        modelSelector.value = 'skull';
        if (skullMesh) {
            skullMesh.visible = true;
            currentActiveMesh = skullMesh;
        }
    }

    if (val === 'dog_skull' || val === 'animal_body') {
        const pillsHtml = \`
            <button class="pill-btn active" data-filter="all">Todos los Animales</button>
            <button class="pill-btn" data-filter="perros">Perros</button>
            <button class="pill-btn" data-filter="gatos">Gatos</button>
            <button class="pill-btn" data-filter="salvajes">Salvajes</button>
        \`;
        filterPills.innerHTML = pillsHtml;
    } else {
        const pillsHtml = \`
            <button class="pill-btn active" data-filter="all">Todas las Personas</button>
            <button class="pill-btn" data-filter="mujeres">Mujeres</button>
            <button class="pill-btn" data-filter="hombres">Hombres</button>
            <button class="pill-btn" data-filter="ancianos">Ancianos</button>
            <button class="pill-btn" data-filter="ninos">Niños</button>
        \`;
        filterPills.innerHTML = pillsHtml;
    }
    
    document.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        ev.target.classList.add('active');
        state.activeFilter = ev.target.dataset.filter;
        filterGallery();
      });
    });
    
    state.activeFilter = 'all';
    filterGallery();
});`;

    codeModified = codeModified.replace(changeRegex, newChangeListener);
    fs.writeFileSync('app.js', codeModified);
    console.log('Fixed lazy load successfully!');
} else {
    console.log('Could not find loadModels indices');
}
