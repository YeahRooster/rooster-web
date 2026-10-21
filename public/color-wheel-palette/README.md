# Color Wheel Studio (Prototipo Adobe Color & Adobe Express)

Prototipo interactivo de rueda cromática, generador de paletas armónicas, **extractor de colores a partir de imágenes**, **simulador de accesibilidad y daltonismo**, **previsualizador de UI real**, **biblioteca de favoritos** y **generador de degradados CSS**.

Desarrollado en **Vanilla JavaScript (ES6+), HTML5 Canvas y CSS3**, 100% nativo, con diseño vectorial SVG monocromático y sin dependencias externas.

---

## 🚀 Cómo abrirlo y probarlo

1. Ve a tu Escritorio en la carpeta:
   👉 `C:\Users\Rooster\Desktop\color-wheel-palette`
2. Haz **doble clic en `index.html`** para abrirlo en tu navegador.
3. ¡Listo! Funciona de inmediato y 100% offline.

---

## ✨ Todas las Funcionalidades Integradas

### 1. 🎨 Rueda Cromática & Armonías
- Espectro HSV completo en Canvas High-DPI con nodos arrastrables y líneas de relación geométrica.
- **10 Reglas de Armonía de Adobe Color**: Personalizado, Análogos, Complementarios, Complementarios Divididos, Tríada, Cuadrado, Compuesto, Monocromático, Doble Separación y Tonos.
- Carrusel horizontal con **iconos vectoriales SVG monocromáticos** y tooltips en tiempo real.
- **5 Columnas Altas de Muestra**: Código `#HEX` editable, copiado con 1 clic, indicador de color base y sliders RGB desplegables.

### 2. 🔒 Bloqueo de Colores Individuales (Candado)
- Cada columna de color cuenta con un **botón de candado** en la esquina superior derecha.
- Bloquea los colores que más te gusten: al presionar **"Aleatorio"** (o la barra espaciadora), los tonos con candado se mantendrán fijos y solo se recalcularán los demás de manera armónica.

### 3. 🖼️ Extractor de Imagen Inteligente (Extract Theme)
- Arrastra cualquier fotografía (`JPG`, `PNG`, `WEBP`) para extraer automáticamente 5 colores representativos mediante agrupamiento *K-Means*.
- **5 Marcadores Circulares Interactivos sobre la foto**: Arrástralos libremente por la imagen para muestrear píxeles en vivo.
- Filtros de estado de ánimo (*Colorido*, *Brillante*, *Suave*, *Profundo*, *Oscuro*).
- Botón para transferir la paleta extraída a la rueda de color con 1 solo clic.

### 4. 🖥️ Vista Previa en UI Real (Mockup Interactivo)
- Pestaña que aplica en tiempo real los 5 colores en una interfaz web completa (Navbar, Hero, Botones CTA, Badges y Tarjetas de producto).
- Botón **"Rotar Asignación"**: Reordena qué color se usa en el botón, el fondo o el texto para explorar variantes al instante.
- Botón **"Invertir Fondo"**: Alterna el mockup entre modo claro y oscuro.

### 5. 👁️ Simulador de Daltonismo y Accesibilidad WCAG
- Simula con precisión matemática (*algoritmo de Brettel/Machado*) la percepción visual para 4 tipos de daltonismo:
  - **Deuteranopía** (ceguera al verde)
  - **Protanopía** (ceguera al rojo)
  - **Tritanopía** (ceguera al azul)
  - **Acromatopsia** (monocromía en escala de grises)
- **Detector de Conflictos**: Alerta si dos colores de la paleta resultan indistinguibles entre sí para personas con daltonismo.
- **Matriz de Contraste WCAG 2.1**: Evalúa todos los cruces de fondo vs texto informando cumplimiento **AA** (4.5:1) y **AAA** (7.0:1).

### 6. 🌈 Generador de Degradados CSS (CSS Gradients)
- Generador visual de degradados lineales (`0°` a `360°`) y radiales.
- Selector interactivo de paradas para incluir o excluir colores de la paleta.
- Código CSS generado listo para copiar: `background: linear-gradient(...)`.

### 7. 💾 Biblioteca de Paletas Guardadas (Favoritos)
- Botón **"Mis Paletas"** en la barra superior que abre un panel lateral deslizante.
- Guarda tus paletas favoritas con nombres personalizados directamente en el navegador (`localStorage`).
- Incluye 3 paletas predeterminadas de inspiración (*Cyberpunk Neon*, *Atardecer Mediterráneo*, *Nórdico Minimalista*).
- Botones para restaurar en la rueda, copiar CSS o eliminar.

### 8. 🎚️ Ajustes Globales de Paleta
- Menú desplegable **"Ajustes"**:
  - **Temperatura**: Desplaza la paleta hacia tonos fríos o cálidos.
  - **Saturación Global**: De tonos pastel a colores ultra saturados.
  - **Brillo Global**: Ajuste fino de luminosidad en conjunto.
  - Botón de restablecimiento a valores iniciales.

---

## 📂 Estructura de Archivos

```text
color-wheel-palette/
├── index.html            # Estructura principal, pestañas de herramientas y modales
├── README.md             # Documentación exhaustiva
├── css/
│   └── styles.css        # Estilos modernos, temas dark/light, mockups y animaciones
└── js/
    ├── color-math.js     # Matemáticas de color, conversiones, daltonismo y contraste
    ├── wheel.js          # Rueda cromática Canvas interactiva
    ├── palette-library.js# Administrador de LocalStorage y biblioteca de favoritos
    ├── image-extractor.js# Motor de análisis de imagen, clustering K-Means y pines
    └── app.js            # Controlador integral de la aplicación
```
