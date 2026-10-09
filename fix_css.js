const fs = require('fs');
let code = fs.readFileSync('app/globals.css', 'utf8');

code = code.replace(
    '.rich-text-content { word-wrap: break-word; overflow-wrap: break-word; max-width: 100%; overflow: hidden; }',
    '.rich-text-content { overflow-wrap: break-word; word-break: keep-all; max-width: 100%; overflow: hidden; text-align: justify; hyphens: auto; }'
);

code = code.replace(
    '.rich-text-content p { margin-bottom: 1em; white-space: pre-wrap; }',
    '.rich-text-content p { margin-bottom: 1em; white-space: pre-wrap; word-break: normal; overflow-wrap: break-word; }'
);

fs.writeFileSync('app/globals.css', code);
