const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// Find the duplicated part and remove it
const brokenBlock = `      });
    });
    
    state.activeFilter = 'all';
    filterGallery();
  });
    });
    
    state.activeFilter = 'all';
    filterGallery();
  });`;

const fixedBlock = `      });
    });
    
    state.activeFilter = 'all';
    filterGallery();
  });`;

if (code.includes(brokenBlock)) {
    code = code.replace(brokenBlock, fixedBlock);
    fs.writeFileSync('app.js', code);
    console.log("Fixed syntax error!");
} else {
    console.log("Broken block not found exactly as expected. Let's do a more robust fix.");
    code = code.replace(/    \}\);\r?\n    \r?\n    state\.activeFilter = 'all';\r?\n    filterGallery\(\);\r?\n  \}\);\r?\n    \}\);\r?\n    \r?\n    state\.activeFilter = 'all';\r?\n    filterGallery\(\);\r?\n  \}\);/g, fixedBlock);
    fs.writeFileSync('app.js', code);
    console.log("Fixed with regex!");
}
