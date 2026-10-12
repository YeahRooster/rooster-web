from PIL import Image
import os
import json

base_dir = r"C:\Users\Usuario\Desktop\Pagina Rooster\rooster-web\Referencia"
generated_dir = os.path.join(base_dir, "assets", "generated")
thumbs_dir = os.path.join(base_dir, "assets", "thumbs")
dataset_path = os.path.join(base_dir, "faces-dataset.json")

os.makedirs(thumbs_dir, exist_ok=True)

with open(dataset_path, "r", encoding="utf-8") as f:
    dataset = json.load(f)

total_orig_bytes = 0
total_webp_bytes = 0
converted_count = 0

for item in dataset:
    # Determinar el archivo original en alta resolución
    orig_rel = item.get("fullUrl") or item.get("url") or ""
    if orig_rel.startswith("/"):
        orig_rel = orig_rel[1:]

    # Si ya apuntaba a thumbs, reconstruir hacia generated
    if orig_rel.startswith("assets/thumbs/"):
        base_name = os.path.splitext(os.path.basename(orig_rel))[0]
        orig_rel = f"assets/generated/{base_name}.jpg"

    orig_abs = os.path.join(base_dir, orig_rel.replace("/", os.sep))
    if not os.path.exists(orig_abs):
        print(f"Advertencia: No existe {orig_abs}")
        continue

    base_name = os.path.splitext(os.path.basename(orig_abs))[0]
    thumb_filename = f"{base_name}.webp"
    thumb_abs = os.path.join(thumbs_dir, thumb_filename)
    thumb_rel = f"assets/thumbs/{thumb_filename}"

    orig_size = os.path.getsize(orig_abs)
    total_orig_bytes += orig_size

    with Image.open(orig_abs) as img:
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        # Ancho 440px para nitidez Retina en tarjetas
        target_w = 440
        if img.width > target_w:
            ratio = target_w / float(img.width)
            target_h = int(float(img.height) * ratio)
            thumb_img = img.resize((target_w, target_h), Image.Resampling.LANCZOS)
        else:
            thumb_img = img.copy()

        thumb_img.save(thumb_abs, "WEBP", quality=82, method=6)

    webp_size = os.path.getsize(thumb_abs)
    total_webp_bytes += webp_size
    converted_count += 1

    # Actualizar dataset: url = miniatura rápida WebP, fullUrl = original HD
    item["url"] = thumb_rel
    item["fullUrl"] = orig_rel

with open(dataset_path, "w", encoding="utf-8") as f:
    json.dump(dataset, f, indent=2, ensure_ascii=False)

orig_mb = total_orig_bytes / (1024 * 1024)
webp_mb = total_webp_bytes / (1024 * 1024)
saving_pct = (1 - (total_webp_bytes / total_orig_bytes)) * 100 if total_orig_bytes else 0

print(f"Miniaturas generadas: {converted_count}")
print(f"Peso total original: {orig_mb:.2f} MB -> Peso total miniaturas WebP: {webp_mb:.2f} MB")
print(f"Reducción total de peso en galería: {saving_pct:.1f}%")
