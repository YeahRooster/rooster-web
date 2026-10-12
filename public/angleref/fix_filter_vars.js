const fs = require('fs');

let js = fs.readFileSync('app.js', 'utf8');

// 1. Declare isHumanModel, isAnimalModel, isHandModel in filterGallery
js = js.replace(
  /const currentModel = modelSelector \? modelSelector\.value : 'skull';\r?\n\s*const itemType = getItemType\(item\);/,
  `const currentModel = modelSelector ? modelSelector.value : 'skull';
        const isHumanModel = (currentModel === 'skull' || currentModel === 'head' || currentModel === 'human_body');
        const isAnimalModel = (currentModel === 'dog_skull' || currentModel === 'animal_body');
        const isHandModel = (currentModel === 'hand');
        const itemType = getItemType(item);`
);

// 2. Ensure initial pills in setupEvents set both activeFilter and demographicFilter
js = js.replace(
  /state\.demographicFilter = pill\.getAttribute\('data-filter'\) \|\| 'all';\r?\n\s*filterGallery\(\);/,
  `state.demographicFilter = pill.getAttribute('data-filter') || 'all';
          state.activeFilter = pill.getAttribute('data-filter') || 'all';
          filterGallery();`
);

fs.writeFileSync('app.js', js);
console.log('Fixed undefined filter variables in app.js!');
