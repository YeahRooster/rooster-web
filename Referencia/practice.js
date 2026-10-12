/**
 * practice.js - Herramienta de Sesión de Práctica y Dibujo Rápido (Gesture Drawing / Speed Timer)
 * Permite a los dibujantes practicar velocidad, proporción y gestualidad con temporizador personalizable.
 */

export function setupPracticeTool(state, getItemType, AccessControl) {
  // Elementos del Modal de Configuración
  const btnOpenPractice = document.getElementById('btnOpenPractice');
  const practiceConfigModal = document.getElementById('practiceConfigModal');
  const btnClosePracticeConfig = document.getElementById('btnClosePracticeConfig');
  const btnCancelPracticeConfig = document.getElementById('btnCancelPracticeConfig');
  const btnStartPractice = document.getElementById('btnStartPractice');

  const practiceCategory = document.getElementById('practiceCategory');
  const practiceSubfilterGroup = document.getElementById('practiceSubfilterGroup');
  const practiceSubfilter = document.getElementById('practiceSubfilter');
  const practiceTimePresets = document.getElementById('practiceTimePresets');
  const practiceCustomTime = document.getElementById('practiceCustomTime');
  const practiceCountPresets = document.getElementById('practiceCountPresets');
  const practiceShuffle = document.getElementById('practiceShuffle');
  const practiceSound = document.getElementById('practiceSound');

  // Elementos de la Pantalla Completa de Sesión
  const practiceScreen = document.getElementById('practiceScreen');
  const practiceCounter = document.getElementById('practiceCounter');
  const practiceCurrentTitle = document.getElementById('practiceCurrentTitle');
  const practiceTimerDisplay = document.getElementById('practiceTimerDisplay');
  const practiceTimerBar = document.getElementById('practiceTimerBar');

  const btnPracticePrev = document.getElementById('btnPracticePrev');
  const btnPracticePause = document.getElementById('btnPracticePause');
  const btnPracticeNext = document.getElementById('btnPracticeNext');
  const btnPracticeExit = document.getElementById('btnPracticeExit');

  const practiceImg = document.getElementById('practiceImg');
  const practiceGridOverlay = document.getElementById('practiceGridOverlay');
  const btnPracticeBW = document.getElementById('btnPracticeBW');
  const btnPracticeFlip = document.getElementById('btnPracticeFlip');
  const btnPracticeGrid = document.getElementById('btnPracticeGrid');

  const practiceCompleteView = document.getElementById('practiceCompleteView');
  const practiceSummaryText = document.getElementById('practiceSummaryText');
  const btnPracticeRestart = document.getElementById('btnPracticeRestart');
  const btnPracticeFinishExit = document.getElementById('btnPracticeFinishExit');

  // Estado interno de la sesión
  const session = {
    active: false,
    paused: false,
    queue: [],
    currentIndex: 0,
    intervalSeconds: 60,
    timeRemaining: 60,
    timerId: null,
    isBW: false,
    isFlipped: false,
    isGrid: false,
    soundEnabled: true,
    totalDrawn: 0
  };

  // Sonido suave de aviso (Web Audio API sin dependencias externas)
  function playBeep(freq = 780, duration = 0.2) {
    if (!session.soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  // Formato mm:ss
  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // Adaptar el selector de subfiltro según la categoría elegida
  function updateSubfilterOptions() {
    const cat = practiceCategory.value;
    practiceSubfilter.innerHTML = '';

    if (cat === 'human_head') {
      practiceSubfilterGroup.style.display = 'flex';
      practiceSubfilter.innerHTML = `
        <option value="all">Todos los Retratos</option>
        <option value="mujeres">Mujeres</option>
        <option value="hombres">Hombres</option>
        <option value="latinos">Latinos</option>
        <option value="colorados">Colorados / Pelirrojos</option>
        <option value="ancianos">Ancianos</option>
        <option value="ninos">Niños</option>
      `;
    } else if (cat === 'animal') {
      practiceSubfilterGroup.style.display = 'flex';
      practiceSubfilter.innerHTML = `
        <option value="all">Todos los Animales</option>
        <option value="heroicas">Poses Heroicas / Alerta</option>
        <option value="cuadrupedos">Cuadrúpedos</option>
        <option value="perros">Perros / Caninos</option>
        <option value="gatos">Felinos</option>
        <option value="salvajes">Salvajes</option>
      `;
    } else if (cat === 'hand') {
      practiceSubfilterGroup.style.display = 'flex';
      practiceSubfilter.innerHTML = `
        <option value="all">Todas las Manos</option>
        <option value="abierta">Palmas / Abiertas</option>
        <option value="puño">Puños</option>
        <option value="objeto">Sujetando Objetos</option>
      `;
    } else if (cat === 'human_body') {
      practiceSubfilterGroup.style.display = 'flex';
      practiceSubfilter.innerHTML = `
        <option value="all">Todas las Poses</option>
        <option value="heroicas">Poses Heroicas / Dinámicas</option>
        <option value="hombres">Hombres</option>
        <option value="mujeres">Mujeres</option>
        <option value="de_pie">De Pie</option>
      `;
    } else {
      practiceSubfilterGroup.style.display = 'none';
      practiceSubfilter.innerHTML = `<option value="all">Todas las Referencias</option>`;
    }
  }

  practiceCategory.addEventListener('change', updateSubfilterOptions);

  // Manejo de presets de tiempo
  practiceTimePresets.querySelectorAll('.preset-time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      practiceTimePresets.querySelectorAll('.preset-time-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const time = parseInt(btn.dataset.time, 10);
      practiceCustomTime.value = time;
    });
  });

  practiceCustomTime.addEventListener('input', () => {
    practiceTimePresets.querySelectorAll('.preset-time-btn').forEach(b => b.classList.remove('active'));
  });

  // Manejo de presets de cantidad
  practiceCountPresets.querySelectorAll('.preset-count-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      practiceCountPresets.querySelectorAll('.preset-count-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Abrir / Cerrar Modal de Configuración
  btnOpenPractice.addEventListener('click', () => {
    updateSubfilterOptions();
    practiceConfigModal.classList.add('active');
  });

  const closeConfig = () => practiceConfigModal.classList.remove('active');
  btnClosePracticeConfig.addEventListener('click', closeConfig);
  btnCancelPracticeConfig.addEventListener('click', closeConfig);

  // =========================================================================
  // INICIAR SESIÓN DE PRÁCTICA
  // =========================================================================
  function startSession() {
    const cat = practiceCategory.value;
    const subfilter = practiceSubfilter.value;
    const intervalSec = Math.max(5, parseInt(practiceCustomTime.value, 10) || 60);
    const activeCountBtn = practiceCountPresets.querySelector('.preset-count-btn.active');
    const countVal = activeCountBtn ? activeCountBtn.dataset.count : '10';
    const shuffle = practiceShuffle.checked;
    session.soundEnabled = practiceSound.checked;

    // Filtrar la biblioteca completa
    let filtered = state.dataset.filter(item => {
      const type = getItemType(item);
      const text = (item.title + ' ' + (item.author || '') + ' ' + (item.category || '')).toLowerCase();

      // Filtro de categoría principal
      if (cat === 'human_body' && type !== 'human_body') return false;
      if (cat === 'human_head' && type !== 'human_head') return false;
      if (cat === 'hand' && type !== 'hand') return false;
      if (cat === 'animal' && (type !== 'animal_body' && type !== 'animal_head')) return false;

      // Subfiltro
      if (subfilter !== 'all') {
        if (subfilter === 'heroicas' && (!text.includes('heroic') && !text.includes('épic') && !text.includes('epic') && !text.includes('poder') && !text.includes('firme') && !text.includes('accion') && !text.includes('acción') && !text.includes('dinamic') && !text.includes('alerta') && !text.includes('alzado') && !text.includes('encabritado') && !text.includes('majestuos'))) return false;
        if (subfilter === 'de_pie' && !text.includes('de pie')) return false;
        if (subfilter === 'cuadrupedos' && (!text.includes('cuadruped') && !text.includes('cuadrúped') && !text.includes('caballo') && !text.includes('perro') && !text.includes('gato') && !text.includes('lobo') && !text.includes('león') && !text.includes('leon') && !text.includes('tigre'))) return false;
        if (subfilter === 'mujeres' && (!text.includes('mujer') && !text.includes('niña') && !text.includes('anciana') && !text.includes('femenin'))) return false;
        if (subfilter === 'hombres' && (!text.includes('hombre') && !text.includes('niño') && !text.includes('anciano') && !text.includes('masculin'))) return false;
        if (subfilter === 'latinos' && (!text.includes('latin') && !text.includes('hispano'))) return false;
        if (subfilter === 'colorados' && (!text.includes('colorad') && !text.includes('pelirroj') && !text.includes('redhead') && !text.includes('pecas'))) return false;
        if (subfilter === 'ancianos' && (!text.includes('ancian') && !text.includes('mayor'))) return false;
        if (subfilter === 'ninos' && !text.includes('niñ')) return false;
        if (subfilter === 'perros' && (!text.includes('perro') && !text.includes('canin') && !text.includes('lobo') && !text.includes('zorro'))) return false;
        if (subfilter === 'gatos' && (!text.includes('gato') && !text.includes('felin') && !text.includes('tigre') && !text.includes('león') && !text.includes('leon'))) return false;
        if (subfilter === 'salvajes' && (!text.includes('león') && !text.includes('leon') && !text.includes('lobo') && !text.includes('salvaje') && !text.includes('zorro') && !text.includes('chimpancé') && !text.includes('chimpance') && !text.includes('mono') && !text.includes('tigre'))) return false;
        if (subfilter === 'abierta' && (!text.includes('palma') && !text.includes('abierta'))) return false;
        if (subfilter === 'puño' && (!text.includes('puño') && !text.includes('cerrad'))) return false;
        if (subfilter === 'objeto' && (!text.includes('sujetando') && !text.includes('empuñando') && !text.includes('manzana') && !text.includes('espada') && !text.includes('lápiz') && !text.includes('vaso'))) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      alert('No se encontraron imágenes en la biblioteca con esos criterios. Prueba seleccionando "Todos".');
      return;
    }

    // Mezclar si está tildado Shuffle (Algoritmo Fisher-Yates)
    if (shuffle) {
      for (let i = filtered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
      }
    }

    // Limitar cantidad
    if (countVal !== 'all') {
      const limit = parseInt(countVal, 10);
      filtered = filtered.slice(0, limit);
    }

    // Configurar estado
    session.queue = filtered;
    session.currentIndex = 0;
    session.intervalSeconds = intervalSec;
    session.timeRemaining = intervalSec;
    session.active = true;
    session.paused = false;
    session.totalDrawn = 0;

    closeConfig();
    practiceCompleteView.style.display = 'none';
    practiceScreen.classList.add('active');

    loadPose(0);
    startTimer();
  }

  btnStartPractice.addEventListener('click', () => {
    if (AccessControl && !AccessControl.canPerformSearch()) {
      AccessControl.showPaywall();
      return;
    }
    if (AccessControl) AccessControl.recordSearch();
    startSession();
  });

  // Cargar imagen de la pose actual
  function loadPose(index) {
    if (index < 0 || index >= session.queue.length) return;
    session.currentIndex = index;
    session.timeRemaining = session.intervalSeconds;

    const item = session.queue[index];
    practiceCounter.innerText = `Pose ${index + 1} de ${session.queue.length}`;
    practiceCurrentTitle.innerText = item.title || 'Referencia de estudio';
    practiceImg.src = item.fullUrl || item.url;

    updateTimerDisplay();
  }

  function updateTimerDisplay() {
    practiceTimerDisplay.innerText = formatTime(session.timeRemaining);
    const pct = Math.max(0, (session.timeRemaining / session.intervalSeconds) * 100);
    practiceTimerBar.style.width = `${pct}%`;

    if (session.timeRemaining <= 5) {
      practiceTimerDisplay.classList.add('danger');
    } else {
      practiceTimerDisplay.classList.remove('danger');
    }
  }

  // Motor del Temporizador
  function startTimer() {
    clearInterval(session.timerId);
    session.timerId = setInterval(() => {
      if (session.paused) return;

      session.timeRemaining--;
      updateTimerDisplay();

      // Aviso sonoro preventivo en los últimos 3 segundos
      if (session.timeRemaining > 0 && session.timeRemaining <= 3) {
        playBeep(440, 0.08);
      }

      if (session.timeRemaining <= 0) {
        session.totalDrawn++;
        playBeep(880, 0.35); // Aviso de cambio
        nextPose();
      }
    }, 1000);
  }

  function nextPose() {
    if (session.currentIndex + 1 < session.queue.length) {
      loadPose(session.currentIndex + 1);
    } else {
      // Fin de la sesión
      finishSession();
    }
  }

  function prevPose() {
    if (session.currentIndex > 0) {
      loadPose(session.currentIndex - 1);
    }
  }

  function togglePause() {
    session.paused = !session.paused;
    btnPracticePause.innerText = session.paused ? '▶' : '⏸';
    btnPracticePause.title = session.paused ? 'Reanudar sesión' : 'Pausar sesión';
  }

  function finishSession() {
    clearInterval(session.timerId);
    session.active = false;
    practiceSummaryText.innerText = `Completaste exitosamente ${session.queue.length} poses de práctica.`;
    practiceCompleteView.style.display = 'flex';
  }

  function exitSession() {
    clearInterval(session.timerId);
    session.active = false;
    practiceScreen.classList.remove('active');
    practiceCompleteView.style.display = 'none';
  }

  // Controles
  btnPracticeNext.addEventListener('click', nextPose);
  btnPracticePrev.addEventListener('click', prevPose);
  btnPracticePause.addEventListener('click', togglePause);
  btnPracticeExit.addEventListener('click', exitSession);

  btnPracticeRestart.addEventListener('click', () => {
    practiceCompleteView.style.display = 'none';
    session.currentIndex = 0;
    session.active = true;
    session.paused = false;
    loadPose(0);
    startTimer();
  });

  btnPracticeFinishExit.addEventListener('click', exitSession);

  // Herramientas de visualización en sesión
  btnPracticeBW.addEventListener('click', () => {
    session.isBW = !session.isBW;
    practiceImg.classList.toggle('grayscale', session.isBW);
    btnPracticeBW.classList.toggle('active', session.isBW);
  });

  btnPracticeFlip.addEventListener('click', () => {
    session.isFlipped = !session.isFlipped;
    practiceImg.classList.toggle('flip-h', session.isFlipped);
    btnPracticeFlip.classList.toggle('active', session.isFlipped);
  });

  btnPracticeGrid.addEventListener('click', () => {
    session.isGrid = !session.isGrid;
    practiceGridOverlay.classList.toggle('active', session.isGrid);
    btnPracticeGrid.classList.toggle('active', session.isGrid);
  });

  // Atajos de teclado durante la sesión activa
  window.addEventListener('keydown', (e) => {
    if (!session.active) return;

    if (e.code === 'Space') {
      e.preventDefault();
      togglePause();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      nextPose();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      prevPose();
    } else if (e.code === 'Escape') {
      e.preventDefault();
      exitSession();
    }
  });
}
