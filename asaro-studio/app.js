import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ==========================================================================
// ESTADO DE LA APLICACIÓN
// ==========================================================================
const state = {
  // Cámara y Orientación
  camDistance: 3.6,
  targetDistance: 3.6,
  yaw: 0,
  pitch: 0,

  // Luz Principal (Key Light)
  lightAzimuth: 45,    // 0° a 360°
  lightElevation: 35,  // -60° a +85°
  keyIntensity: 2.2,
  keyColor: '#ffffff',
  activeLightPreset: 'rembrandt',

  // Luces Complementarias
  fillEnabled: true,
  fillIntensity: 0.6,
  rimEnabled: false,
  rimIntensity: 1.5,
  rimColor: '#88bbff',
  ambientIntensity: 0.35,
  floorShadowEnabled: true,

  // Material & Planos
  materialType: 'plaster', // plaster, clay, bronze, skin
  flatShading: true,
  wireframe: false,
  roughness: 0.65,

  // Filtros de Valor Tonal
  isNotan: false,
  notanThreshold: 50,
  posterizeMode: 'off', // off, 3, 5
  squintBlur: 0,        // 0 a 16px
  isGrayscale: false,

  // Referencia Fotográfica
  isSplitOpen: false,
  refImageSrc: null
};

// Material definitions
const MATERIALS = {
  plaster: { color: 0xe2e8f0, roughness: 0.65, metalness: 0.05 },
  clay:    { color: 0x8b8e99, roughness: 0.78, metalness: 0.02 },
  bronze:  { color: 0xa3724c, roughness: 0.52, metalness: 0.12 },
  skin:    { color: 0xd4a381, roughness: 0.60, metalness: 0.04 }
};

// ==========================================================================
// INICIALIZACIÓN THREE.JS
// ==========================================================================
let scene, camera, renderer, controls;
let asaroMesh = null;
let keyLight, fillLight, rimLight, ambientLight;
let floorMesh, lightGizmoGroup;

const canvasPanel = document.getElementById('canvasPanel');
const canvas = document.getElementById('asaroCanvas');

function initThree() {
  const width = canvasPanel.clientWidth;
  const height = canvasPanel.clientHeight;

  // Escena
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0e14);

  // Cámara
  camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 0, state.camDistance);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // OrbitControls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = true;
  controls.minDistance = 2.0;
  controls.maxDistance = 6.5;
  controls.target.set(0, -0.1, 0);

  // Suelo para sombra proyectada
  const floorGeo = new THREE.PlaneGeometry(12, 12);
  const floorMat = new THREE.ShadowMaterial({ opacity: 0.38 });
  floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = -1.5;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  // Sistema de Luces
  setupLights();

  // Carga del Modelo Asaro
  loadAsaroModel();

  // Listeners
  controls.addEventListener('change', updateTelemetry);
  window.addEventListener('resize', onWindowResize);
  if (window.ResizeObserver && canvasPanel) {
    new ResizeObserver(() => onWindowResize()).observe(canvasPanel);
  }

  // Loop
  animate();
}

// ==========================================================================
// CONFIGURACIÓN DE ILUMINACIÓN
// ==========================================================================
function setupLights() {
  // Luz Ambiental
  ambientLight = new THREE.AmbientLight(0xffffff, state.ambientIntensity);
  scene.add(ambientLight);

  // Luz Principal (Key Light con sombra suave)
  keyLight = new THREE.DirectionalLight(0xffffff, state.keyIntensity);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 15;
  keyLight.shadow.camera.left = -2.2;
  keyLight.shadow.camera.right = 2.2;
  keyLight.shadow.camera.top = 2.2;
  keyLight.shadow.camera.bottom = -2.2;
  keyLight.shadow.bias = -0.0004;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);

  // Gizmo visual de la luz principal (esfera luminosa en 3D)
  lightGizmoGroup = new THREE.Group();
  const gizmoSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffea75 })
  );
  const gizmoGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffea75, transparent: true, opacity: 0.25 })
  );
  lightGizmoGroup.add(gizmoSphere);
  lightGizmoGroup.add(gizmoGlow);
  scene.add(lightGizmoGroup);

  // Luz de Relleno (Fill Light)
  fillLight = new THREE.DirectionalLight(0xa5c2eb, state.fillIntensity);
  fillLight.position.set(-3.5, 1.0, 3.0);
  scene.add(fillLight);

  // Luz de Contorno (Rim Light)
  rimLight = new THREE.DirectionalLight(new THREE.Color(state.rimColor), state.rimIntensity);
  rimLight.position.set(2.5, 3.0, -3.8);
  rimLight.visible = state.rimEnabled;
  scene.add(rimLight);

  updateKeyLightPosition();
}

function updateKeyLightPosition() {
  const azRad = (state.lightAzimuth * Math.PI) / 180;
  const elRad = (state.lightElevation * Math.PI) / 180;
  const distance = 4.6;

  // Coordenadas esféricas
  const x = distance * Math.cos(elRad) * Math.sin(azRad);
  const y = distance * Math.sin(elRad);
  const z = distance * Math.cos(elRad) * Math.cos(azRad);

  keyLight.position.set(x, y, z);
  lightGizmoGroup.position.set(x * 0.9, y * 0.9, z * 0.9);

  // Actualizar telemetría visual
  const elLight = document.getElementById('telemetryLight');
  if (elLight) {
    elLight.innerText = `Az: ${Math.round(state.lightAzimuth)}° · El: ${Math.round(state.lightElevation)}°`;
  }
}

// ==========================================================================
// CARGA DEL MODELO ASARO HEAD 3D
// ==========================================================================
function loadAsaroModel() {
  const loader = new GLTFLoader();

  loader.load(
    'asaro_head.glb',
    (gltf) => {
      setupAsaroMesh(gltf.scene);
    },
    undefined,
    (err) => {
      console.warn('Carga directa de asaro_head.glb falló, intentando ruta alternativa...', err);
      // Fallback a ruta ../Referencia/asaro_head.glb si existe
      loader.load('../Referencia/asaro_head.glb', (gltf2) => {
        setupAsaroMesh(gltf2.scene);
      });
    }
  );
}

function setupAsaroMesh(model) {
  asaroMesh = model;

  // Centrar y escalar el modelo dentro de un bounding box estándar
  const box = new THREE.Box3().setFromObject(asaroMesh);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 2.4 / maxDim;
  asaroMesh.scale.setScalar(scale);

  // Centrar respecto al perno de rotación del rostro
  asaroMesh.position.x = -center.x * scale;
  asaroMesh.position.y = -center.y * scale + 0.1;
  asaroMesh.position.z = -center.z * scale;

  applyMaterialToMesh();

  asaroMesh.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  scene.add(asaroMesh);
  updateTelemetry();
}

function applyMaterialToMesh() {
  if (!asaroMesh) return;

  const matCfg = MATERIALS[state.materialType] || MATERIALS.plaster;

  const mat = new THREE.MeshStandardMaterial({
    color: matCfg.color,
    roughness: state.roughness,
    metalness: matCfg.metalness,
    flatShading: state.flatShading,
    wireframe: state.wireframe
  });

  asaroMesh.traverse((child) => {
    if (child.isMesh) {
      child.material = mat;
    }
  });
}

// ==========================================================================
// TELEMETRÍA Y ÁNGULOS DE LA CÁMARA
// ==========================================================================
function updateTelemetry() {
  const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
  let yaw = Math.round(Math.atan2(dir.x, dir.z) * (180 / Math.PI));
  let pitch = Math.round(Math.asin(-dir.y) * (180 / Math.PI));

  state.yaw = yaw;
  state.pitch = pitch;

  const elAngle = document.getElementById('telemetryAngle');
  if (elAngle) {
    elAngle.innerText = `Y: ${yaw}° · P: ${pitch}°`;
  }
}

// ==========================================================================
// PRESETS DE ILUMINACIÓN CLÁSICA
// ==========================================================================
const LIGHT_PRESETS = {
  rembrandt: { az: 45, el: 35, keyInt: 2.3, fill: true, rim: false },
  topdown:   { az: 0,  el: 75, keyInt: 2.6, fill: true, rim: false },
  split:     { az: 90, el: 5,  keyInt: 2.4, fill: false, rim: false },
  loop:      { az: 30, el: 25, keyInt: 2.2, fill: true, rim: false },
  butterfly: { az: 0,  el: 38, keyInt: 2.2, fill: true, rim: false },
  rim:       { az: 165, el: 15, keyInt: 2.5, fill: false, rim: true },
  under:     { az: 0,  el: -45, keyInt: 2.4, fill: false, rim: false },
  flat:      { az: 0,  el: 10, keyInt: 1.8, fill: true, rim: false }
};

function applyLightPreset(name) {
  const p = LIGHT_PRESETS[name];
  if (!p) return;

  state.activeLightPreset = name;
  state.lightAzimuth = p.az;
  state.lightElevation = p.el;
  state.keyIntensity = p.keyInt;
  state.fillEnabled = p.fill;
  state.rimEnabled = p.rim;

  // Actualizar UI
  document.getElementById('sliderAzimuth').value = p.az;
  document.getElementById('valAzimuth').innerText = `${p.az}°`;

  document.getElementById('sliderElevation').value = p.el;
  document.getElementById('valElevation').innerText = `${p.el}°`;

  document.getElementById('sliderKeyIntensity').value = p.keyInt;
  document.getElementById('valKeyIntensity').innerText = `${p.keyInt}x`;

  document.getElementById('chkFillLight').checked = p.fill;
  document.getElementById('chkRimLight').checked = p.rim;
  document.getElementById('rimIntensityWrap').style.display = p.rim ? 'flex' : 'none';

  // Sincronizar Three.js
  keyLight.intensity = p.keyInt;
  fillLight.visible = p.fill;
  rimLight.visible = p.rim;

  updateKeyLightPosition();

  // Actualizar tarjetas activas
  document.querySelectorAll('[data-light-preset]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lightPreset === name);
  });
}

// ==========================================================================
// PRESETS DE CÁMARA
// ==========================================================================
const CAMERA_PRESETS = {
  'front':          { yaw: 0, pitch: 0 },
  'threequarter-r': { yaw: 45, pitch: 0 },
  'threequarter-l': { yaw: -45, pitch: 0 },
  'profile-r':      { yaw: 90, pitch: 0 },
  'profile-l':      { yaw: -90, pitch: 0 },
  'high':           { yaw: 0, pitch: 35 },
  'low':            { yaw: 0, pitch: -30 },
  'back':           { yaw: 180, pitch: 0 }
};

function setCameraPreset(camName) {
  const p = CAMERA_PRESETS[camName];
  if (!p) return;

  const yRad = (p.yaw * Math.PI) / 180;
  const pRad = (p.pitch * Math.PI) / 180;
  const dist = state.camDistance;

  const x = dist * Math.cos(pRad) * Math.sin(yRad);
  const y = dist * Math.sin(pRad) + controls.target.y;
  const z = dist * Math.cos(pRad) * Math.cos(yRad);

  camera.position.set(x, y, z);
  controls.update();
  updateTelemetry();

  document.querySelectorAll('.btn-preset').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.cam === camName);
  });
}

// ==========================================================================
// FILTROS DE VALOR TONAL (NOTAN, POSTERIZE, SQUINT)
// ==========================================================================
function updateValueFilters() {
  const filters = [];

  // Squint / Blur
  if (state.squintBlur > 0) {
    filters.push(`blur(${state.squintBlur}px)`);
  }

  // Grayscale
  if (state.isGrayscale) {
    filters.push('grayscale(100%)');
  }

  // Notan (Blanco y negro 2 tonos)
  if (state.isNotan) {
    // Usamos contraste extremo + umbral de brillo para lograr el efecto Notan
    const threshOffset = (state.notanThreshold - 50) * 1.5;
    filters.push('grayscale(100%)');
    filters.push(`brightness(${100 + threshOffset}%)`);
    filters.push('contrast(800%)');
  }

  canvas.style.filter = filters.length > 0 ? filters.join(' ') : 'none';

  // Banner informativo
  const banner = document.getElementById('filterBanner');
  const bannerText = document.getElementById('filterBannerText');
  if (state.isNotan || state.posterizeMode !== 'off' || state.squintBlur > 0) {
    banner.style.display = 'flex';
    if (state.isNotan) bannerText.innerText = 'Modo Notan (2 Valores) Activo';
    else if (state.posterizeMode !== 'off') bannerText.innerText = `Posterización (${state.posterizeMode} Tonos) Activa`;
    else if (state.squintBlur > 0) bannerText.innerText = `Filtro Squint (${state.squintBlur}px) Activo`;
  } else {
    banner.style.display = 'none';
  }
}

// ==========================================================================
// VINCULACIÓN DE EVENTOS DEL DOM
// ==========================================================================
function setupUIListeners() {
  // Tabs
  document.querySelectorAll('.tab-btn').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      const targetPane = document.getElementById(`tab-${tab.dataset.tab}`);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // Presets de Cámara
  document.querySelectorAll('[data-cam]').forEach((btn) => {
    btn.addEventListener('click', () => setCameraPreset(btn.dataset.cam));
  });

  document.getElementById('btnResetCamera').addEventListener('click', () => {
    controls.target.set(0, -0.1, 0);
    camera.position.set(0, 0, state.camDistance);
    controls.update();
    updateTelemetry();
    document.querySelectorAll('.btn-preset').forEach((b) => b.classList.remove('active'));
  });

  // Presets de Luz
  document.querySelectorAll('[data-light-preset]').forEach((card) => {
    card.addEventListener('click', () => applyLightPreset(card.dataset.lightPreset));
  });

  // Sliders de Luz Principal
  const sliderAz = document.getElementById('sliderAzimuth');
  const valAz = document.getElementById('valAzimuth');
  sliderAz.addEventListener('input', (e) => {
    state.lightAzimuth = parseFloat(e.target.value);
    valAz.innerText = `${Math.round(state.lightAzimuth)}°`;
    updateKeyLightPosition();
    document.querySelectorAll('[data-light-preset]').forEach((c) => c.classList.remove('active'));
  });

  const sliderEl = document.getElementById('sliderElevation');
  const valEl = document.getElementById('valElevation');
  sliderEl.addEventListener('input', (e) => {
    state.lightElevation = parseFloat(e.target.value);
    valEl.innerText = `${Math.round(state.lightElevation)}°`;
    updateKeyLightPosition();
    document.querySelectorAll('[data-light-preset]').forEach((c) => c.classList.remove('active'));
  });

  const sliderKeyInt = document.getElementById('sliderKeyIntensity');
  const valKeyInt = document.getElementById('valKeyIntensity');
  sliderKeyInt.addEventListener('input', (e) => {
    state.keyIntensity = parseFloat(e.target.value);
    valKeyInt.innerText = `${state.keyIntensity.toFixed(1)}x`;
    keyLight.intensity = state.keyIntensity;
  });

  // Temperatura / Color de Luz
  document.querySelectorAll('[data-temp]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-temp]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const t = btn.dataset.temp;
      let colorHex = 0xffffff;
      if (t === 'warm') colorHex = 0xffe2b8; // Cálido dorado
      if (t === 'cool') colorHex = 0xcfe0fc; // Frío azulado
      keyLight.color.setHex(colorHex);
      document.getElementById('keyColorBox').style.backgroundColor = '#' + keyLight.color.getHexString();
    });
  });

  const keyColorPicker = document.getElementById('keyColorPicker');
  keyColorPicker.addEventListener('input', (e) => {
    keyLight.color.set(e.target.value);
    document.getElementById('keyColorBox').style.backgroundColor = e.target.value;
    document.querySelectorAll('[data-temp]').forEach((b) => b.classList.remove('active'));
  });

  // Luces Secundarias
  const chkFill = document.getElementById('chkFillLight');
  chkFill.addEventListener('change', (e) => {
    state.fillEnabled = e.target.checked;
    fillLight.visible = state.fillEnabled;
  });

  const sliderFillInt = document.getElementById('sliderFillIntensity');
  const valFillInt = document.getElementById('valFillIntensity');
  sliderFillInt.addEventListener('input', (e) => {
    state.fillIntensity = parseFloat(e.target.value);
    valFillInt.innerText = `${state.fillIntensity.toFixed(1)}x`;
    fillLight.intensity = state.fillIntensity;
  });

  const chkRim = document.getElementById('chkRimLight');
  const rimWrap = document.getElementById('rimIntensityWrap');
  chkRim.addEventListener('change', (e) => {
    state.rimEnabled = e.target.checked;
    rimLight.visible = state.rimEnabled;
    rimWrap.style.display = state.rimEnabled ? 'flex' : 'none';
  });

  const sliderRimInt = document.getElementById('sliderRimIntensity');
  const valRimInt = document.getElementById('valRimIntensity');
  sliderRimInt.addEventListener('input', (e) => {
    state.rimIntensity = parseFloat(e.target.value);
    valRimInt.innerText = `${state.rimIntensity.toFixed(1)}x`;
    rimLight.intensity = state.rimIntensity;
  });

  const sliderAmbient = document.getElementById('sliderAmbient');
  const valAmbient = document.getElementById('valAmbient');
  sliderAmbient.addEventListener('input', (e) => {
    state.ambientIntensity = parseFloat(e.target.value);
    valAmbient.innerText = state.ambientIntensity.toFixed(2);
    ambientLight.intensity = state.ambientIntensity;
  });

  const chkFloor = document.getElementById('chkFloorShadow');
  chkFloor.addEventListener('change', (e) => {
    state.floorShadowEnabled = e.target.checked;
    floorMesh.visible = state.floorShadowEnabled;
  });

  // Material & Shading
  document.querySelectorAll('[data-shading]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-shading]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.flatShading = btn.dataset.shading === 'flat';
      applyMaterialToMesh();
    });
  });

  document.querySelectorAll('[data-mat]').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('[data-mat]').forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      state.materialType = card.dataset.mat;
      applyMaterialToMesh();
    });
  });

  const chkWire = document.getElementById('chkWireframe');
  chkWire.addEventListener('change', (e) => {
    state.wireframe = e.target.checked;
    applyMaterialToMesh();
  });

  // Filtros de Valor
  const chkNotan = document.getElementById('chkNotan');
  const notanThreshWrap = document.getElementById('notanThresholdWrap');
  chkNotan.addEventListener('change', (e) => {
    state.isNotan = e.target.checked;
    notanThreshWrap.style.display = state.isNotan ? 'flex' : 'none';
    updateValueFilters();
  });

  const sliderNotanThresh = document.getElementById('sliderNotanThreshold');
  const valNotanThresh = document.getElementById('valNotanThreshold');
  sliderNotanThresh.addEventListener('input', (e) => {
    state.notanThreshold = parseInt(e.target.value, 10);
    valNotanThresh.innerText = `${state.notanThreshold}%`;
    updateValueFilters();
  });

  document.querySelectorAll('[data-posterize]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-posterize]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.posterizeMode = btn.dataset.posterize;
      updateValueFilters();
    });
  });

  const sliderSquint = document.getElementById('sliderSquint');
  const valSquint = document.getElementById('valSquint');
  sliderSquint.addEventListener('input', (e) => {
    state.squintBlur = parseInt(e.target.value, 10);
    valSquint.innerText = `${state.squintBlur}px`;
    updateValueFilters();
  });

  const chkGray = document.getElementById('chkGrayscale');
  chkGray.addEventListener('change', (e) => {
    state.isGrayscale = e.target.checked;
    updateValueFilters();
  });

  document.getElementById('btnResetFilterBanner').addEventListener('click', () => {
    state.isNotan = false;
    state.posterizeMode = 'off';
    state.squintBlur = 0;
    chkNotan.checked = false;
    notanThreshWrap.style.display = 'none';
    sliderSquint.value = 0;
    valSquint.innerText = '0px';
    document.querySelectorAll('[data-posterize]').forEach((b) => b.classList.toggle('active', b.dataset.posterize === 'off'));
    updateValueFilters();
  });

  // Zoom Buttons
  document.getElementById('btnZoomIn').addEventListener('click', () => {
    const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
    offset.multiplyScalar(0.85);
    if (offset.length() >= controls.minDistance) {
      camera.position.copy(controls.target).add(offset);
      controls.update();
      updateTelemetry();
    }
  });

  document.getElementById('btnZoomOut').addEventListener('click', () => {
    const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
    offset.multiplyScalar(1.15);
    if (offset.length() <= controls.maxDistance) {
      camera.position.copy(controls.target).add(offset);
      controls.update();
      updateTelemetry();
    }
  });

  document.getElementById('btnZoomReset').addEventListener('click', () => {
    const offset = new THREE.Vector3().subVectors(camera.position, controls.target).normalize().multiplyScalar(state.camDistance);
    camera.position.copy(controls.target).add(offset);
    controls.update();
    updateTelemetry();
  });

  // Captura de Pantalla
  document.getElementById('btnCapture').addEventListener('click', () => {
    renderer.render(scene, camera);
    const dataURL = renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `cabeza-asaro-luz-${state.activeLightPreset}-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  });

  // Comparador de Referencia Split Screen
  const btnToggleSplit = document.getElementById('btnToggleSplit');
  const refSplitPanel = document.getElementById('refSplitPanel');
  const btnCloseSplit = document.getElementById('btnCloseSplit');
  const btnUploadPhotoRef = document.getElementById('btnUploadPhotoRef');
  const fileInputRef = document.getElementById('fileInputRef');
  const refDropzone = document.getElementById('refDropzone');
  const refDisplayImg = document.getElementById('refDisplayImg');

  function toggleSplit(open) {
    state.isSplitOpen = typeof open === 'boolean' ? open : !state.isSplitOpen;
    refSplitPanel.classList.toggle('open', state.isSplitOpen);
    btnToggleSplit.classList.toggle('active', state.isSplitOpen);
    setTimeout(() => onWindowResize(), 50);
  }

  btnToggleSplit.addEventListener('click', () => toggleSplit());
  btnCloseSplit.addEventListener('click', () => toggleSplit(false));

  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      refDisplayImg.src = e.target.result;
      refDisplayImg.style.display = 'block';
      refDropzone.style.display = 'none';
      toggleSplit(true);
    };
    reader.readAsDataURL(file);
  };

  btnUploadPhotoRef.addEventListener('click', () => fileInputRef.click());
  refDropzone.addEventListener('click', () => fileInputRef.click());
  fileInputRef.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));

  refDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    refDropzone.style.borderColor = 'var(--yellow)';
  });
  refDropzone.addEventListener('dragleave', () => {
    refDropzone.style.borderColor = 'var(--border-light)';
  });
  refDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    refDropzone.style.borderColor = 'var(--border-light)';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  });

  // Muestras de retrato de ejemplo
  document.querySelectorAll('.sample-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.sample-thumb').forEach((t) => t.classList.remove('active'));
      thumb.classList.add('active');
      const src = thumb.dataset.sample;
      refDisplayImg.src = src;
      refDisplayImg.style.display = 'block';
      refDropzone.style.display = 'none';
      toggleSplit(true);
    });
  });
}

// ==========================================================================
// RESIZE & RENDER LOOP
// ==========================================================================
function onWindowResize() {
  if (!canvasPanel || !renderer || !camera) return;
  const width = canvasPanel.clientWidth;
  const height = canvasPanel.clientHeight;
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

// Iniciar al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
  initThree();
  setupUIListeners();
});
