const fs = require('fs');
const path = 'faces-dataset.json';
const db = JSON.parse(fs.readFileSync(path, 'utf8'));
const maxId = Math.max(...db.map(x => x.id));

const newEntries = [
    {
        "id": maxId + 1,
        "title": "Puño Cerrado (Perfil)",
        "category": "todos",
        "yaw": 90,
        "pitch": 0,
        "source": "Rooster Espacio de Arte",
        "author": "Estudio AI",
        "url": "/assets/generated/hand_fist_profile.jpg",
        "fullUrl": "/assets/generated/hand_fist_profile.jpg"
    },
    {
        "id": maxId + 2,
        "title": "Cachorro de León (3/4 Derecho Arriba)",
        "category": "salvajes",
        "yaw": 45,
        "pitch": -30,
        "source": "Rooster Espacio de Arte",
        "author": "Estudio AI",
        "url": "/assets/generated/lion_cub_up_right.jpg",
        "fullUrl": "/assets/generated/lion_cub_up_right.jpg"
    },
    {
        "id": maxId + 3,
        "title": "Mujer Adulta (Contrapicado Frontal)",
        "category": "mujeres",
        "yaw": 0,
        "pitch": -45,
        "source": "Rooster Espacio de Arte",
        "author": "Estudio AI",
        "url": "/assets/generated/woman_contrapicado.jpg",
        "fullUrl": "/assets/generated/woman_contrapicado.jpg"
    },
    {
        "id": maxId + 4,
        "title": "Caballo (Perfil Izquierdo)",
        "category": "todos",
        "yaw": -90,
        "pitch": 0,
        "source": "Rooster Espacio de Arte",
        "author": "Estudio AI",
        "url": "/assets/generated/horse_profile_left.jpg",
        "fullUrl": "/assets/generated/horse_profile_left.jpg"
    }
];

db.push(...newEntries);
fs.writeFileSync(path, JSON.stringify(db, null, 2));
console.log("Added 4 new complex references!");
