const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(
    /<option value="skull">.*?<\/option>\s*<option value="head">.*?<\/option>/s,
    `<option value="skull">Calavera Anatómica (Humano)</option>
            <option value="head">Cabeza Humana (Scan)</option>
            <option value="dog_skull">Cráneo de Perro (Animales)</option>
            <option value="human_body">Cuerpo Completo (Humano)</option>
            <option value="animal_body">Cuerpo Completo (Animal)</option>`
);
fs.writeFileSync('index.html', code);
