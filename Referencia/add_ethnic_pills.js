const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('index.html', 'utf8');
const oldPills = `<button class="pill-btn active" data-filter="all">Todos (23)</button>
            <button class="pill-btn" data-filter="mujeres">Mujeres</button>
            <button class="pill-btn" data-filter="hombres">Hombres</button>
            <button class="pill-btn" data-filter="ancianos">Ancianos</button>
            <button class="pill-btn" data-filter="ninos">Niños</button>`;

// Handle possible encoding differences with Niños
html = html.replace(
  /<div class="filter-pills" id="filterPills">[\s\S]*?<\/div>/,
  `<div class="filter-pills" id="filterPills">
            <button class="pill-btn active" data-filter="all">Todos</button>
            <button class="pill-btn" data-filter="mujeres">Mujeres</button>
            <button class="pill-btn" data-filter="hombres">Hombres</button>
            <button class="pill-btn" data-filter="latinos">Latinos</button>
            <button class="pill-btn" data-filter="colorados">Colorados</button>
            <button class="pill-btn" data-filter="ancianos">Ancianos</button>
            <button class="pill-btn" data-filter="ninos">Niños</button>
          </div>`
);
fs.writeFileSync('index.html', html);
console.log('Updated index.html pills');

// 2. Update app.js
let js = fs.readFileSync('app.js', 'utf8');

// Update dynamic human pills in app.js
const oldDynamicPills = `<button class="pill-btn active" data-filter="all">Todas las Personas</button>
            <button class="pill-btn" data-filter="mujeres">Mujeres</button>
            <button class="pill-btn" data-filter="hombres">Hombres</button>
            <button class="pill-btn" data-filter="ancianos">Ancianos</button>
            <button class="pill-btn" data-filter="ninos">Niños</button>`;

js = js.replace(
  /<button class="pill-btn active" data-filter="all">Todas las Personas<\/button>[\s\S]*?<button class="pill-btn" data-filter="ninos">[\s\S]*?<\/button>/,
  `<button class="pill-btn active" data-filter="all">Todas las Personas</button>
            <button class="pill-btn" data-filter="mujeres">Mujeres</button>
            <button class="pill-btn" data-filter="hombres">Hombres</button>
            <button class="pill-btn" data-filter="latinos">Latinos</button>
            <button class="pill-btn" data-filter="colorados">Colorados</button>
            <button class="pill-btn" data-filter="ancianos">Ancianos</button>
            <button class="pill-btn" data-filter="ninos">Niños</button>`
);

// Update filter logic in filterGallery()
const targetLogic = `} else if (activeFilter === 'hombres') {
              if (!text.includes('hombre') && !text.includes('niño') && !text.includes('anciano') && !text.includes('masculin')) return false;
            } else if (activeFilter === 'ancianos') {`;

// Let's do a more robust regex replacement for the human filter block
js = js.replace(
  /if \(activeFilter === 'mujeres'\) \{[\s\S]*?\} else if \(activeFilter === 'ninos'\) \{[\s\S]*?\}/,
  `if (activeFilter === 'mujeres') {
              if (!text.includes('mujer') && !text.includes('niña') && !text.includes('anciana') && !text.includes('femenin')) return false;
            } else if (activeFilter === 'hombres') {
              if (!text.includes('hombre') && !text.includes('niño') && !text.includes('anciano') && !text.includes('masculin')) return false;
            } else if (activeFilter === 'latinos') {
              if (!text.includes('latin') && !text.includes('hispano')) return false;
            } else if (activeFilter === 'colorados') {
              if (!text.includes('colorad') && !text.includes('pelirroj') && !text.includes('redhead') && !text.includes('pecas')) return false;
            } else if (activeFilter === 'ancianos') {
              if (!text.includes('ancian') && !text.includes('mayor')) return false;
            } else if (activeFilter === 'ninos') {
              if (!text.includes('niñ')) return false;
            }`
);

// Update animal salvajes filter to include new animals
js = js.replace(
  /if \(activeFilter === 'salvajes' && \(!text\.includes\('le[óo]n'\)[\s\S]*?\)\) return false;/,
  `if (activeFilter === 'salvajes' && (!text.includes('león') && !text.includes('leon') && !text.includes('lobo') && !text.includes('salvaje') && !text.includes('zorro') && !text.includes('chimpancé') && !text.includes('chimpance') && !text.includes('mono'))) return false;`
);

fs.writeFileSync('app.js', js);
console.log('Updated app.js filtering and pills');
