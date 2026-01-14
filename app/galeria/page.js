import Image from 'next/image';

export default function GaleriaPage() {
    const images = [
        { src: '/images/exposition-poster.png', alt: 'Exposición Anual' },
        { src: '/images/manga-poster.png', alt: 'Arte Manga' },
        { src: '/images/talleres-flyer.png', alt: 'Talleres' },
        // Reusing for demo
        { src: '/images/manga-poster.png', alt: 'Trabajo de Alumno 1' },
        { src: '/images/exposition-poster.png', alt: 'Trabajo de Alumno 2' },
        { src: '/images/talleres-flyer.png', alt: 'Clase en vivo' },
    ];

    return (
        <div className="section-padding container">
            <h1 className="section-title text-center text-yellow" style={{ marginBottom: '2rem', fontSize: '3rem' }}>
                Galería de Arte
            </h1>
            <p className="text-center" style={{ marginBottom: '3rem', maxWidth: '700px', margin: '0 auto 3rem' }}>
                Una muestra del talento y la creatividad que se respira en Rooster.
                Trabajos de alumnos, exposiciones y momentos en el taller.
            </p>

            <div style={{
                columns: '3 300px',
                gap: '1rem'
            }}>
                {images.map((img, index) => (
                    <div key={index} style={{ breakInside: 'avoid', marginBottom: '1rem', borderRadius: '8px', overflow: 'hidden' }}>
                        <Image
                            src={img.src}
                            alt={img.alt}
                            width={500}
                            height={700}
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
