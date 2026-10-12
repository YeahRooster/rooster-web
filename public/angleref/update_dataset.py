import json
import os

base_dir = r"C:\Users\Rooster\.gemini\antigravity\scratch\angleref-app"
dataset_path = os.path.join(base_dir, "faces-dataset.json")

dataset = [
  {
    "id": 1,
    "title": "Mujer Joven de Frente (0° Vista Frontal)",
    "category": "front",
    "yaw": 0,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio de Retrato IA",
    "url": "/assets/generated/young_woman_front_1791652985526.jpg",
    "fullUrl": "/assets/generated/young_woman_front_1791652985526.jpg"
  },
  {
    "id": 2,
    "title": "Anciano con Barba Blanca (3/4 Derecha 45°)",
    "category": "three_quarter_right",
    "yaw": 45,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio Geriátrico IA",
    "url": "/assets/generated/elderly_man_34_right_1791645388025.jpg",
    "fullUrl": "/assets/generated/elderly_man_34_right_1791645388025.jpg"
  },
  {
    "id": 3,
    "title": "Niño 8 Años Sonriendo (3/4 Derecha 45°)",
    "category": "three_quarter_right",
    "yaw": 45,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio Infantil IA",
    "url": "/assets/generated/child_boy_34_right_1791645459616.jpg",
    "fullUrl": "/assets/generated/child_boy_34_right_1791645459616.jpg"
  },
  {
    "id": 4,
    "title": "Mujer Asiática 28 años (3/4 Derecha 45°)",
    "category": "three_quarter_right",
    "yaw": 45,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio de Retrato IA",
    "url": "/assets/generated/asian_woman_34_right_mirror.jpg",
    "fullUrl": "/assets/generated/asian_woman_34_right_mirror.jpg"
  },
  {
    "id": 5,
    "title": "Mujer Asiática 28 años (3/4 Izquierda -45°)",
    "category": "three_quarter_left",
    "yaw": -45,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio de Retrato IA",
    "url": "/assets/generated/asian_woman_34_left_1791653132310.jpg",
    "fullUrl": "/assets/generated/asian_woman_34_left_1791653132310.jpg"
  },
  {
    "id": 6,
    "title": "Anciano con Barba Blanca (3/4 Izquierda -45°)",
    "category": "three_quarter_left",
    "yaw": -45,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio Geriátrico IA",
    "url": "/assets/generated/elderly_man_34_left_mirror.jpg",
    "fullUrl": "/assets/generated/elderly_man_34_left_mirror.jpg"
  },
  {
    "id": 7,
    "title": "Niño 8 Años Sonriendo (3/4 Izquierda -45°)",
    "category": "three_quarter_left",
    "yaw": -45,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio Infantil IA",
    "url": "/assets/generated/child_boy_34_left_mirror.jpg",
    "fullUrl": "/assets/generated/child_boy_34_left_mirror.jpg"
  },
  {
    "id": 8,
    "title": "Anciana 80 años con Moño (Perfil Puro 90°)",
    "category": "profile_right",
    "yaw": 90,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio Geriátrico IA",
    "url": "/assets/generated/elderly_woman_profile_1791645537376.jpg",
    "fullUrl": "/assets/generated/elderly_woman_profile_1791645537376.jpg"
  },
  {
    "id": 9,
    "title": "Mujer Joven Silueta Pura (Perfil Derecho 90°)",
    "category": "profile_right",
    "yaw": 90,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio Anatómico IA",
    "url": "/assets/generated/pure_side_profile_woman_right_mirror.jpg",
    "fullUrl": "/assets/generated/pure_side_profile_woman_right_mirror.jpg"
  },
  {
    "id": 10,
    "title": "Niña 7 años con Trenza (Perfil Derecho 90°)",
    "category": "profile_right",
    "yaw": 90,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio Infantil IA",
    "url": "/assets/generated/young_girl_profile_right_mirror.jpg",
    "fullUrl": "/assets/generated/young_girl_profile_right_mirror.jpg"
  },
  {
    "id": 11,
    "title": "Mujer Joven Silueta Pura (Perfil Izquierdo -90°)",
    "category": "profile_left",
    "yaw": -90,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio Anatómico IA",
    "url": "/assets/generated/pure_side_profile_woman_1791643559644.jpg",
    "fullUrl": "/assets/generated/pure_side_profile_woman_1791643559644.jpg"
  },
  {
    "id": 12,
    "title": "Niña 7 años con Trenza (Perfil Izquierdo -90°)",
    "category": "profile_left",
    "yaw": -90,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio Infantil IA",
    "url": "/assets/generated/young_girl_profile_1791645616397.jpg",
    "fullUrl": "/assets/generated/young_girl_profile_1791645616397.jpg"
  },
  {
    "id": 13,
    "title": "Anciana 80 años con Moño (Perfil Izquierdo -90°)",
    "category": "profile_left",
    "yaw": -90,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio Geriátrico IA",
    "url": "/assets/generated/elderly_woman_profile_left_mirror.jpg",
    "fullUrl": "/assets/generated/elderly_woman_profile_left_mirror.jpg"
  },
  {
    "id": 14,
    "title": "Contrapicado Frontal Masculino (-35°)",
    "category": "pitch_up",
    "yaw": 0,
    "pitch": -35,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio de Perspectiva IA",
    "url": "/assets/generated/low_angle_male_portrait_1791643412152.jpg",
    "fullUrl": "/assets/generated/low_angle_male_portrait_1791643412152.jpg"
  },
  {
    "id": 15,
    "title": "Contrapicado Extremo Femenino (-45° Looking Up)",
    "category": "pitch_up",
    "yaw": 0,
    "pitch": -45,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio de Perspectiva IA",
    "url": "/assets/generated/extreme_low_angle_woman_1791643726040.jpg",
    "fullUrl": "/assets/generated/extreme_low_angle_woman_1791643726040.jpg"
  },
  {
    "id": 16,
    "title": "Contrapicado 3/4 Masculino con Barba (40°, -25°)",
    "category": "pitch_up",
    "yaw": 40,
    "pitch": -25,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio de Perspectiva IA",
    "url": "/assets/generated/three_quarter_low_angle_1791643827513.jpg",
    "fullUrl": "/assets/generated/three_quarter_low_angle_1791643827513.jpg"
  },
  {
    "id": 17,
    "title": "Contrapicado 3/4 Izquierdo con Barba (-40°, -25°)",
    "category": "pitch_up",
    "yaw": -40,
    "pitch": -25,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio de Perspectiva IA",
    "url": "/assets/generated/three_quarter_low_angle_left_mirror.jpg",
    "fullUrl": "/assets/generated/three_quarter_low_angle_left_mirror.jpg"
  },
  {
    "id": 18,
    "title": "Picado Cenital Femenino (+45°)",
    "category": "pitch_down",
    "yaw": 0,
    "pitch": 45,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio de Perspectiva IA",
    "url": "/assets/generated/high_angle_looking_down_1791643477864.jpg",
    "fullUrl": "/assets/generated/high_angle_looking_down_1791643477864.jpg"
  },
  {
    "id": 19,
    "title": "Anciana Mirando hacia Abajo (+55° Picado Extremo)",
    "category": "pitch_down",
    "yaw": 0,
    "pitch": 55,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio Geriátrico IA",
    "url": "/assets/generated/elderly_woman_high_angle_1791645700236.jpg",
    "fullUrl": "/assets/generated/elderly_woman_high_angle_1791645700236.jpg"
  },
  {
    "id": 20,
    "title": "3/4 Trasero Masculino (135° Back View)",
    "category": "back_three_quarter",
    "yaw": 135,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio Posterior IA",
    "url": "/assets/generated/three_quarter_back_man_1791643519249.jpg",
    "fullUrl": "/assets/generated/three_quarter_back_man_1791643519249.jpg"
  },
  {
    "id": 21,
    "title": "3/4 Trasero Izquierdo Masculino (-135° Back View)",
    "category": "back_three_quarter",
    "yaw": -135,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio Posterior IA",
    "url": "/assets/generated/three_quarter_back_man_left_mirror.jpg",
    "fullUrl": "/assets/generated/three_quarter_back_man_left_mirror.jpg"
  },
  {
    "id": 22,
    "title": "Nuca Femenina con Trenzas (Direct Back 180°)",
    "category": "back_full",
    "yaw": 180,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio Posterior IA",
    "url": "/assets/generated/back_head_nape_woman_1791643443787.jpg",
    "fullUrl": "/assets/generated/back_head_nape_woman_1791643443787.jpg"
  },
  {
    "id": 23,
    "title": "Nuca Masculina Corte Rapado (Direct Back 180°)",
    "category": "back_full",
    "yaw": 180,
    "pitch": 0,
    "source": "Rooster Espacio de Arte",
    "author": "Estudio Posterior IA",
    "url": "/assets/generated/back_head_nape_man_1791643775125.jpg",
    "fullUrl": "/assets/generated/back_head_nape_man_1791643775125.jpg"
  }
]

with open(dataset_path, "w", encoding="utf-8") as f:
    json.dump(dataset, f, indent=2, ensure_ascii=False)

print(f"Updated dataset with {len(dataset)} verified studio portraits.")
