const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

const brokenBlock = `    state.demographicFilter = 'all';
    state.activeFilter = 'all';
    filterGallery();
  });
    });
    
    state.activeFilter = 'all';
    filterGallery();
  });`;

const cleanBlock = `    state.demographicFilter = 'all';
    state.activeFilter = 'all';
    filterGallery();
  });`;

code = code.replace(brokenBlock, cleanBlock);
fs.writeFileSync('app.js', code);
console.log("Cleaned duplicate braces!");
