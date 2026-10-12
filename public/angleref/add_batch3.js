const fs = require('fs');
const path = 'faces-dataset.json';
const db = JSON.parse(fs.readFileSync(path, 'utf8'));
const maxId = Math.max(...db.map(x => x.id));

const newEntries = [
    {
        "id": maxId + 1,
        "title": "Hombre Joven (Gritando / Enojado)",
        "category": "hombres",
        "yaw": 0,
        "pitch": 0,
        "source": "Rooster Espacio de Arte",
        "author": "Estudio AI",
        "url": "/assets/generated/face_angry_front.jpg",
        "fullUrl": "/assets/generated/face_angry_front.jpg"
    },
    {
        "id": maxId + 2,
        "title": "Anciana (Sonriendo / Riendo)",
        "category": "ancianos",
        "yaw": -45,
        "pitch": -15,
        "source": "Rooster Espacio de Arte",
        "author": "Estudio AI",
        "url": "/assets/generated/face_laughing_34.jpg",
        "fullUrl": "/assets/generated/face_laughing_34.jpg"
    },
    {
        "id": maxId + 3,
        "title": "Mano (Sujetando Manzana)",
        "category": "todos",
        "yaw": 0,
        "pitch": -20,
        "source": "Rooster Espacio de Arte",
        "author": "Estudio AI",
        "url": "/assets/generated/hand_holding_apple.jpg",
        "fullUrl": "/assets/generated/hand_holding_apple.jpg"
    },
    {
        "id": maxId + 4,
        "title": "Mano (Empuñando Espada)",
        "category": "todos",
        "yaw": 90,
        "pitch": 0,
        "source": "Rooster Espacio de Arte",
        "author": "Estudio AI",
        "url": "/assets/generated/hand_holding_sword.jpg",
        "fullUrl": "/assets/generated/hand_holding_sword.jpg"
    }
];

db.push(...newEntries);
fs.writeFileSync(path, JSON.stringify(db, null, 2));
console.log("Added 4 new complex references!");
