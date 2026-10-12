const fs = require('fs');
const path = 'faces-dataset.json';
const db = JSON.parse(fs.readFileSync(path, 'utf8'));
const maxId = Math.max(...db.map(x => x.id));

const newEntry = {
  "id": maxId + 1,
  "title": "Hombre Atlético de Pie (Cuerpo Completo)",
  "category": "hombres",
  "yaw": 0,
  "pitch": 0,
  "source": "Rooster Espacio de Arte",
  "author": "",
  "url": "/assets/generated/human_body_man_front.jpg",
  "fullUrl": "/assets/generated/human_body_man_front.jpg"
};

db.push(newEntry);
fs.writeFileSync(path, JSON.stringify(db, null, 2));
console.log(`Added full body man! Total items: ${db.length}`);
