const fs = require('fs');

let code = fs.readFileSync('app.js', 'utf8');

// 1. Refine getItemType to distinguish animal_body vs animal_head, and human_body vs human_head
const oldGetItemTypeRegex = /function getItemType\(item\) \{[\s\S]*?return 'human_head';\s*\}/;

const newGetItemType = `function getItemType(item) {
  const text = (item.title + ' ' + (item.author || '') + ' ' + (item.category || '')).toLowerCase();
  if (text.includes('mano') || text.includes('puño') || text.includes('dedo') || text.includes('palma')) return 'hand';

  const isAnimal = (text.includes('perro') || text.includes('gato') || text.includes('león') || text.includes('leon') || text.includes('caballo') || text.includes('lobo') || text.includes('animal') || text.includes('salvaje') || text.includes('cachorro') || text.includes('zorro') || text.includes('chimpancé') || text.includes('chimpance') || text.includes('mono'));

  const isFullBody = (text.includes('cuerpo completo') || text.includes('cuerpo entero') || text.includes('full body') || text.includes('figura completa') || text.includes('de pie') || text.includes('entero'));

  if (isAnimal) {
    return isFullBody ? 'animal_body' : 'animal_head';
  }

  if (isFullBody) return 'human_body';
  return 'human_head';
}`;

code = code.replace(oldGetItemTypeRegex, newGetItemType);

// 2. Refine filterGallery filtering
const oldFilterRegex = /\/\/ 1\. FILTRADO ESTRICTO SEGÚN EL MODELO 3D SELECCIONADO[\s\S]*?\/\/ 2\. FILTRADO POR SUBCATEGORÍA/;

const newFilter = `// 1. FILTRADO ESTRICTO SEGÚN EL MODELO 3D SELECCIONADO
      const currentModel = modelSelector ? modelSelector.value : 'skull';
      const itemType = getItemType(item);

      if (currentModel === 'human_body') {
        if (itemType !== 'human_body') return false;
      } else if (currentModel === 'skull' || currentModel === 'head') {
        if (itemType !== 'human_head') return false;
      } else if (currentModel === 'hand') {
        if (itemType !== 'hand') return false;
      } else if (currentModel === 'dog_skull') {
        if (itemType !== 'animal_head') return false;
      } else if (currentModel === 'animal_body') {
        if (itemType !== 'animal_body') return false;
      }

      // 2. FILTRADO POR SUBCATEGORÍA`;

code = code.replace(oldFilterRegex, newFilter);

// 3. Update pills for animal_body vs dog_skull
const oldPillSwitchRegex = /if \(val === 'dog_skull' \|\| val === 'animal_body'\) \{[\s\S]*?filterPills\.innerHTML = pillsHtml;\s*\}\s*else if \(val === 'hand'\)/;

const newPillSwitch = `if (val === 'dog_skull') {
        const pillsHtml = \`
            <button class="pill-btn active" data-filter="all">Todas las Cabezas</button>
            <button class="pill-btn" data-filter="perros">Perros</button>
            <button class="pill-btn" data-filter="gatos">Gatos</button>
            <button class="pill-btn" data-filter="salvajes">Salvajes</button>
        \`;
        filterPills.innerHTML = pillsHtml;
    } else if (val === 'animal_body') {
        const pillsHtml = \`
            <button class="pill-btn active" data-filter="all">Todos los Animales</button>
            <button class="pill-btn" data-filter="cuadrupedos">Cuadrúpedos</button>
            <button class="pill-btn" data-filter="caninos">Caninos</button>
            <button class="pill-btn" data-filter="felinos">Felinos</button>
            <button class="pill-btn" data-filter="salvajes">Salvajes</button>
        \`;
        filterPills.innerHTML = pillsHtml;
    } else if (val === 'hand')`;

code = code.replace(oldPillSwitchRegex, newPillSwitch);

// 4. Update subcategory filtering in filterGallery to handle animal_body filters
const oldAnimalFilterRegex = /\} else if \(currentModel === 'dog_skull' \|\| currentModel === 'animal_body'\) \{[\s\S]*?if \(activeFilter === 'salvajes'[\s\S]*?\} else if \(currentModel === 'hand'\)/;

const newAnimalFilter = `} else if (currentModel === 'dog_skull') {
          if (activeFilter === 'perros' && !text.includes('perro')) return false;
          if (activeFilter === 'gatos' && !text.includes('gato')) return false;
          if (activeFilter === 'salvajes' && (!text.includes('león') && !text.includes('leon') && !text.includes('lobo') && !text.includes('salvaje') && !text.includes('zorro') && !text.includes('chimpancé') && !text.includes('chimpance') && !text.includes('mono'))) return false;
        } else if (currentModel === 'animal_body') {
          if (activeFilter === 'cuadrupedos' && (!text.includes('caballo') && !text.includes('perro') && !text.includes('gato') && !text.includes('león') && !text.includes('lobo'))) return false;
          if (activeFilter === 'caninos' && (!text.includes('perro') && !text.includes('lobo') && !text.includes('zorro'))) return false;
          if (activeFilter === 'felinos' && (!text.includes('gato') && !text.includes('león') && !text.includes('tigre') && !text.includes('puma'))) return false;
          if (activeFilter === 'salvajes' && (!text.includes('león') && !text.includes('lobo') && !text.includes('salvaje') && !text.includes('zorro'))) return false;
        } else if (currentModel === 'hand')`;

code = code.replace(oldAnimalFilterRegex, newAnimalFilter);

fs.writeFileSync('app.js', code);
console.log('Updated app.js with animal_body separation and subcategories!');
