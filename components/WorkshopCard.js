import Image from 'next/image';
import styles from './WorkshopCard.module.css';

export default function WorkshopCard({ workshop, onClick, onEnroll }) {
    const { title, description, image, shifts = [] } = workshop;

    // Limpiar el link de la imagen por si tiene espacios
    const validImage = (image && typeof image === 'string' && image.trim().startsWith('http'))
        ? image.trim()
        : '/images/logo.jpg';

    // Verificar si hay algún turno con lugar
    const hasAvailability = shifts.some(s => (s.seats - s.enrolled) > 0);
    const isMultiShift = shifts.length > 1;

    return (
        <div className={styles.card} onClick={onClick}>
            <div className={styles.imageContainer}>
                <Image
                    src={validImage}
                    alt={title || 'Taller'}
                    fill
                    className={styles.image}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    priority={false}
                />
            </div>
            <div className={styles.content}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.info}>{description}</p>

                <div className={styles.schedule}>
                    {isMultiShift ? (
                        <span>📅 {shifts.length} horarios disponibles</span>
                    ) : (
                        shifts[0] ? (
                            <>
                                <span>📅 {shifts[0].day}</span>
                                <span>⏰ {shifts[0].time}</span>
                            </>
                        ) : <span>No hay horarios</span>
                    )}
                </div>

                <div className={styles.seats}>
                    <span className={`${styles.cupoTag} ${!hasAvailability ? styles.cupoFull : ''}`}>
                        {!hasAvailability ? 'Cupo Completo' : 'Lugares Disponibles'}
                    </span>
                    <button
                        className={styles.enrollBtn}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isMultiShift) {
                                onClick();
                            } else if (shifts[0]) {
                                onEnroll(shifts[0]);
                            }
                        }}
                    >
                        Inscribirse
                    </button>
                </div>
            </div>
        </div>
    );
}
