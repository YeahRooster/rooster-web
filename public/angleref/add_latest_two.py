import os
import shutil
import json

brain_dir = r"C:\Users\Rooster\.gemini\antigravity\brain\11c41c51-e663-464e-9d62-528d92485afe"
app_dir = r"C:\Users\Rooster\.gemini\antigravity\scratch\angleref-app"
gen_dir = os.path.join(app_dir, "assets", "generated")
dataset_path = os.path.join(app_dir, "faces-dataset.json")

items_to_add = [
    {
        "src": "young_woman_high_angle_1791670998821.jpg",
        "title": "Mujer Joven en Picado (+45° Looking Down)",
        "category": "pitch_down",
        "yaw": 0,
        "pitch": 45,
        "author": "Estudio de Perspectiva IA"
    },
    {
        "src": "girl_pigtails_back_1791671069173.jpg",
        "title": "Niña 8 años con Trenzas de Espaldas (180° Nuca)",
        "category": "back_full",
        "yaw": 180,
        "pitch": 0,
        "author": "Estudio Infantil IA"
    }
]

with open(dataset_path, "r", encoding="utf-8") as f:
    current_dataset = json.load(f)

next_id = max(item["id"] for item in current_dataset) + 1

for item in items_to_add:
    src_file = os.path.join(brain_dir, item["src"])
    dest_file = os.path.join(gen_dir, item["src"])
    if os.path.exists(src_file):
        shutil.copy2(src_file, dest_file)
        print(f"Copied {item['src']}")
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

with open(dataset_path, "w", encoding="utf-8") as f:
    json.dump(current_dataset, f, indent=2, ensure_ascii=False)

print(f"Updated dataset. Total: {len(current_dataset)}")
