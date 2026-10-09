const fs = require('fs');

// --- FRONTEND: app/comunidad/nuevo/page.js ---
let pageCode = fs.readFileSync('app/comunidad/nuevo/page.js', 'utf8');

// Remove the notificar state
pageCode = pageCode.replace(
    'const [notificar, setNotificar] = useState(false);',
    ''
);

// Remove notificar from the payload
pageCode = pageCode.replace(
    /fecha_publicacion: editDate \? new Date\(editDate\)\.toISOString\(\) : new Date\(\)\.toISOString\(\),\s*notificar/,
    'fecha_publicacion: editDate ? new Date(editDate).toISOString() : new Date().toISOString()'
);

// Remove the UI Checkbox completely
const uiCheckboxRegex = /<div style=\{\{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba\(255,255,255,0\.05\)', padding: '15px', borderRadius: '8px', border: '1px solid #333' \}\}>[\s\S]*?<\/div>/;
pageCode = pageCode.replace(uiCheckboxRegex, '');

fs.writeFileSync('app/comunidad/nuevo/page.js', pageCode);

// --- BACKEND: app/api/v2/comunidad/posts/route.js ---
let apiCode = fs.readFileSync('app/api/v2/comunidad/posts/route.js', 'utf8');

// Always notify instead of checking `if (notificar)`
// We replace the check, but we keep the logic
apiCode = apiCode.replace(
    'if (notificar) {',
    'if (true) { // Siempre notificar'
);

fs.writeFileSync('app/api/v2/comunidad/posts/route.js', apiCode);
