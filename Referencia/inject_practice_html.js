const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Add Practice Button to header
const buttonHtml = `      <button class="btn btn-secondary" id="btnResetView">Reset</button>
      <button class="btn btn-practice" id="btnOpenPractice" title="Iniciar sesión de dibujo con temporizador automático">
        ⏱️ Práctica con Temporizador
      </button>`;

html = html.replace(
  /<button class="btn btn-secondary" id="btnResetView">[\s\S]*?<\/button>/,
  buttonHtml
);

// 2. Add Practice Modals and Screen before script tag
const practiceModalsHtml = `
  <!-- Modal de Configuración de Sesión de Práctica -->
  <div id="practiceConfigModal" class="practice-modal-backdrop">
    <div class="practice-config-dialog">
      <div class="practice-modal-header">
        <div class="practice-modal-title">
          <span class="icon">⏱️</span>
          <h3>Sesión de Práctica de Dibujo</h3>
        </div>
        <button class="btn-close-modal" id="btnClosePracticeConfig">&times;</button>
      </div>

      <div class="practice-modal-body">
        <p class="practice-intro-text">
          Configura un temporizador para practicar dibujo gestual, proporción y velocidad con las referencias de tu biblioteca Rooster.
        </p>

        <div class="form-group">
          <label class="form-label">Tipo de Referencias:</label>
          <select id="practiceCategory" class="form-select">
            <option value="all">Todas las Referencias (Mixto)</option>
            <option value="human_body">Solo Figuras Humanas (Cuerpo Completo)</option>
            <option value="human_head">Solo Retratos / Rostros Humanos</option>
            <option value="hand">Solo Manos Anatómicas</option>
            <option value="animal">Solo Animales (Cuerpo y Cabezas)</option>
          </select>
        </div>

        <div class="form-group" id="practiceSubfilterGroup">
          <label class="form-label">Subcategoría / Filtro:</label>
          <select id="practiceSubfilter" class="form-select">
            <option value="all">Todos los registros</option>
            <option value="mujeres">Mujeres</option>
            <option value="hombres">Hombres</option>
            <option value="latinos">Latinos</option>
            <option value="colorados">Colorados / Pelirrojos</option>
            <option value="ancianos">Ancianos</option>
            <option value="ninos">Niños</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Tiempo por Imagen / Intervalo:</label>
          <div class="time-presets" id="practiceTimePresets">
            <button type="button" class="preset-time-btn" data-time="30">30s <small>(Gesto)</small></button>
            <button type="button" class="preset-time-btn active" data-time="60">1 min <small>(Rápido)</small></button>
            <button type="button" class="preset-time-btn" data-time="120">2 min <small>(Estructura)</small></button>
            <button type="button" class="preset-time-btn" data-time="300">5 min <small>(Detalle)</small></button>
            <button type="button" class="preset-time-btn" data-time="600">10 min <small>(Estudio)</small></button>
          </div>
          <div class="custom-time-wrap">
            <label>O tiempo exacto en segundos:</label>
            <input type="number" id="practiceCustomTime" min="5" max="3600" value="60">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Cantidad de Imágenes en la Sesión:</label>
          <div class="count-presets" id="practiceCountPresets">
            <button type="button" class="preset-count-btn" data-count="5">5 Poses</button>
            <button type="button" class="preset-count-btn active" data-count="10">10 Poses</button>
            <button type="button" class="preset-count-btn" data-count="20">20 Poses</button>
            <button type="button" class="preset-count-btn" data-count="all">Todas</button>
          </div>
        </div>

        <div class="form-group-checkbox">
          <label class="toggle-container">
            <input type="checkbox" id="practiceShuffle" checked>
            <span class="toggle-label">Mezclar orden aleatoriamente (Shuffle)</span>
          </label>
          <label class="toggle-container">
            <input type="checkbox" id="practiceSound" checked>
            <span class="toggle-label">Aviso sonoro al cambiar de imagen</span>
          </label>
        </div>
      </div>

      <div class="practice-modal-footer">
        <button class="btn btn-secondary" id="btnCancelPracticeConfig">Cancelar</button>
        <button class="btn btn-primary btn-start-practice" id="btnStartPractice">
          ▶ Iniciar Sesión de Práctica
        </button>
      </div>
    </div>
  </div>

  <!-- Pantalla Completa de Sesión de Práctica -->
  <div id="practiceScreen" class="practice-screen">
    <div class="practice-screen-header">
      <div class="practice-progress-box">
        <span class="practice-badge" id="practiceCounter">Pose 1 de 10</span>
        <span class="practice-title" id="practiceCurrentTitle">Cargando...</span>
      </div>

      <!-- Temporizador Central -->
      <div class="practice-timer-box">
        <div class="timer-display" id="practiceTimerDisplay">01:00</div>
        <div class="timer-progress-bar-bg">
          <div class="timer-progress-bar" id="practiceTimerBar"></div>
        </div>
      </div>

      <!-- Controles de Reproducción -->
      <div class="practice-controls-box">
        <button class="practice-ctrl-btn" id="btnPracticePrev" title="Pose anterior (Flecha Izquierda)">⏮</button>
        <button class="practice-ctrl-btn primary" id="btnPracticePause" title="Pausar / Reanudar (Espacio)">⏸</button>
        <button class="practice-ctrl-btn" id="btnPracticeNext" title="Siguiente pose (Flecha Derecha)">⏭</button>
        <button class="practice-ctrl-btn danger" id="btnPracticeExit" title="Salir de la sesión (Escape)">✕ Salir</button>
      </div>
    </div>

    <div class="practice-image-viewport">
      <div class="practice-img-container" id="practiceImgContainer">
        <img id="practiceImg" src="" alt="Referencia de práctica">
        <div class="practice-grid-overlay" id="practiceGridOverlay"></div>
        <div class="practice-watermark">
          <img src="/assets/rooster-logo-gray.png" alt="Rooster Espacio de Arte">
        </div>
      </div>
    </div>

    <!-- Barra Inferior de Herramientas de Dibujo -->
    <div class="practice-tools-bar">
      <button class="practice-tool-pill" id="btnPracticeBW">⚪ Blanco y Negro</button>
      <button class="practice-tool-pill" id="btnPracticeFlip">↔️ Espejo (Flip)</button>
      <button class="practice-tool-pill" id="btnPracticeGrid">▦ Cuadrícula</button>
    </div>

    <!-- Pantalla de Fin de Sesión -->
    <div id="practiceCompleteView" class="practice-complete-overlay" style="display: none;">
      <div class="practice-complete-card">
        <div class="complete-icon">🎉</div>
        <h2>¡Sesión de Práctica Completada!</h2>
        <p id="practiceSummaryText">Has completado 10 poses con éxito.</p>
        <div class="complete-actions">
          <button class="btn btn-secondary" id="btnPracticeRestart">Repetir Sesión</button>
          <button class="btn btn-primary" id="btnPracticeFinishExit">Volver al Laboratorio 3D</button>
        </div>
      </div>
    </div>
  </div>
`;

html = html.replace('  <script type="module" src="app.js"></script>', practiceModalsHtml + '\n  <script type="module" src="app.js"></script>');

fs.writeFileSync('index.html', html);
console.log('Successfully updated index.html with Practice tool HTML!');
