'use client';
import { useState, useEffect } from 'react';
import styles from './GalleryMarquee.module.css';

export default function GalleryMarquee() {
    const [images, setImages] = useState([]);

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                const res = await fetch('/api/v2/gallery/feature');
                const data = await res.json();
                if (data.status === 'success' && data.data.length > 0) {
                    setImages(data.data);
                }
            } catch (error) {
                console.error('Error fetching marquee:', error);
            }
        };

        fetchFeatured();
    }, []);

    if (images.length === 0) return null;

    return (
        <section className={styles.section}>
            <h2 className={styles.title}>Un vistazo a nuestra galería</h2>
            <div className={styles.marqueeContainer}>
                <div className={styles.marqueeContent}>
                    {/* Duplicamos las imágenes para el efecto de loop infinito */}
                    {[...images, ...images].map((img, index) => (
                        <div key={`${img.id}-${index}`} className={styles.imageCard}>
                            <img
                                src={img.imagen_url}
                                alt={`Obra de ${img.autor?.nombre || 'Alumno'}`}
                                className={styles.image}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
