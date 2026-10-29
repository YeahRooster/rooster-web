
function getItemType(item) {
  const text = (item.title + ' ' + (item.author || '') + ' ' + (item.category || '')).toLowerCase();

  const isAnimal = (
    text.includes('perro') || text.includes('gato') || text.includes('león') || text.includes('leon') || 
    text.includes('tigre') || text.includes('caballo') || text.includes('lobo') || text.includes('animal') || 
    text.includes('pantera') || 
    text.includes('salvaje') || text.includes('cachorro') || text.includes('zorro') || text.includes('chimpancé') || 
    text.includes('chimpance') || text.includes('mono') || text.includes('gorila') || text.includes('felino') || 
    text.includes('canino') || text.includes('cuadrupedo') || text.includes('cuadrúpedo') || text.includes('oso') || 
    text.includes('ciervo') || text.includes('elefante') || text.includes('jirafa') || text.includes('perezoso') || 
    text.includes('mofeta') || text.includes('cebra') || text.includes('panda') || text.includes('rinoceronte') || 
    text.includes('ave') || text.includes('pájaro') || text.includes('pajaro') || text.includes('reptil') || 
    text.includes('yacaré') || text.includes('yacare') || text.includes('águila') || text.includes('aguila') ||
    text.includes('cocodrilo') || text.includes('búho') || text.includes('buho') || text.includes('canguro')
  );

  const isFullBody = (text.includes('cuerpo completo') || text.includes('cuerpo entero') || text.includes('full body') || text.includes('figura completa') || text.includes('de pie') || text.includes('entero'));

  if (isAnimal) {
    return isFullBody ? 'animal_body' : 'animal_head';
  }

  // Verificar manos ÚNICAMENTE cuando no es animal
  if (text.includes('mano') || text.includes('puño') || text.includes('palma') || text.includes('dedo')) {
    return 'hand';
  }

  if (isFullBody) return 'human_body';
  return 'human_head';
}

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { setupPracticeTool } from './practice.js?v=20261015m1';
import { AccessControl } from './access.js?v=20261015m1';

// Application State
const state = {
  yaw: 0,       // Horizontal rotation in degrees (-180 to 180)
  pitch: 0,     // Vertical angle in degrees (-90 to 90)
  roll: 0,      // Tilt in degrees
  dataset: [],
  onlineResults: [],
  tolerance: 25,
  autoSync: true,
  currentModel: 'skull',
  lastTrackedYaw: 0,
  lastTrackedPitch: 0,
  
  // Artist Studio Lightbox State
  zoom: 100,
  rotation: 0,
  isFlipped: false,
  isGrayscale: false,
  isGridActive: false,
  isNotan: false,
  brightness: 100,
  contrast: 100,
  saturation: 100,

  // Demographic & Search Filters
  demographicFilter: 'all',
  searchQuery: ''
};

// DOM Elements
const canvasContainer = document.getElementById('canvasContainer');
const loadingIndicator = document.getElementById('loadingIndicator');
const loadingText = document.getElementById('loadingText');
const valYaw = document.getElementById('valYaw');
const valPitch = document.getElementById('valPitch');
const valRoll = document.getElementById('valRoll');
const lblYawDesc = document.getElementById('lblYawDesc');
const lblPitchDesc = document.getElementById('lblPitchDesc');
const galleryGrid = document.getElementById('galleryGrid');
const galleryStatus = document.getElementById('galleryStatus');
const filterTolerance = document.getElementById('filterTolerance');
const chkAutoSync = document.getElementById('chkAutoSync');
const btnSearchFaces = document.getElementById('btnSearchFaces');
const modelSelector = document.getElementById('modelSelector');

// Presets & Controls buttons
const btnPresetFront = document.getElementById('btnPresetFront');
const btnPreset34L = document.getElementById('btnPreset34L');
const btnPreset34R = document.getElementById('btnPreset34R');
const btnPresetProfileL = document.getElementById('btnPresetProfileL');
const btnPresetProfileR = document.getElementById('btnPresetProfileR');
const btnPresetLowAngle = document.getElementById('btnPresetLowAngle');
const btnPresetHighAngle = document.getElementById('btnPresetHighAngle');
const btnPresetBack34L = document.getElementById('btnPresetBack34L');
const btnPresetBack34 = document.getElementById('btnPresetBack34');
const btnPresetBack = document.getElementById('btnPresetBack');
const btnResetView = document.getElementById('btnResetView');

// Search & Demographic Filter Elements
const customSearchInput = document.getElementById('customSearchInput');
const filterPills = document.getElementById('filterPills');
const btnFetchWikimedia = document.getElementById('btnFetchWikimedia');

// Modal Elements
const imageModal = document.getElementById('imageModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalClose = document.getElementById('modalClose');
const modalImg = document.getElementById('modalImg');
const modalTitle = document.getElementById('modalTitle');
const modalAngleInfo = document.getElementById('modalAngleInfo');
const modalAngleDiff = document.getElementById('modalAngleDiff');
const modalSource = document.getElementById('modalSource');
const modalAuthor = document.getElementById('modalAuthor');
const modalDownloadBtn = document.getElementById('modalDownloadBtn');

// Artist Studio Controls DOM
const btnZoomIn = document.getElementById('btnZoomIn');
const btnZoomOut = document.getElementById('btnZoomOut');
const lblZoomVal = document.getElementById('lblZoomVal');
const sliderRotate = document.getElementById('sliderRotate');
const lblRotateVal = document.getElementById('lblRotateVal');
const btnResetRotate = document.getElementById('btnResetRotate');
const btnToggleBW = document.getElementById('btnToggleBW');
const btnToggleFlip = document.getElementById('btnToggleFlip');
const btnToggleGrid = document.getElementById('btnToggleGrid');
const btnToggleHighContrast = document.getElementById('btnToggleHighContrast');
const artGridOverlay = document.getElementById('artGridOverlay');

// Sidebar adjustment sliders
const sliderBright = document.getElementById('sliderBright');
const sliderContrast = document.getElementById('sliderContrast');
const sliderSat = document.getElementById('sliderSat');
const lblBright = document.getElementById('lblBright');
const lblContrast = document.getElementById('lblContrast');
const lblSat = document.getElementById('lblSat');
const btnResetAdjustments = document.getElementById('btnResetAdjustments');

// Three.js Scene Setup
let scene, camera, renderer, controls, loader;
let skullMesh = null;
let headMesh = null;
let asaroMesh = null;
let handMesh = null;
let dogSkullMesh = null;
let humanBodyMesh = null;
let animalBodyMesh = null;
let currentActiveMesh = null;
let applyZoom = null;

function initThree() {
  const width = canvasContainer.clientWidth;
  const height = canvasContainer.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x11131a);

  // Camera
  camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 0, 3.8);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  canvasContainer.appendChild(renderer.domElement);

  // OrbitControls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = true;
  // Desactivamos el zoom nativo de Three.js para evitar que en trackpads o ruedas de ratón de alta resolución
  // el visor dé saltos gigantescos que dejan el modelo demasiado cerca o microscópico
  controls.enableZoom = false;
  controls.minDistance = 2.0;
  controls.maxDistance = 6.2;
  controls.target.set(0, 0, 0);

  // Función de zoom suave y acotado dentro de un rango visual cómodo
  applyZoom = (deltaFactor) => {
    const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
    const currentDist = offset.length();
    
    // Rango visual confortable: min 2.0 (nunca atraviesa la cabeza o cuerpo) y max 6.2 (nunca queda minúsculo)
    const minD = 2.0;
    const maxD = 6.2;
    const newDist = Math.max(minD, Math.min(maxD, currentDist * deltaFactor));

    offset.setLength(newDist);
    camera.position.copy(controls.target).add(offset);
    controls.update();
    updateAnglesFromCamera();
  };

  // Normalización de la rueda del mouse / trackpad para todas las computadoras y navegadores
  canvasContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    // Normalizar según el modo del navegador (píxeles, líneas o páginas)
    let delta = e.deltaY;
    if (e.deltaMode === 1) delta *= 20; // Modo líneas (ratón convencional)
    else if (e.deltaMode === 2) delta *= 80; // Modo páginas

    // Limitar el delta por evento para evitar saltos gigantes con ruedas libres o trackpads
    delta = Math.max(-60, Math.min(60, delta));

    // Factor de escala suave y proporcional
    const factor = 1 + delta * 0.0022;
    if (applyZoom) applyZoom(factor);
  }, { passive: false });

  // Soporte de pellizco (Pinch-to-zoom) para pantallas táctiles y celulares
  let initialPinchDist = null;
  canvasContainer.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDist = Math.sqrt(dx * dx + dy * dy);
    }
  }, { passive: true });

  canvasContainer.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && initialPinchDist) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentPinchDist = Math.sqrt(dx * dx + dy * dy);
      if (initialPinchDist > 0) {
        const pinchRatio = initialPinchDist / currentPinchDist;
        const smoothRatio = 1 + (pinchRatio - 1) * 0.25;
        if (applyZoom) applyZoom(smoothRatio);
      }
      initialPinchDist = currentPinchDist;
    }
  }, { passive: true });

  canvasContainer.addEventListener('touchend', () => {
    initialPinchDist = null;
  }, { passive: true });

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffeedd, 2.5);
  mainLight.position.set(3, 4, 4);
  scene.add(mainLight);

  const rimLight = new THREE.DirectionalLight(0x6366f1, 2.0);
  rimLight.position.set(-4, 2, -3);
  scene.add(rimLight);

  const fillLight = new THREE.DirectionalLight(0x88bbff, 1.0);
  fillLight.position.set(0, -3, 2);
  scene.add(fillLight);

  // GLTF Loader
  loader = new GLTFLoader();

  // Load Models
  loadModels();

  // Window & Container Resize
  window.addEventListener('resize', onWindowResize);
  if (window.ResizeObserver && canvasContainer) {
    const ro = new ResizeObserver(() => onWindowResize());
    ro.observe(canvasContainer);
  }

  // Track Orbit Controls change to calculate angles
  controls.addEventListener('change', updateAnglesFromCamera);
  controls.addEventListener('end', () => {
    const deltaYaw = Math.abs(state.yaw - (state.lastTrackedYaw || 0));
    const deltaPitch = Math.abs(state.pitch - (state.lastTrackedPitch || 0));
    if (deltaYaw > 15 || deltaPitch > 15) {
      if (!AccessControl.canPerformSearch()) {
        AccessControl.showPaywall();
        return;
      }
      AccessControl.recordSearch();
      state.lastTrackedYaw = state.yaw;
      state.lastTrackedPitch = state.pitch;
      filterGallery();
    }
  });

  // Animation Loop
  animate();
}


const fileMap = {
    'head': { file: 'LeePerrySmith.glb', hex: 0xccaa99 },
    'asaro': { file: 'asaro_head.glb', hex: 0xe2e8f0, flatShading: true },
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
                if (val === 'dog_skull') m.rotation.y = Math.PI;
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
                        child.material = new THREE.MeshStandardMaterial({
                            color: info.hex ? info.hex : 0xffffff,
                            roughness: 0.7,
                            metalness: 0.05,
                            flatShading: Boolean(info.flatShading)
                        });
                    }
                });
                
                // Si es de cuerpo completo, lo achicamos un poco extra para que entre perfecto
                if (val === 'human_body' || val === 'animal_body') {
                    m.scale.multiplyScalar(0.7);
                }
                
                scene.add(m);
                m.visible = false;
                
                if (val === 'head') headMesh = m;
                if (val === 'asaro') asaroMesh = m;
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
            alert("No se pudo cargar " + info.file + ". Fijate si está en la carpeta.");
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
    }, undefined, (err) => {
        console.error("Error calavera", err);
        loadingIndicator.style.display = 'none';
        loadingIndicator.classList.add('hidden');
    });
}
function onWindowResize() {
  if (!renderer || !camera || !canvasContainer) return;
  const width = canvasContainer.clientWidth;
  const height = canvasContainer.clientHeight;
  if (width === 0 || height === 0) return;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

/**
 * Calcula los ángulos anatómicos relativos (Yaw, Pitch, Roll)
 * tomando como punto de partida la dirección de la cámara hacia el centro.
 */
function updateAnglesFromCamera() {
  if (!camera) return;

  const camPos = camera.position.clone().sub(controls.target);
  
  // Yaw (Azimuth en plano X-Z): 0° = Frente (+Z), +90° = Perfil Derecho (+X), -90° = Perfil Izquierdo (-X)
  let yawRad = -Math.atan2(camPos.x, camPos.z);
  let yawDeg = Math.round(yawRad * (180 / Math.PI));

  // Pitch (Elevación sobre plano X-Z): + = Mirando desde arriba (High Angle), - = Contrapicado (Low Angle)
  const xzDist = Math.sqrt(camPos.x * camPos.x + camPos.z * camPos.z);
  let pitchRad = Math.atan2(camPos.y, xzDist);
  let pitchDeg = Math.round(pitchRad * (180 / Math.PI));

  // Roll: En órbita estándar se mantiene prácticamente 0
  let rollDeg = 0;

  state.yaw = yawDeg;
  state.pitch = pitchDeg;
  state.roll = rollDeg;

  // Actualizar UI
  valYaw.innerText = `${yawDeg > 0 ? '+' : ''}${yawDeg}°`;
  valPitch.innerText = `${pitchDeg > 0 ? '+' : ''}${pitchDeg}°`;
  valRoll.innerText = `${rollDeg}°`;

  const mobileAnglePill = document.getElementById('mobileAnglePill');
  if (mobileAnglePill) {
    mobileAnglePill.innerText = `Y: ${yawDeg > 0 ? '+' : ''}${yawDeg}° · P: ${pitchDeg > 0 ? '+' : ''}${pitchDeg}°`;
  }

  // Descripciones amigables para artistas
  lblYawDesc.innerText = getYawDescription(yawDeg);
  lblPitchDesc.innerText = getPitchDescription(pitchDeg);

  if (state.autoSync) {
    debounceFilterGallery();
  }
}

function getYawDescription(yaw) {
  const abs = Math.abs(yaw);
  const side = yaw >= 0 ? 'Der.' : 'Izq.';
  if (abs <= 15) return 'Frontal (0°)';
  if (abs > 15 && abs <= 35) return `Leve 3/4 (${side})`;
  if (abs > 35 && abs <= 65) return `Tres Cuartos (${side})`;
  if (abs > 65 && abs <= 115) return `Perfil Completo (${side})`;
  if (abs > 115 && abs <= 165) return `Tres Cuartos Trasero (${side})`;
  return 'Posterior / Nuca (180°)';
}

function getPitchDescription(pitch) {
  if (pitch > 40) return 'Picado Extremo (Cénit)';
  if (pitch > 15) return 'Picado (Desde Arriba)';
  if (pitch >= -15 && pitch <= 15) return 'Nivel de Ojos (Eye-level)';
  if (pitch < -15 && pitch >= -40) return 'Contrapicado (Desde Abajo)';
  return 'Nadir Extremo (Bajo tierra)';
}

// Suavizado / debounce para refresco de galería al rotar
let debounceTimer = null;
function debounceFilterGallery() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    filterGallery();
  }, 120);
}

// Carga del dataset local
async function loadDataset() {
  try {
    const res = await fetch('faces-dataset.json?v=20261020m7');
    const raw = await res.json();
    state.dataset = raw.map(item => {
      let u = item.url || '';
      if (u.startsWith('/assets/')) u = 'assets/' + u.slice(8);
      else if (u.startsWith('/') && !u.startsWith('//')) u = u.slice(1);

      let fu = item.fullUrl || u;
      if (fu.startsWith('/assets/')) fu = 'assets/' + fu.slice(8);
      else if (fu.startsWith('/') && !fu.startsWith('//')) fu = fu.slice(1);

      return {
        ...item,
        url: u,
        fullUrl: fu
      };
    });
    const allPill = document.querySelector('[data-filter="all"]');
    if (allPill) allPill.innerText = `Todos (${state.dataset.length})`;
    filterGallery();
  } catch (err) {
    console.error('Error cargando dataset:', err);
  }
}

/**
 * Filtra y clasifica las imágenes por cercanía angular euclidiana
 */
function filterGallery() {
  galleryGrid.innerHTML = '';

  const isShowAll = state.tolerance === 'all';
  const hasSearch = Boolean(state.searchQuery && state.searchQuery.length > 0);
  const tol = isShowAll ? 999 : parseInt(state.tolerance, 10);
  const currentYaw = state.yaw;
  const currentPitch = state.pitch;

  // Combinar dataset predefinido con cualquier resultado online obtenido
  const rawList = [...state.dataset, ...state.onlineResults];
  // Deduplicar por URL
  const seenUrls = new Set();
  const allImages = rawList.filter(item => {
    if (!item.url || seenUrls.has(item.url)) return false;
    seenUrls.add(item.url);
    return true;
  });

  // Calcular diferencia angular para cada foto
  // Ponderación: el pitch (vertical) y el yaw (horizontal) deben respetarse rigurosamente
  const scoredImages = allImages.map(item => {
    // Distancia angular (diferencia mínima cíclica para yaw)
    let diffYaw = Math.abs(item.yaw - currentYaw);
    if (diffYaw > 180) diffYaw = 360 - diffYaw;

    const diffPitch = Math.abs(item.pitch - currentPitch);

    // Distancia total euclidiana
    const totalDiff = Math.sqrt(diffYaw * diffYaw + diffPitch * diffPitch);
    return { ...item, diffYaw, diffPitch, totalDiff: Math.round(totalDiff) };
  });

  const currentModel = modelSelector ? modelSelector.value : 'skull';
  const isHumanModel = (currentModel === 'skull' || currentModel === 'head' || currentModel === 'asaro' || currentModel === 'human_body');
  const isAnimalModel = (currentModel === 'dog_skull' || currentModel === 'animal_body');
  const isHandModel = (currentModel === 'hand');
  const activeFilter = state.demographicFilter || state.activeFilter || 'all';

  // Filtrar según criterios
  const matches = scoredImages
    .filter(item => {
      const itemType = getItemType(item);
      const text = `${item.title || ''} ${item.author || ''} ${item.category || ''}`.toLowerCase();

      // Si el usuario escribe una búsqueda libre por texto, buscar en toda la biblioteca
      if (hasSearch) {
        if (!text.includes(state.searchQuery)) return false;
        return true;
      }

      // Si NO está activo el modo "Catálogo completo", aplicar filtrado angular estricto
      if (!isShowAll) {
        // Diferencia general de distancia euclidiana y por eje
        if (item.totalDiff > tol) return false;
        if (item.diffYaw > tol) return false;
        if (item.diffPitch > tol) return false;

        // 1. Frente estricto (|currentYaw| <= 18°): solo fotos frontales (|item.yaw| <= 20°)
        if (Math.abs(currentYaw) <= 18 && Math.abs(item.yaw) > 20) return false;

        // 2. 3/4 (22° a 70°): no mezclar con frente ni con perfil
        if (Math.abs(currentYaw) >= 22 && Math.abs(currentYaw) <= 70 && (Math.abs(item.yaw) < 22 || Math.abs(item.yaw) > 72)) return false;

        // 3. Perfil (70° a 115°): solo fotos de perfil
        if (Math.abs(currentYaw) > 70 && Math.abs(currentYaw) <= 115 && Math.abs(item.yaw) < 68) return false;

        // 4. 3/4 Atrás (115° a 165°): solo fotos de 3/4 trasero
        if (Math.abs(currentYaw) > 115 && Math.abs(currentYaw) < 165 && (Math.abs(item.yaw) <= 115 || Math.abs(item.yaw) >= 168)) return false;

        // 5. Espalda / Nuca (>= 165°): solo fotos de espalda
        if (Math.abs(currentYaw) >= 165 && Math.abs(item.yaw) < 160) return false;

        // 6. Lateralidad Izquierda vs Derecha: no mezclar lados opuestos
        if (currentYaw > 15 && item.yaw < -10) return false;
        if (currentYaw < -15 && item.yaw > 10) return false;

        // 7. Coherencia vertical (Pitch):
        // Horizontal / Nivel de ojos (|currentPitch| <= 15°): rechazar contrapicados y picados marcados
        if (Math.abs(currentPitch) <= 15 && Math.abs(item.pitch) > 22) return false;
        // Contrapicado (currentPitch < -18°): rechazar fotos a nivel de ojos o picado
        if (currentPitch < -18 && item.pitch > -15) return false;
        // Picado (currentPitch > 18°): rechazar fotos a nivel de ojos o contrapicado
        if (currentPitch > 18 && item.pitch < 15) return false;
      }

      // 1. FILTRADO ESTRICTO SEGÚN EL MODELO 3D SELECCIONADO
      if (currentModel === 'human_body') {
        if (itemType !== 'human_body') return false;
      } else if (currentModel === 'skull' || currentModel === 'head' || currentModel === 'asaro') {
        if (itemType !== 'human_head') return false;
      } else if (currentModel === 'hand') {
        if (itemType !== 'hand') return false;
      } else if (currentModel === 'dog_skull') {
        if (itemType !== 'animal_head') return false;
      } else if (currentModel === 'animal_body') {
        if (itemType !== 'animal_body') return false;
      }

      // 2. FILTRADO POR SUBCATEGORÍA / PASTILLAS (Pills)
      if (activeFilter !== 'all') {
        if (isHumanModel) {
          if (activeFilter === 'mujeres') {
            if (!text.includes('mujer') && !text.includes('niña') && !text.includes('anciana') && !text.includes('femenin')) return false;
          } else if (activeFilter === 'hombres') {
            if (!text.includes('hombre') && !text.includes('niño') && !text.includes('anciano') && !text.includes('masculin')) return false;
          } else if (activeFilter === 'heroicas') {
            if (!text.includes('heroic') && !text.includes('épic') && !text.includes('epic') && !text.includes('poder') && !text.includes('firme') && !text.includes('dinamic') && !text.includes('accion') && !text.includes('acción')) return false;
          } else if (activeFilter === 'de_pie') {
            if (!text.includes('de pie')) return false;
          } else if (activeFilter === 'latinos') {
            if (!text.includes('latin') && !text.includes('hispano')) return false;
          } else if (activeFilter === 'colorados') {
            if (!text.includes('colorad') && !text.includes('pelirroj') && !text.includes('redhead') && !text.includes('pecas')) return false;
          } else if (activeFilter === 'ancianos') {
            if (!text.includes('ancian') && !text.includes('mayor')) return false;
          } else if (activeFilter === 'ninos') {
            if (!text.includes('niñ')) return false;
          }
        } else if (isAnimalModel) {
          if (activeFilter === 'heroicas') {
            if (!text.includes('heroic') && !text.includes('épic') && !text.includes('epic') && !text.includes('alerta') && !text.includes('guardia') && !text.includes('encabritado') && !text.includes('majestuos')) return false;
          } else if (activeFilter === 'cuadrupedos') {
            if (!text.includes('cuadruped') && !text.includes('cuadrúped') && !text.includes('caballo') && !text.includes('perro') && !text.includes('gato') && !text.includes('lobo') && !text.includes('león') && !text.includes('leon') && !text.includes('tigre') && !text.includes('oso') && !text.includes('panda') && !text.includes('ciervo') && !text.includes('jirafa') && !text.includes('cebra') && !text.includes('elefante') && !text.includes('mofeta') && !text.includes('zorro') && !text.includes('yacaré') && !text.includes('yacare')) return false;
          } else if (activeFilter === 'caninos' || activeFilter === 'perros') {
            if (!text.includes('perro') && !text.includes('canin') && !text.includes('lobo') && !text.includes('zorro')) return false;
          } else if (activeFilter === 'felinos' || activeFilter === 'gatos') {
            if (!text.includes('gato') && !text.includes('felin') && !text.includes('tigre') && !text.includes('león') && !text.includes('leon') && !text.includes('pantera')) return false;
          } else if (activeFilter === 'salvajes') {
            if (!text.includes('león') && !text.includes('leon') && !text.includes('lobo') && !text.includes('salvaje') && !text.includes('pantera') && !text.includes('zorro') && !text.includes('chimpancé') && !text.includes('chimpance') && !text.includes('mono') && !text.includes('tigre') && !text.includes('oso') && !text.includes('panda') && !text.includes('ciervo') && !text.includes('jirafa') && !text.includes('cebra') && !text.includes('elefante') && !text.includes('gorila') && !text.includes('perezoso') && !text.includes('mofeta') && !text.includes('águila') && !text.includes('aguila') && !text.includes('yacaré') && !text.includes('yacare') && !text.includes('cocodrilo')) return false;
          }
        } else if (isHandModel) {
          if (activeFilter === 'abierta' && (!text.includes('palma') && !text.includes('abierta') && !text.includes('relajada') && !text.includes('dorso'))) return false;
          if (activeFilter === 'puño' && (!text.includes('puño') && !text.includes('cerrad'))) return false;
          if (activeFilter === 'objeto' && (!text.includes('sujetando') && !text.includes('empuñando') && !text.includes('manzana') && !text.includes('espada') && !text.includes('lápiz') && !text.includes('lapiz') && !text.includes('vaso'))) return false;
        }
      }

      return true;
    })
    .sort((a, b) => a.totalDiff - b.totalDiff);

  if (hasSearch) {
    galleryStatus.innerText = `Resultados para "${state.searchQuery}" (${matches.length} referencias encontradas)`;
  } else if (isShowAll) {
    galleryStatus.innerText = `Mostrando las ${matches.length} referencias del modelo (ordenadas por cercanía angular)`;
  } else {
    galleryStatus.innerText = `Mostrando ${matches.length} referencias coincidentes (tolerancia ±${tol}°)`;
  }

  if (matches.length === 0) {
    galleryGrid.innerHTML = `
      <div class="no-results-box">
        <h4>No hay referencias con estos criterios (±${tol}°)</h4>
        <p>Prueba aumentando la tolerancia de ángulo o seleccionando "Todos" en los filtros superiores.</p>
      </div>
    `;
    return;
  }

  matches.forEach(item => {
    const card = document.createElement('div');
    card.className = 'reference-card';
    card.innerHTML = `
      <div class="ref-img-container">
        <span class="ref-badge">Y:${item.yaw}° P:${item.pitch}°</span>
        <span class="ref-match-badge">${Math.max(0, 100 - item.totalDiff)}% Match</span>
        <img src="${item.url}" alt="${item.title}" loading="lazy" decoding="async" onerror="if(!this.dataset.retry){this.dataset.retry='1'; this.src='${item.fullUrl || item.url}';}">
        <div class="card-watermark">
          <img src="assets/rooster-logo-gray.png" alt="Rooster Logo" class="card-watermark-logo">
        </div>
      </div>
      <div class="ref-info">
        <span class="ref-title">${item.title}</span>
      </div>
    `;

    card.addEventListener('click', () => openModal(item));
    galleryGrid.appendChild(card);
  });
}

/**
 * Consulta la API de Wikimedia Commons en vivo usando términos adaptados al ángulo actual
 */
async function fetchFromWikimedia() {
  const customQuery = customSearchInput.value.trim();
  
  // Construir consulta según yaw y pitch con palabras clave artísticas efectivas
  const currentModel = modelSelector ? modelSelector.value : 'skull';
  let subjectTerms = 'face portrait';
  if (currentModel === 'human_body') subjectTerms = 'human figure full body pose';
  else if (currentModel === 'animal_body') subjectTerms = 'animal full body standing';
  else if (currentModel === 'dog_skull') subjectTerms = 'animal head portrait';
  else if (currentModel === 'hand') subjectTerms = 'human hand reference';

  let angleTerms = '';
  const absYaw = Math.abs(state.yaw);
  const isRight = state.yaw > 0;

  if (absYaw <= 18) {
    angleTerms = `${subjectTerms} front frontal`;
  } else if (absYaw > 18 && absYaw <= 65) {
    angleTerms = `${subjectTerms} three-quarter ${isRight ? 'right' : 'left'}`;
  } else if (absYaw > 65 && absYaw <= 120) {
    angleTerms = `${subjectTerms} side profile ${isRight ? 'right' : 'left'}`;
  } else if (absYaw > 120 && absYaw < 165) {
    angleTerms = `${subjectTerms} back view three-quarter`;
  } else {
    angleTerms = `${subjectTerms} back view rear`;
  }

  if (state.pitch < -18) {
    angleTerms += ' low angle';
  } else if (state.pitch > 18) {
    angleTerms += ' high angle';
  }

  const fullQuery = customQuery ? `${customQuery} ${angleTerms}` : angleTerms;
  galleryStatus.innerText = `Buscando en Wikimedia Commons: "${fullQuery}"...`;

  try {
    const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(fullQuery + ' filetype:bitmap')}&gsrlimit=12&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=500`;
    
    const response = await fetch(endpoint);
    const data = await response.json();

    if (!data.query || !data.query.pages) {
      alert('No se encontraron imágenes en Wikimedia para esta búsqueda.');
      return;
    }

    const pages = Object.values(data.query.pages);
    const newItems = pages.map((page, index) => {
      const info = page.imageinfo && page.imageinfo[0];
      if (!info) return null;
      
      const thumb = info.thumburl || info.url;
      const title = page.title.replace('File:', '').replace(/\.[^/.]+$/, '');
      const artist = info.extmetadata && info.extmetadata.Artist ? info.extmetadata.Artist.value.replace(/<[^>]*>?/gm, '') : 'Wikimedia Commons';

      // Asignar el ángulo buscado aproximadamente a las fotos encontradas
      return {
        id: `wiki-${page.pageid || index}`,
        title: title.substring(0, 40),
        category: 'wikimedia',
        yaw: state.yaw,
        pitch: state.pitch,
        source: 'Wikimedia Commons (Public / CC)',
        author: artist.substring(0, 30),
        url: thumb,
        fullUrl: info.url
      };
    }).filter(Boolean);

    state.onlineResults = newItems;
    filterGallery();
  } catch (error) {
    console.error('Error fetching Wikimedia:', error);
    alert('Error al consultar Wikimedia Commons. Verifica tu conexión a internet.');
  }
}

// Modal Viewer with Full Artist Adjustment Engine
function updateImageFilters() {
  const flipScale = state.isFlipped ? -1 : 1;
  const zoomScale = state.zoom / 100;
  
  // Transformación 2D (Rotación continua, zoom y flip)
  modalImg.style.transform = `scaleX(${flipScale}) scale(${zoomScale}) rotate(${state.rotation}deg)`;

  // Filtros CSS combinados
  const grayFilter = state.isGrayscale ? 'grayscale(100%) ' : '';
  const notanFilter = state.isNotan ? 'contrast(300%) brightness(110%) ' : '';
  const brightFilter = `brightness(${state.brightness}%) `;
  const contrastFilter = `contrast(${state.contrast}%) `;
  const satFilter = `saturate(${state.saturation}%)`;

  modalImg.style.filter = `${grayFilter}${notanFilter}${brightFilter}${contrastFilter}${satFilter}`.trim();

  // Actualizar indicadores numéricos en la UI
  lblZoomVal.innerText = `${state.zoom}%`;
  lblRotateVal.innerText = `${state.rotation}°`;
  sliderRotate.value = state.rotation;

  lblBright.innerText = `${state.brightness}%`;
  lblContrast.innerText = `${state.contrast}%`;
  lblSat.innerText = `${state.saturation}%`;
  sliderBright.value = state.brightness;
  sliderContrast.value = state.contrast;
  sliderSat.value = state.saturation;

  // Estados visuales de botones activos
  btnToggleBW.classList.toggle('active', state.isGrayscale);
  btnToggleFlip.classList.toggle('active', state.isFlipped);
  btnToggleGrid.classList.toggle('active', state.isGridActive);
  btnToggleHighContrast.classList.toggle('active', state.isNotan);
  artGridOverlay.classList.toggle('active', state.isGridActive);
}

function resetImageAdjustments() {
  state.zoom = 100;
  state.rotation = 0;
  state.isFlipped = false;
  state.isGrayscale = false;
  state.isGridActive = false;
  state.isNotan = false;
  state.brightness = 100;
  state.contrast = 100;
  state.saturation = 100;
  updateImageFilters();
}

function openModal(item) {
  resetImageAdjustments();
  modalImg.src = item.fullUrl || item.url;
  modalTitle.innerText = item.title;
  modalAngleInfo.innerText = `Yaw (Horizontal): ${item.yaw}° | Pitch (Vertical): ${item.pitch}°`;
  modalAngleDiff.innerText = `Diferencia con calavera: ±${item.totalDiff}°`;
  modalSource.innerText = item.source || 'Rooster Espacio de Arte';
  modalAuthor.innerText = item.author || 'Estudio Anatómico';
  modalDownloadBtn.href = item.fullUrl || item.url;
  imageModal.classList.add('active');
}

function closeModal() {
  imageModal.classList.remove('active');
  resetImageAdjustments();
}

// Presets de Cámara
function setCameraPreset(yawDeg, pitchDeg) {
  if (!AccessControl.canPerformSearch()) {
    AccessControl.showPaywall();
    return;
  }
  AccessControl.recordSearch();
  state.lastTrackedYaw = yawDeg;
  state.lastTrackedPitch = pitchDeg;
  const r = 3.8;
  const yawRad = THREE.MathUtils.degToRad(-yawDeg);
  const pitchRad = THREE.MathUtils.degToRad(pitchDeg);

  const y = r * Math.sin(pitchRad);
  const xzDist = r * Math.cos(pitchRad);
  const x = xzDist * Math.sin(yawRad);
  const z = xzDist * Math.cos(yawRad);

  camera.position.set(x, y, z);
  controls.target.set(0, 0, 0);
  controls.update();
  updateAnglesFromCamera();
}

// Event Listeners
function setupEvents() {
  btnPresetFront.addEventListener('click', () => setCameraPreset(0, 0));
  if (btnPreset34L) btnPreset34L.addEventListener('click', () => setCameraPreset(-45, 0));
  btnPreset34R.addEventListener('click', () => setCameraPreset(45, 0));
  if (btnPresetProfileL) btnPresetProfileL.addEventListener('click', () => setCameraPreset(-90, 0));
  btnPresetProfileR.addEventListener('click', () => setCameraPreset(90, 0));
  btnPresetLowAngle.addEventListener('click', () => setCameraPreset(0, -32));
  btnPresetHighAngle.addEventListener('click', () => setCameraPreset(0, 32));
  if (btnPresetBack34L) btnPresetBack34L.addEventListener('click', () => setCameraPreset(-140, 0));
  btnPresetBack34.addEventListener('click', () => setCameraPreset(140, 0));
  btnPresetBack.addEventListener('click', () => setCameraPreset(180, 0));
  btnResetView.addEventListener('click', () => setCameraPreset(0, 0));

  // Botones flotantes de Zoom 3D en el viewport
  const btn3dZoomIn = document.getElementById('btn3dZoomIn');
  const btn3dZoomOut = document.getElementById('btn3dZoomOut');
  const btn3dZoomReset = document.getElementById('btn3dZoomReset');
  if (btn3dZoomIn) {
    btn3dZoomIn.addEventListener('click', () => {
      if (applyZoom) applyZoom(0.85);
    });
  }
  if (btn3dZoomOut) {
    btn3dZoomOut.addEventListener('click', () => {
      if (applyZoom) applyZoom(1.18);
    });
  }
  if (btn3dZoomReset) {
    btn3dZoomReset.addEventListener('click', () => {
      if (camera && controls) {
        const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
        offset.setLength(3.8);
        camera.position.copy(controls.target).add(offset);
        controls.update();
        updateAnglesFromCamera();
      }
    });
  }

  const btnToggle3D = document.getElementById('btnToggle3D');
  const viewportCard = document.querySelector('.viewport-card');
  if (btnToggle3D && viewportCard) {
    btnToggle3D.addEventListener('click', () => {
      const isCollapsed = viewportCard.classList.toggle('collapsed-3d');
      const textEl = btnToggle3D.querySelector('.toggle-text');
      if (textEl) {
        textEl.innerText = isCollapsed ? 'Mostrar 3D' : 'Ocultar 3D';
      }
      if (!isCollapsed) {
        setTimeout(() => onWindowResize(), 50);
      }
    });
  }

  // Filter Pills (Demographics)
  if (filterPills) {
    filterPills.querySelectorAll('.pill-btn').forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.querySelectorAll('.pill-btn').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.demographicFilter = pill.getAttribute('data-filter') || 'all';
          state.activeFilter = pill.getAttribute('data-filter') || 'all';
          filterGallery();
      });
    });
  }

  // Realtime Search
  if (customSearchInput) {
    customSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      filterGallery();
    });
  }

  filterTolerance.addEventListener('change', (e) => {
    state.tolerance = e.target.value;
    filterGallery();
  });

  chkAutoSync.addEventListener('change', (e) => {
    state.autoSync = e.target.checked;
  });

  btnSearchFaces.addEventListener('click', () => {
    if (!AccessControl.canPerformSearch()) {
      AccessControl.showPaywall();
      return;
    }
    AccessControl.recordSearch();
    state.lastTrackedYaw = state.yaw;
    state.lastTrackedPitch = state.pitch;
    filterGallery();
  });

  modelSelector.addEventListener('change', async (e) => {
    const val = e.target.value;
    
    if (skullMesh) skullMesh.visible = false;
    if (headMesh) headMesh.visible = false;
    if (asaroMesh) asaroMesh.visible = false;
    if (handMesh) handMesh.visible = false;
    if (dogSkullMesh) dogSkullMesh.visible = false;
    if (humanBodyMesh) humanBodyMesh.visible = false;
    if (animalBodyMesh) animalBodyMesh.visible = false;

    let targetMesh = null;
    if (val === 'skull') targetMesh = skullMesh;
    else if (val === 'head' && headMesh) targetMesh = headMesh;
    else if (val === 'asaro' && asaroMesh) targetMesh = asaroMesh;
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
            updateAnglesFromCamera();
        }
    }

    if (val === 'dog_skull') {
        const pillsHtml = `
            <button class="pill-btn active" data-filter="all">Todas las Cabezas</button>
            <button class="pill-btn" data-filter="perros">Perros</button>
            <button class="pill-btn" data-filter="gatos">Gatos</button>
            <button class="pill-btn" data-filter="salvajes">Salvajes</button>
        `;
        filterPills.innerHTML = pillsHtml;
    } else if (val === 'animal_body') {
        const pillsHtml = `
            <button class="pill-btn active" data-filter="all">Todos los Animales</button>
            <button class="pill-btn" data-filter="heroicas">Heroicas / Alerta</button>
            <button class="pill-btn" data-filter="cuadrupedos">Cuadrúpedos</button>
            <button class="pill-btn" data-filter="caninos">Caninos</button>
            <button class="pill-btn" data-filter="felinos">Felinos</button>
            <button class="pill-btn" data-filter="salvajes">Salvajes</button>
        `;
        filterPills.innerHTML = pillsHtml;
    } else if (val === 'hand') {
        const pillsHtml = `
            <button class="pill-btn active" data-filter="all">Todas las Manos</button>
            <button class="pill-btn" data-filter="abierta">Palmas / Abiertas</button>
            <button class="pill-btn" data-filter="puño">Puños</button>
            <button class="pill-btn" data-filter="objeto">Sujetando Objetos</button>
        `;
        filterPills.innerHTML = pillsHtml;
    } else if (val === 'human_body') {
        const pillsHtml = `
            <button class="pill-btn active" data-filter="all">Todas las Poses</button>
            <button class="pill-btn" data-filter="heroicas">Heroicas / Épicas</button>
            <button class="pill-btn" data-filter="hombres">Hombres</button>
            <button class="pill-btn" data-filter="mujeres">Mujeres</button>
            <button class="pill-btn" data-filter="de_pie">De Pie</button>
        `;
        filterPills.innerHTML = pillsHtml;
    } else {
        const pillsHtml = `
            <button class="pill-btn active" data-filter="all">Todas las Personas</button>
            <button class="pill-btn" data-filter="mujeres">Mujeres</button>
            <button class="pill-btn" data-filter="hombres">Hombres</button>
            <button class="pill-btn" data-filter="latinos">Latinos</button>
            <button class="pill-btn" data-filter="colorados">Colorados</button>
            <button class="pill-btn" data-filter="ancianos">Ancianos</button>
            <button class="pill-btn" data-filter="ninos">Niños</button>
        `;
        filterPills.innerHTML = pillsHtml;
    }
    
    // Attach click events to dynamically rendered pills
    filterPills.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        filterPills.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.demographicFilter = btn.dataset.filter;
        state.activeFilter = btn.dataset.filter;
        filterGallery();
      });
    });
    
    state.demographicFilter = 'all';
    state.activeFilter = 'all';
    filterGallery();
  });

  // Modal interactions & Artist Studio Controls
  modalClose.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', closeModal);

  // Zoom controls
  btnZoomIn.addEventListener('click', () => {
    state.zoom = Math.min(250, state.zoom + 15);
    updateImageFilters();
  });

  btnZoomOut.addEventListener('click', () => {
    state.zoom = Math.max(50, state.zoom - 15);
    updateImageFilters();
  });

  // 2D In-plane Rotation Slider (para rotar referencias en cualquier ángulo intermedio)
  sliderRotate.addEventListener('input', (e) => {
    state.rotation = parseInt(e.target.value, 10);
    updateImageFilters();
  });

  btnResetRotate.addEventListener('click', () => {
    state.rotation = 0;
    updateImageFilters();
  });

  // Quick Toggles: B&W, Flip, Grid, Notan
  btnToggleBW.addEventListener('click', () => {
    state.isGrayscale = !state.isGrayscale;
    updateImageFilters();
  });

  btnToggleFlip.addEventListener('click', () => {
    state.isFlipped = !state.isFlipped;
    updateImageFilters();
  });

  btnToggleGrid.addEventListener('click', () => {
    state.isGridActive = !state.isGridActive;
    updateImageFilters();
  });

  btnToggleHighContrast.addEventListener('click', () => {
    state.isNotan = !state.isNotan;
    updateImageFilters();
  });

  // Adjustment sliders: Brillo, Contraste, Saturación
  sliderBright.addEventListener('input', (e) => {
    state.brightness = parseInt(e.target.value, 10);
    updateImageFilters();
  });

  sliderContrast.addEventListener('input', (e) => {
    state.contrast = parseInt(e.target.value, 10);
    updateImageFilters();
  });

  sliderSat.addEventListener('input', (e) => {
    state.saturation = parseInt(e.target.value, 10);
    updateImageFilters();
  });

  btnResetAdjustments.addEventListener('click', resetImageAdjustments);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && imageModal.classList.contains('active')) {
      closeModal();
    }
  });
}

// Bootstrapping
window.addEventListener('DOMContentLoaded', () => {
  initThree();
  setupEvents();
  loadDataset();
  setupPracticeTool(state, getItemType, AccessControl);
  AccessControl.init();
});
