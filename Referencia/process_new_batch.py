import os
import shutil
import json
from PIL import Image, ImageOps

brain_dir = r"C:\Users\Rooster\.gemini\antigravity\brain\11c41c51-e663-464e-9d62-528d92485afe"
app_dir = r"C:\Users\Rooster\.gemini\antigravity\scratch\angleref-app"
gen_dir = os.path.join(app_dir, "assets", "generated")
dataset_path = os.path.join(app_dir, "faces-dataset.json")

new_images = [
    {
        "src": "black_man_front_1791664140246.jpg",
        "title": "Hombre 32 años Rasurado (0° Frente)",
        "category": "front",
        "yaw": 0,
        "pitch": 0,
        "author": "Estudio Étnico IA",
        "mirror": False
    },
    {
        "src": "asian_elderly_woman_front_1791664177670.jpg",
        "title": "Anciana Asiática 68 años (0° Frente)",
        "category": "front",
        "yaw": 0,
        "pitch": 0,
        "author": "Estudio Geriátrico IA",
        "mirror": False
    },
    {
        "src": "caucasian_boy_front_1791664210307.jpg",
        "title": "Niño 9 años con Pecas (0° Frente)",
        "category": "front",
        "yaw": 0,
        "pitch": 0,
        "author": "Estudio Infantil IA",
        "mirror": False
    },
    {
        "src": "black_woman_34_left_1791664246508.jpg",
        "title": "Mujer con Trenzas (3/4 Izquierda -45°)",
        "category": "three_quarter_left",
        "yaw": -45,
        "pitch": 0,
        "author": "Estudio de Retrato IA",
        "mirror": True,
        "mirror_title": "Mujer con Trenzas (3/4 Derecha 45°)",
        "mirror_category": "three_quarter_right",
        "mirror_yaw": 45
    },
    {
        "src": "blonde_woman_34_right_1791664288902.jpg",
        "title": "Mujer Rubia Pómulos Marcados (3/4 Derecha 45°)",
        "category": "three_quarter_right",
        "yaw": 45,
        "pitch": 0,
        "author": "Estudio de Retrato IA",
        "mirror": True,
        "mirror_title": "Mujer Rubia Pómulos Marcados (3/4 Izquierda -45°)",
        "mirror_category": "three_quarter_left",
        "mirror_yaw": -45
    },
    {
        "src": "man_profile_left_1791664331762.jpg",
        "title": "Hombre 42 años Mandíbula Fuerte (Perfil Izquierdo -90°)",
        "category": "profile_left",
        "yaw": -90,
        "pitch": 0,
        "author": "Estudio Anatómico IA",
        "mirror": True,
        "mirror_title": "Hombre 42 años Mandíbula Fuerte (Perfil Derecho 90°)",
        "mirror_category": "profile_right",
        "mirror_yaw": 90
    },
    {
        "src": "black_man_profile_right_1791664391559.jpg",
        "title": "Hombre Joven Silueta Pura (Perfil Derecho 90°)",
        "category": "profile_right",
        "yaw": 90,
        "pitch": 0,
        "author": "Estudio Anatómico IA",
        "mirror": True,
        "mirror_title": "Hombre Joven Silueta Pura (Perfil Izquierdo -90°)",
        "mirror_category": "profile_left",
        "mirror_yaw": -90
    },
    {
        "src": "elderly_man_low_angle_1791664442952.jpg",
        "title": "Anciano con Barba Contrapicado (-40° Looking Up)",
        "category": "pitch_up",
        "yaw": 0,
        "pitch": -40,
        "author": "Estudio de Perspectiva IA",
        "mirror": False
    },
    {
        "src": "man_high_angle_down_1791664502058.jpg",
        "title": "Hombre Picado Cenital (+45° Looking Down)",
        "category": "pitch_down",
        "yaw": 0,
        "pitch": 45,
        "author": "Estudio de Perspectiva IA",
        "mirror": False
    },
    {
        "src": "woman_34_back_1791664563337.jpg",
        "title": "Mujer con Moño Alto (3/4 Trasero 135°)",
        "category": "back_three_quarter",
        "yaw": 135,
        "pitch": 0,
        "author": "Estudio Posterior IA",
        "mirror": True,
        "mirror_title": "Mujer con Moño Alto (3/4 Trasero Izquierdo -135°)",
        "mirror_category": "back_three_quarter",
        "mirror_yaw": -135
    },
    {
        "src": "elderly_man_nape_back_1791664627309.jpg",
        "title": "Anciano Nuca y Cuello (Direct Back 180°)",
        "category": "back_full",
        "yaw": 180,
        "pitch": 0,
        "author": "Estudio Posterior IA",
        "mirror": False
    }
]

# Load existing dataset
with open(dataset_path, "r", encoding="utf-8") as f:
    current_dataset = json.load(f)

next_id = max(item["id"] for item in current_dataset) + 1

for item in new_images:
    src_file = os.path.join(brain_dir, item["src"])
    dest_file = os.path.join(gen_dir, item["src"])
    if os.path.exists(src_file):
        shutil.copy2(src_file, dest_file)
        print(f"Copied {item['src']}")
        
        # Add original entry
        current_dataset.append({
            "id": next_id,
            "title": item["title"],
            "category": item["category"],
            "yaw": item["yaw"],
            "pitch": item["pitch"],
            "source": "Rooster Espacio de Arte",
            "author": item["author"],
            "url": f"/assets/generated/{item['src']}",
            "fullUrl": f"/assets/generated/{item['src']}"
        })
        next_id += 1

        # Process mirror if requested
        if item.get("mirror"):
            base_name = os.path.splitext(item["src"])[0]
            mirror_filename = f"{base_name}_mirror.jpg"
            mirror_path = os.path.join(gen_dir, mirror_filename)
            with Image.open(dest_file) as im:
                flipped = ImageOps.mirror(im)
                flipped.save(mirror_path, quality=95)
                print(f"Created mirror {mirror_filename}")
            
            current_dataset.append({
                "id": next_id,
                "title": item["mirror_title"],
                "category": item["mirror_category"],
                "yaw": item["mirror_yaw"],
                "pitch": item["pitch"],
                "source": "Rooster Espacio de Arte",
                "author": item["author"],
                "url": f"/assets/generated/{mirror_filename}",
                "fullUrl": f"/assets/generated/{mirror_filename}"
            })
            next_id += 1
    else:
        print(f"Source not found: {src_file}")

with open(dataset_path, "w", encoding="utf-8") as f:
    json.dump(current_dataset, f, indent=2, ensure_ascii=False)

print(f"Dataset successfully updated! Total items: {len(current_dataset)}")
