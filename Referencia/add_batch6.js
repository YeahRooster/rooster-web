const fs = require('fs');
const path = 'faces-dataset.json';
const db = JSON.parse(fs.readFileSync(path, 'utf8'));
const maxId = Math.max(...db.map(x => x.id));

const newEntries = [
  // 4 Cuerpos Humanos Diversos
  {
    "id": maxId + 1,
    "title": "Mujer Contextura Natural (Frente - Cuerpo Completo)",
    "category": "mujeres",
    "yaw": 0,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/woman_body_average_front.jpg",
    "fullUrl": "/assets/generated/woman_body_average_front.jpg"
  },
  {
    "id": maxId + 2,
    "title": "Hombre Joven Delgado y Esbelto (3/4 Der - Cuerpo Completo)",
    "category": "hombres",
    "yaw": 45,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/man_body_slender_34.jpg",
    "fullUrl": "/assets/generated/man_body_slender_34.jpg"
  },
  {
    "id": maxId + 3,
    "title": "Hombre Contextura Robusta / Corpulenta (Perfil Der - Cuerpo Completo)",
    "category": "hombres",
    "yaw": 90,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/man_body_robust_profile.jpg",
    "fullUrl": "/assets/generated/man_body_robust_profile.jpg"
  },
  {
    "id": maxId + 4,
    "title": "Mujer Curvas Naturales en Contrapposto (3/4 Izq - Cuerpo Completo)",
    "category": "mujeres",
    "yaw": -45,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/woman_body_curvy_34.jpg",
    "fullUrl": "/assets/generated/woman_body_curvy_34.jpg"
  },

  // 4 Animales Cuerpo Completo
  {
    "id": maxId + 5,
    "title": "Caballo Pura Sangre de Pie (Perfil Izquierdo - Cuerpo Completo)",
    "category": "cuadrupedos",
    "yaw": -90,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/horse_body_profile_left.jpg",
    "fullUrl": "/assets/generated/horse_body_profile_left.jpg"
  },
  {
    "id": maxId + 6,
    "title": "Perro Pastor Alemán de Pie (Perfil Derecho - Cuerpo Completo)",
    "category": "caninos",
    "yaw": 90,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/dog_body_shepherd_profile.jpg",
    "fullUrl": "/assets/generated/dog_body_shepherd_profile.jpg"
  },
  {
    "id": maxId + 7,
    "title": "Tigre de Bengala de Pie (3/4 Derecho - Cuerpo Completo)",
    "category": "felinos",
    "yaw": 45,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/tiger_body_standing_34.jpg",
    "fullUrl": "/assets/generated/tiger_body_standing_34.jpg"
  },
  {
    "id": maxId + 8,
    "title": "Gato Común de Pie (3/4 Izquierdo - Cuerpo Completo)",
    "category": "felinos",
    "yaw": -45,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/cat_body_standing_34.jpg",
    "fullUrl": "/assets/generated/cat_body_standing_34.jpg"
  }
];

db.push(...newEntries);
fs.writeFileSync(path, JSON.stringify(db, null, 2));
console.log(`Added 8 new full body references! Total dataset items: ${db.length}`);
