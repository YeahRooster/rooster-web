from PIL import Image, ImageOps
import os
import json

base_dir = r"C:\Users\Rooster\.gemini\antigravity\scratch\angleref-app"
gen_dir = os.path.join(base_dir, "assets", "generated")

mirrors = [
    {
        "src": "elderly_man_34_right_1791645388025.jpg",
        "dst": "elderly_man_34_left_mirror.jpg",
        "title": "Anciano con Barba Blanca (3/4 Izquierda -45°)",
        "category": "three_quarter_left",
        "yaw": -45,
        "pitch": 0,
        "author": "Estudio Geriátrico IA"
    },
    {
        "src": "child_boy_34_right_1791645459616.jpg",
        "dst": "child_boy_34_left_mirror.jpg",
        "title": "Niño 8 Años Sonriendo (3/4 Izquierda -45°)",
        "category": "three_quarter_left",
        "yaw": -45,
        "pitch": 0,
        "author": "Estudio Infantil IA"
    },
    {
        "src": "asian_woman_34_left_1791653132310.jpg",
        "dst": "asian_woman_34_right_mirror.jpg",
        "title": "Mujer Asiática 28 años (3/4 Derecha 45°)",
        "category": "three_quarter_right",
        "yaw": 45,
        "pitch": 0,
        "author": "Estudio de Retrato IA"
    },
    {
        "src": "elderly_woman_profile_1791645537376.jpg",
        "dst": "elderly_woman_profile_left_mirror.jpg",
        "title": "Anciana 80 años con Moño (Perfil Izquierdo -90°)",
        "category": "profile_left",
        "yaw": -90,
        "pitch": 0,
        "author": "Estudio Geriátrico IA"
    },
    {
        "src": "pure_side_profile_woman_1791643559644.jpg",
        "dst": "pure_side_profile_woman_right_mirror.jpg",
        "title": "Mujer Joven Silueta Pura (Perfil Derecho 90°)",
        "category": "profile_right",
        "yaw": 90,
        "pitch": 0,
        "author": "Estudio Anatómico IA"
    },
    {
        "src": "young_girl_profile_1791645616397.jpg",
        "dst": "young_girl_profile_right_mirror.jpg",
        "title": "Niña 7 años con Trenza (Perfil Derecho 90°)",
        "category": "profile_right",
        "yaw": 90,
        "pitch": 0,
        "author": "Estudio Infantil IA"
    },
    {
        "src": "three_quarter_low_angle_1791643827513.jpg",
        "dst": "three_quarter_low_angle_left_mirror.jpg",
        "title": "Contrapicado 3/4 Izquierdo con Barba (-40°, -25°)",
        "category": "pitch_up",
        "yaw": -40,
        "pitch": -25,
        "author": "Estudio de Perspectiva IA"
    },
    {
        "src": "three_quarter_back_man_1791643519249.jpg",
        "dst": "three_quarter_back_man_left_mirror.jpg",
        "title": "3/4 Trasero Izquierdo Masculino (-135° Back View)",
        "category": "back_three_quarter",
        "yaw": -135,
        "pitch": 0,
        "author": "Estudio Posterior IA"
    }
]

print("Generating mirrored assets...")
for m in mirrors:
    src_path = os.path.join(gen_dir, m["src"])
    dst_path = os.path.join(gen_dir, m["dst"])
    if os.path.exists(src_path):
        with Image.open(src_path) as im:
            flipped = ImageOps.mirror(im)
            flipped.save(dst_path, quality=95)
            print(f"Created {m['dst']}")
    else:
        print(f"Warning: source {src_path} not found")

print("Done generating mirrors.")
