const fs = require('fs');
const path = 'faces-dataset.json';
const db = JSON.parse(fs.readFileSync(path, 'utf8'));
const maxId = Math.max(...db.map(x => x.id));

const newEntries = [
  // Cuerpos Humanos - Picado y Contrapicado
  {
    "id": maxId + 1,
    "title": "Hombre de Pie (Contrapicado Frontal - Cuerpo Completo)",
    "category": "hombres",
    "yaw": 0,
    "pitch": -35,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/human_body_man_low_angle.jpg",
    "fullUrl": "/assets/generated/human_body_man_low_angle.jpg"
  },
  {
    "id": maxId + 2,
    "title": "Mujer de Pie (Picado 3/4 Der - Cuerpo Completo)",
    "category": "mujeres",
    "yaw": 45,
    "pitch": 35,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/human_body_woman_high_angle.jpg",
    "fullUrl": "/assets/generated/human_body_woman_high_angle.jpg"
  },
  {
    "id": maxId + 3,
    "title": "Mujer en Pose Dinámica (Contrapicado 3/4 Izq - Cuerpo Completo)",
    "category": "mujeres",
    "yaw": -45,
    "pitch": -35,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/human_body_woman_low_angle.jpg",
    "fullUrl": "/assets/generated/human_body_woman_low_angle.jpg"
  },
  {
    "id": maxId + 4,
    "title": "Hombre de Pie (Picado Frontal - Cuerpo Completo)",
    "category": "hombres",
    "yaw": 0,
    "pitch": 40,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/human_body_man_high_angle.jpg",
    "fullUrl": "/assets/generated/human_body_man_high_angle.jpg"
  },

  // Animales - Picado y Contrapicado
  {
    "id": maxId + 5,
    "title": "Perro Labrador de Pie (Picado Frontal - Cuerpo Completo)",
    "category": "caninos",
    "yaw": 0,
    "pitch": 40,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/animal_body_dog_high_angle.jpg",
    "fullUrl": "/assets/generated/animal_body_dog_high_angle.jpg"
  },
  {
    "id": maxId + 6,
    "title": "Caballo Tordillo de Pie (Contrapicado 3/4 - Cuerpo Completo)",
    "category": "cuadrupedos",
    "yaw": 45,
    "pitch": -35,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/animal_body_horse_low_angle.jpg",
    "fullUrl": "/assets/generated/animal_body_horse_low_angle.jpg"
  }
];

db.push(...newEntries);
fs.writeFileSync(path, JSON.stringify(db, null, 2));
console.log(`Added ${newEntries.length} new full-body picado/contrapicado references! Total items now: ${db.length}`);
