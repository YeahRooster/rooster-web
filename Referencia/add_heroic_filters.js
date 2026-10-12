const fs = require('fs');

// 1. Update app.js
let js = fs.readFileSync('app.js', 'utf8');

// Update human_body pills
js = js.replace(
  /<button class="pill-btn active" data-filter="all">Todas las Poses<\/button>\s*<button class="pill-btn" data-filter="hombres">/,
  `<button class="pill-btn active" data-filter="all">Todas las Poses</button>
            <button class="pill-btn" data-filter="heroicas">Heroicas / Épicas</button>
            <button class="pill-btn" data-filter="hombres">`
);

// Update animal_body pills
js = js.replace(
  /<button class="pill-btn active" data-filter="all">Todos los Animales<\/button>\s*<button class="pill-btn" data-filter="cuadrupedos">/,
  `<button class="pill-btn active" data-filter="all">Todos los Animales</button>
            <button class="pill-btn" data-filter="heroicas">Heroicas / Alerta</button>
            <button class="pill-btn" data-filter="cuadrupedos">`
);

// Update filterGallery activeFilter logic for human_body
js = js.replace(
  /if \(currentModel === 'human_body'\) \{(\s*if \(activeFilter === 'hombres'\))/,
  `if (currentModel === 'human_body') {
          if (activeFilter === 'heroicas' && (!text.includes('heroic') && !text.includes('hero') && !text.includes('épic') && !text.includes('epic') && !text.includes('poder') && !text.includes('accion') && !text.includes('acción') && !text.includes('dinamic'))) return false;$1`
);

// Update filterGallery activeFilter logic for animal_body
js = js.replace(
  /} else if \(currentModel === 'animal_body'\) \{(\s*if \(activeFilter === 'cuadrupedos'\))/,
  `} else if (currentModel === 'animal_body') {
          if (activeFilter === 'heroicas' && (!text.includes('heroic') && !text.includes('alzado') && !text.includes('rugid') && !text.includes('ataque') && !text.includes('alerta') && !text.includes('majestuos') && !text.includes('accion') && !text.includes('acción'))) return false;$1`
);

fs.writeFileSync('app.js', js);
console.log('Successfully added Heroicas filters to app.js!');

// 2. Update practice.js subfilters
let practice = fs.readFileSync('practice.js', 'utf8');
practice = practice.replace(
  /<option value="all">Todas las Poses<\/option>\s*<option value="hombres">Hombres<\/option>/,
  `<option value="all">Todas las Poses</option>
        <option value="heroicas">Poses Heroicas / Dinámicas</option>
        <option value="hombres">Hombres</option>`
);

practice = practice.replace(
  /<option value="all">Todos los Animales<\/option>\s*<option value="perros">/,
  `<option value="all">Todos los Animales</option>
        <option value="heroicas">Poses Heroicas / Alerta</option>
        <option value="perros">`
);

practice = practice.replace(
  /if \(subfilter !== 'all'\) \{/,
  `if (subfilter !== 'all') {
        if (subfilter === 'heroicas' && (!text.includes('heroic') && !text.includes('épic') && !text.includes('epic') && !text.includes('poder') && !text.includes('accion') && !text.includes('acción') && !text.includes('dinamic') && !text.includes('alerta') && !text.includes('alzado') && !text.includes('majestuos'))) return false;`
);

fs.writeFileSync('practice.js', practice);
console.log('Successfully added Heroicas to practice.js!');
