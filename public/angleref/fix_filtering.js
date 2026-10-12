const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// 1. Helper function to categorize items
const helperCode = `
function getItemType(item) {
  const text = (item.title + ' ' + (item.author || '') + ' ' + (item.category || '')).toLowerCase();
  if (text.includes('mano') || text.includes('puño') || text.includes('dedo') || text.includes('palma')) return 'hand';
  if (text.includes('perro') || text.includes('gato') || text.includes('león') || text.includes('leon') || text.includes('caballo') || text.includes('lobo') || text.includes('animal') || text.includes('salvaje') || text.includes('cachorro')) return 'animal';
  return 'human';
}
`;

if (!code.includes('function getItemType(')) {
    code = helperCode + '\n' + code;
}

// 2. Update filterGallery filtering logic
const oldFilterBlockRegex = /\/\/ Filtro demogr[^\n]+\n\s*if \(state\.demographicFilter && state\.demographicFilter !== 'all'\) \{[\s\S]*?\}\s*\}\s*\n/s;

const newFilterBlock = `
      // 1. FILTRADO ESTRICTO SEGÚN EL MODELO 3D SELECCIONADO
      const currentModel = modelSelector ? modelSelector.value : 'skull';
      const isAnimalModel = (currentModel === 'dog_skull' || currentModel === 'animal_body');
      const isHandModel = (currentModel === 'hand');
      const isHumanModel = (!isAnimalModel && !isHandModel);

      const itemType = getItemType(item);
      if (isHumanModel && itemType !== 'human') return false;
      if (isAnimalModel && itemType !== 'animal') return false;
      if (isHandModel && itemType !== 'hand') return false;

      // 2. FILTRADO POR SUBCATEGORÍA / PASTILLAS (Pills)
      const activeFilter = state.demographicFilter || state.activeFilter || 'all';
      if (activeFilter !== 'all') {
        const text = (item.title + ' ' + (item.author || '') + ' ' + (item.category || '')).toLowerCase();
        
        if (isHumanModel) {
          if (activeFilter === 'mujeres') {
            if (!text.includes('mujer') && !text.includes('niña') && !text.includes('anciana') && !text.includes('femenin')) return false;
          } else if (activeFilter === 'hombres') {
            if (!text.includes('hombre') && !text.includes('niño') && !text.includes('anciano') && !text.includes('masculin')) return false;
          } else if (activeFilter === 'ancianos') {
            if (!text.includes('ancian') && !text.includes('mayor')) return false;
          } else if (activeFilter === 'ninos') {
            if (!text.includes('niñ')) return false;
          }
        } else if (isAnimalModel) {
          if (activeFilter === 'perros' && !text.includes('perro')) return false;
          if (activeFilter === 'gatos' && !text.includes('gato')) return false;
          if (activeFilter === 'salvajes' && (!text.includes('león') && !text.includes('leon') && !text.includes('lobo') && !text.includes('salvaje'))) return false;
        } else if (isHandModel) {
          if (activeFilter === 'abierta' && (!text.includes('palma') && !text.includes('abierta'))) return false;
          if (activeFilter === 'puño' && (!text.includes('puño') && !text.includes('cerrad'))) return false;
          if (activeFilter === 'objeto' && (!text.includes('sujetando') && !text.includes('empuñando') && !text.includes('manzana') && !text.includes('espada'))) return false;
        }
      }
`;

code = code.replace(oldFilterBlockRegex, newFilterBlock + '\n');

// 3. Update pills generation in change listener to also add Hand pills and fix event listeners
const changePillsRegex = /if \(val === 'dog_skull' \|\| val === 'animal_body'\) \{[\s\S]*?filterGallery\(\);\s*\}\);/s;

const newChangePills = `if (val === 'dog_skull' || val === 'animal_body') {
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
  });`;

code = code.replace(changePillsRegex, newChangePills);

fs.writeFileSync('app.js', code);
console.log("Successfully fixed all filtering logic!");
