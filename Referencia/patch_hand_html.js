const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

if (!code.includes('<option value="hand">')) {
    code = code.replace(
        '<option value="head">Cabeza Humana (Scan)</option>',
        '<option value="head">Cabeza Humana (Scan)</option>\n            <option value="hand">Mano Humana (Referencia)</option>'
    );
    fs.writeFileSync('index.html', code);
}
