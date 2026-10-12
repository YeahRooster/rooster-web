const fs = require('fs');
const path = 'faces-dataset.json';
const db = JSON.parse(fs.readFileSync(path, 'utf8'));
const maxId = Math.max(...db.map(x => x.id));

const newEntries = [
    {
        "id": maxId + 1,
        "title": "Hombre Mayor Calvo (Picado Extremo Cenital)",
        "category": "ancianos",
        "yaw": 0,
        "pitch": 60,
        "source": "Rooster Espacio de Arte",
        "author": "Estudio AI",
        "url": "/assets/generated/face_extreme_topdown.jpg",
        "fullUrl": "/assets/generated/face_extreme_topdown.jpg"
    },
    {
        "id": maxId + 2,
        "title": "Mujer Joven (Perfil Contrapicado Extremo)",
        "category": "mujeres",
        "yaw": 90,
        "pitch": -45,
        "source": "Rooster Espacio de Arte",
        "author": "Estudio AI",
        "url": "/assets/generated/face_profile_low.jpg",
        "fullUrl": "/assets/generated/face_profile_low.jpg"
    },
    {
        "id": maxId + 3,
        "title": "Mano Señalando (Perspectiva Frontal / Escorzo)",
        "category": "todos",
        "yaw": 0,
        "pitch": 0,
        "source": "Rooster Espacio de Arte",
        "author": "Estudio AI",
        "url": "/assets/generated/hand_pointing.jpg",
        "fullUrl": "/assets/generated/hand_pointing.jpg"
    },
    {
        "id": maxId + 4,
        "title": "Mano en Garra (Cenital Hacia Abajo)",
        "category": "todos",
        "yaw": 0,
        "pitch": 45,
        "source": "Rooster Espacio de Arte",
        "author": "Estudio AI",
        "url": "/assets/generated/hand_clawing.jpg",
        "fullUrl": "/assets/generated/hand_clawing.jpg"
    }
];

db.push(...newEntries);
fs.writeFileSync(path, JSON.stringify(db, null, 2));
console.log("Added 4 extreme angles successfully!");
