const fs = require('fs');
let code = fs.readFileSync('components/Navbar.js', 'utf8');

if (!code.includes("tipo === 'COMUNIDAD'")) {
    code = code.replace(
        "if (tipo === 'DESAFIO') return <p>🏆 {n.mensaje}</p>;",
        "if (tipo === 'DESAFIO') return <p>🏆 {n.mensaje}</p>;\n                                                        if (tipo === 'COMUNIDAD') return <p>{n.mensaje}</p>;"
    );
    // There are weird encoded chars in the terminal earlier, I'll use regex to make sure it matches safely if needed,
    // but the exact string "if (tipo === 'DESAFIO') return <p>🏆 {n.mensaje}</p>;" might have encoding issues with the emoji.
    
    // Let's replace just by checking DESAFIO without the emoji.
    code = code.replace(
        /if \(tipo === 'DESAFIO'\).*?;/,
        "$& \n                                                        if (tipo === 'COMUNIDAD') return <p>{n.mensaje}</p>;"
    );

    fs.writeFileSync('components/Navbar.js', code);
}
