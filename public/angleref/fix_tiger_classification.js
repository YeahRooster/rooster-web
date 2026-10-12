const fs = require('fs');

let js = fs.readFileSync('app.js', 'utf8');

const oldIsAnimalRegex = /const isAnimal = \([^;]+;/;

const newIsAnimal = `const isAnimal = (
    text.includes('perro') || text.includes('gato') || text.includes('león') || text.includes('leon') || 
    text.includes('tigre') || text.includes('caballo') || text.includes('lobo') || text.includes('animal') || 
    text.includes('salvaje') || text.includes('cachorro') || text.includes('zorro') || text.includes('chimpancé') || 
    text.includes('chimpance') || text.includes('mono') || text.includes('felino') || text.includes('canino') || 
    text.includes('cuadrupedo') || text.includes('cuadrúpedo') || text.includes('oso') || text.includes('ciervo') || 
    text.includes('elefante') || text.includes('jirafa') || text.includes('ave') || text.includes('pájaro') || 
    text.includes('pajaro') || text.includes('reptil') || text.includes('yacaré') || text.includes('yacare')
  );`;

js = js.replace(oldIsAnimalRegex, newIsAnimal);

fs.writeFileSync('app.js', js);
console.log('Successfully added tigre and broader animal keywords to isAnimal!');
