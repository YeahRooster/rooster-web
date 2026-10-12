const fs = require('fs');

let code = fs.readFileSync('app.js', 'utf8');

// 1. Update getItemType to separate human_body from human_head
const oldGetItemTypeRegex = /function getItemType\(item\) \{[\s\S]*?return 'human';\s*\}/;
const newGetItemType = `function getItemType(item) {
  const text = (item.title + ' ' + (item.author || '') + ' ' + (item.category || '')).toLowerCase();
  if (text.includes('mano') || text.includes('puño') || text.includes('dedo') || text.includes('palma')) return 'hand';
  if (text.includes('perro') || text.includes('gato') || text.includes('león') || text.includes('leon') || text.includes('caballo') || text.includes('lobo') || text.includes('animal') || text.includes('salvaje') || text.includes('cachorro')) return 'animal';
  if (text.includes('cuerpo completo') || text.includes('cuerpo entero') || text.includes('full body') || text.includes('figura completa') || text.includes('pose') || text.includes('de pie')) return 'human_body';
  return 'human_head';
}`;

code = code.replace(oldGetItemTypeRegex, newGetItemType);

// 2. Update model filtering inside filterGallery()
const oldFilteringRegex = /\/\/ 1\. FILTRADO ESTRICTO[\s\S]*?\/\/ 2\. FILTRADO POR SUBCATEGOR[^\n]+\n\s*const activeFilter = state\.demographicFilter \|\| state\.activeFilter \|\| 'all';\s*if \(activeFilter !== 'all'\) \{[\s\S]*?\} else if \(isHandModel\) \{[\s\S]*?\}\s*\}\s*\}/;

const newFiltering = `// 1. FILTRADO ESTRICTO SEGÚN EL MODELO 3D SELECCIONADO
      const currentModel = modelSelector ? modelSelector.value : 'skull';
      const itemType = getItemType(item);

      if (currentModel === 'human_body') {
        if (itemType !== 'human_body') return false;
      } else if (currentModel === 'skull' || currentModel === 'head') {
        if (itemType !== 'human_head') return false;
      } else if (currentModel === 'hand') {
        if (itemType !== 'hand') return false;
      } else if (currentModel === 'dog_skull' || currentModel === 'animal_body') {
        if (itemType !== 'animal') return false;
      }

      // 2. FILTRADO POR SUBCATEGORÍA / PASTILLAS (Pills)
      const activeFilter = state.demographicFilter || state.activeFilter || 'all';
      if (activeFilter !== 'all') {
        const text = (item.title + ' ' + (item.author || '') + ' ' + (item.category || '')).toLowerCase();
        
        if (currentModel === 'human_body') {
          if (activeFilter === 'hombres' && !text.includes('hombre')) return false;
          if (activeFilter === 'mujeres' && !text.includes('mujer')) return false;
          if (activeFilter === 'de_pie' && !text.includes('de pie')) return false;
        } else if (currentModel === 'skull' || currentModel === 'head') {
          if (activeFilter === 'mujeres') {
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
          }
        } else if (currentModel === 'dog_skull' || currentModel === 'animal_body') {
          if (activeFilter === 'perros' && !text.includes('perro')) return false;
          if (activeFilter === 'gatos' && !text.includes('gato')) return false;
          if (activeFilter === 'salvajes' && (!text.includes('león') && !text.includes('leon') && !text.includes('lobo') && !text.includes('salvaje') && !text.includes('zorro') && !text.includes('chimpancé') && !text.includes('chimpance') && !text.includes('mono'))) return false;
        } else if (currentModel === 'hand') {
          if (activeFilter === 'abierta' && (!text.includes('palma') && !text.includes('abierta'))) return false;
          if (activeFilter === 'puño' && (!text.includes('puño') && !text.includes('cerrad'))) return false;
          if (activeFilter === 'objeto' && (!text.includes('sujetando') && !text.includes('empuñando') && !text.includes('manzana') && !text.includes('espada') && !text.includes('lápiz') && !text.includes('lapiz') && !text.includes('vaso'))) return false;
        }
      }`;

code = code.replace(oldFilteringRegex, newFiltering);

// 3. Update pills inside modelSelector change listener to handle human_body specifically
const oldPillSwitchRegex = /if \(val === 'dog_skull' \|\| val === 'animal_body'\) \{[\s\S]*?\} else if \(val === 'hand'\) \{[\s\S]*?\} else \{[\s\S]*?filterPills\.innerHTML = pillsHtml;\s*\}/;

const newPillSwitch = `if (val === 'dog_skull' || val === 'animal_body') {
        const pillsHtml = \`
            <button class="pill-btn active" data-filter="all">Todos los Animales</button>
            <button class="pill-btn" data-filter="perros">Perros</button>
            <button class="pill-btn" data-filter="gatos">Gatos</button>
            <button class="pill-btn" data-filter="salvajes">Salvajes</button>
        \`;
        filterPills.innerHTML = pillsHtml;
    } else if (val === 'hand') {
        const pillsHtml = \`
            <button class="pill-btn active" data-filter="all">Todas las Manos</button>
            <button class="pill-btn" data-filter="abierta">Palmas / Abiertas</button>
            <button class="pill-btn" data-filter="puño">Puños</button>
            <button class="pill-btn" data-filter="objeto">Sujetando Objetos</button>
        \`;
        filterPills.innerHTML = pillsHtml;
    } else if (val === 'human_body') {
        const pillsHtml = \`
            <button class="pill-btn active" data-filter="all">Todas las Poses</button>
            <button class="pill-btn" data-filter="hombres">Hombres</button>
            <button class="pill-btn" data-filter="mujeres">Mujeres</button>
            <button class="pill-btn" data-filter="de_pie">De Pie</button>
        \`;
        filterPills.innerHTML = pillsHtml;
    } else {
        const pillsHtml = \`
            <button class="pill-btn active" data-filter="all">Todas las Personas</button>
            <button class="pill-btn" data-filter="mujeres">Mujeres</button>
            <button class="pill-btn" data-filter="hombres">Hombres</button>
            <button class="pill-btn" data-filter="latinos">Latinos</button>
            <button class="pill-btn" data-filter="colorados">Colorados</button>
            <button class="pill-btn" data-filter="ancianos">Ancianos</button>
            <button class="pill-btn" data-filter="ninos">Niños</button>
        \`;
        filterPills.innerHTML = pillsHtml;
    }`;

code = code.replace(oldPillSwitchRegex, newPillSwitch);

fs.writeFileSync('app.js', code);
console.log('Successfully updated app.js to separate full-body and portraits!');
