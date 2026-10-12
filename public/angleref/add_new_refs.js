const fs = require('fs');

const path = 'faces-dataset.json';
const db = JSON.parse(fs.readFileSync(path, 'utf8'));

const maxId = Math.max(...db.map(x => x.id));

const dog = {
    "id": maxId + 1,
    "title": "Perro Golden Retriever (Frente)",
    "category": "perros",
    "yaw": 0,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio AI",
    "url": "/assets/generated/dog_front_view.jpg",
    "fullUrl": "/assets/generated/dog_front_view.jpg"
};

const hand = {
    "id": maxId + 2,
    "title": "Mano Humana (Palma de Frente)",
    "category": "todos",
    "yaw": 0,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio AI",
    "url": "/assets/generated/human_hand_front.jpg",
    "fullUrl": "/assets/generated/human_hand_front.jpg"
};

db.push(dog, hand);
fs.writeFileSync(path, JSON.stringify(db, null, 2));
console.log("Added 2 new references to dataset!");
