const fs = require('fs');
const path = 'faces-dataset.json';
const db = JSON.parse(fs.readFileSync(path, 'utf8'));
const maxId = Math.max(...db.map(x => x.id));

const newEntries = [
  // 5 Animales
  {
    "id": maxId + 1,
    "title": "Gato Atigrado (Tres Cuartos Izquierdo)",
    "category": "gatos",
    "yaw": -45,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/cat_tabby_34_left.jpg",
    "fullUrl": "/assets/generated/cat_tabby_34_left.jpg"
  },
  {
    "id": maxId + 2,
    "title": "Lobo Gris Salvaje (Frente)",
    "category": "salvajes",
    "yaw": 0,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/wolf_front_view.jpg",
    "fullUrl": "/assets/generated/wolf_front_view.jpg"
  },
  {
    "id": maxId + 3,
    "title": "Cachorro Pastor Alemán (3/4 Der Arriba)",
    "category": "perros",
    "yaw": 45,
    "pitch": -15,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/puppy_shepherd_34_right.jpg",
    "fullUrl": "/assets/generated/puppy_shepherd_34_right.jpg"
  },
  {
    "id": maxId + 4,
    "title": "Chimpancé (Perfil Derecho)",
    "category": "salvajes",
    "yaw": 90,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/chimpanzee_profile_right.jpg",
    "fullUrl": "/assets/generated/chimpanzee_profile_right.jpg"
  },
  {
    "id": maxId + 5,
    "title": "Zorro Rojo (Perfil Izquierdo)",
    "category": "salvajes",
    "yaw": -90,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/fox_profile_left.jpg",
    "fullUrl": "/assets/generated/fox_profile_left.jpg"
  },

  // 3 Manos
  {
    "id": maxId + 6,
    "title": "Mano Sujetando Lápiz de Dibujo",
    "category": "todos",
    "yaw": 45,
    "pitch": -20,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/hand_holding_pencil.jpg",
    "fullUrl": "/assets/generated/hand_holding_pencil.jpg"
  },
  {
    "id": maxId + 7,
    "title": "Mano Vista Dorsal (Nuca / Dorso)",
    "category": "todos",
    "yaw": 180,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/hand_dorsal_back.jpg",
    "fullUrl": "/assets/generated/hand_dorsal_back.jpg"
  },
  {
    "id": maxId + 8,
    "title": "Mano Sujetando Vaso con Agua (Frente)",
    "category": "todos",
    "yaw": 0,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/hand_gripping_glass.jpg",
    "fullUrl": "/assets/generated/hand_gripping_glass.jpg"
  },

  // Personas: Latinos y Colorados
  {
    "id": maxId + 9,
    "title": "Hombre Latino 30 años (Frente)",
    "category": "hombres",
    "yaw": 0,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/latino_man_front.jpg",
    "fullUrl": "/assets/generated/latino_man_front.jpg"
  },
  {
    "id": maxId + 10,
    "title": "Mujer Latina Joven (Tres Cuartos Der)",
    "category": "mujeres",
    "yaw": 45,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/latina_woman_34_right.jpg",
    "fullUrl": "/assets/generated/latina_woman_34_right.jpg"
  },
  {
    "id": maxId + 11,
    "title": "Mujer Colorada / Pelirroja con Pecas (Perfil Izq)",
    "category": "mujeres",
    "yaw": -90,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/redhead_woman_profile.jpg",
    "fullUrl": "/assets/generated/redhead_woman_profile.jpg"
  },
  {
    "id": maxId + 12,
    "title": "Anciano Latino con Bigote (Contrapicado)",
    "category": "ancianos",
    "yaw": 0,
    "pitch": -35,
    "source": "Rooster Espacio de Arte",
    "author": "",
    "url": "/assets/generated/latino_elderly_low.jpg",
    "fullUrl": "/assets/generated/latino_elderly_low.jpg"
  }
];

db.push(...newEntries);
fs.writeFileSync(path, JSON.stringify(db, null, 2));
console.log(`Added ${newEntries.length} new references! Total now: ${db.length}`);
