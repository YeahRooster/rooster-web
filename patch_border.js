const fs = require('fs'); 
let c = fs.readFileSync('app/components/Certificados.js', 'utf8'); 
c = c.replace("'20px solid #f3f4f6'", "'2px solid #0d1b2a'"); 
fs.writeFileSync('app/components/Certificados.js', c, 'utf8');
