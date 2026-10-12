# AngleRef Studio - Prototipo Anatómico de Referencias

Herramienta interactiva para artistas, ilustradores y dibujantes para encontrar referencias fotográficas y anatómicas basadas en la pose de una calavera 3D interactiva (inspirada en [AngleRef](https://angleref.com)).

---

## 🚀 Servidor Local
El servidor está activo en:
👉 **[http://localhost:3000](http://localhost:3000)**

Para iniciarlo manualmente desde PowerShell:
```powershell
cd C:\Users\Rooster\.gemini\antigravity\scratch\angleref-app
node server.js
```

---

## ⚖️ Fuentes de Imágenes y Licencias
1. **Unsplash & Pexels:**
   * Ambas plataformas ofrecen licencias comerciales y no comerciales gratuitas para uso y visualización. Sin embargo, no son formalmente *Dominio Público (CC0)* en sentido estricto, sino licencias permisivas con APIs abiertas.
2. **Pinterest:**
   * Pinterest es un agregador de enlaces (scraping indexado de millones de sitios web), por lo que **no posee los derechos** de la mayoría de sus imágenes y muchas no son de libre uso.
3. **Wikimedia Commons & Museos con Open Access (Getty Museum):**
   * Son imágenes de dominio público (CC0 / Public Domain Mark), ideales para esculturas clásicas en 360° y pinturas históricas.
4. **Referencias Sintéticas Generadas por IA (HD / 8K):**
   * Generadas directamente en ángulos extremos (contrapicados, picados, vistas de nuca y 3/4 traseros) con iluminación de estudio, sin conflictos de derechos de autor ni marcas de agua. Se alojan en `assets/generated/`.

---

## 📐 Estructura del Catálogo Angular (`faces-dataset.json`)
Cada imagen cuenta con sus valores angulares calibrados:
- **`yaw`**: Ángulo horizontal ($-180^\circ$ a $+180^\circ$). $0^\circ$ = frente, $+90^\circ$ = perfil derecho, $-90^\circ$ = perfil izquierdo, $180^\circ$ = nuca.
- **`pitch`**: Ángulo vertical ($-90^\circ$ a $+90^\circ$). Negativo = contrapicado (desde abajo), Positivo = picado (desde arriba).
- **Filtro anisotrópico**: Pondera el pitch con factor 1.25 para asegurar que los contrapicados y picados sean estrictos.
