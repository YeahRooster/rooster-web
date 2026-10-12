const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// Declare new meshes at the top
code = code.replace(
    'let skullMesh, headMesh;',
    'let skullMesh, headMesh, dogSkullMesh, humanBodyMesh, animalBodyMesh;'
);

const injected = `
      scene.add(skullMesh);
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
                  console.warn("No se encontró " + filename + ". Podrás subirlo después.");
                  resolve(null);
              });
          });
      };

      Promise.all([
          loadExtra('LeePerrySmith.glb', 0xccaa99),
          loadExtra('dog_skull.glb', 0xdddddd),
          loadExtra('human_body.glb', 0xbbbbcc),
          loadExtra('animal_body.glb', 0xccccaa)
      ]).then((results) => {
          headMesh = results[0];
          dogSkullMesh = results[1];
          humanBodyMesh = results[2];
          animalBodyMesh = results[3];
          
          loadingIndicator.style.display = 'none';
          updateAnglesFromCamera();
          fetchDataset();
      });
`;

code = code.replace(/scene\.add\(skullMesh\);\s*skullMesh\.visible = true;.*?(?=},\s*undefined,\s*\(error\))/s, injected);

const selectorRegex = /modelSelector\.addEventListener\('change', \(e\) => \{.*?(?=\}\);)/s;
const newSelectorLogic = `modelSelector.addEventListener('change', (e) => {
    const val = e.target.value;
    if (skullMesh) skullMesh.visible = (val === 'skull');
    if (headMesh) headMesh.visible = (val === 'head');
    if (dogSkullMesh) dogSkullMesh.visible = (val === 'dog_skull');
    if (humanBodyMesh) humanBodyMesh.visible = (val === 'human_body');
    if (animalBodyMesh) animalBodyMesh.visible = (val === 'animal_body');

    // Cambiar los filtros demográficos según el tipo de referencia
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
    
    // Reattach events
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
  `;

code = code.replace(selectorRegex, newSelectorLogic);

fs.writeFileSync('app.js', code);
