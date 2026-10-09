const fs = require('fs');
let code = fs.readFileSync('components/Navbar.js', 'utf8');

// Remove all occurrences
code = code.split("if (tipo === 'COMUNIDAD') return <p>{n.mensaje}</p>;").join("");

// Add back exactly once after DESAFIO
code = code.replace(
    /if \(tipo === 'DESAFIO'\).*?;/,
    "$& \n                                                        if (tipo === 'COMUNIDAD') return <p>{n.mensaje}</p>;"
);

fs.writeFileSync('components/Navbar.js', code);
