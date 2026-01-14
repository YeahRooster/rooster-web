import Image from 'next/image';
import styles from './WorkshopDetailsModal.module.css';

export default function WorkshopDetailsModal({ workshop, onClose, onEnroll }) {
    if (!workshop) return null;

    const { shifts = [] } = workshop;

    // Limpiar el link de la imagen
    const validImage = (workshop.image && typeof workshop.image === 'string' && workshop.image.trim().startsWith('http'))
        ? workshop.image.trim()
        : '/images/logo.jpg';

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>&times;</button>

                <div className={styles.content}>
                    <div className={styles.imageColumn}>
                        <Image
                            src={validImage}
                            alt={workshop.title || 'Detalle del taller'}
                            width={500}
                            height={700}
                            className={styles.posterImage}
                            priority
                        />
                    </div>

                    <div className={styles.infoColumn}>
                        <h2 className={styles.title}>{workshop.title}</h2>
                        <div className={styles.scrollArea}>
                            <div className={styles.fullDescription}>
                                {workshop.fullDescription?.split('\n').map((line, i) => (
                                    <p key={i}>{line}</p>
                                ))}
                            </div>

                            <h3 className={styles.subtitle}>Horarios Disponibles:</h3>
                            <div className={styles.shiftList}>
                                {shifts.map((shift, index) => {
                                    const available = shift.seats - shift.enrolled;
                                    const isFull = available <= 0;
                                    return (
                                        <div key={index} className={styles.shiftItem}>
                                            <div className={styles.shiftInfo}>
                                                <strong>{shift.day}</strong>
                                                <span>{shift.time}</span>
                                                <small className={isFull ? styles.full : ''}>
                                                    {isFull ? 'Cupo lleno' : `${available} lugares`}
                                                </small>
                                            </div>
                                            <button
                                                className={styles.miniEnrollBtn}
                                                disabled={isFull}
                                                onClick={() => {
                                                    onClose();
                                                    onEnroll(shift);
                                                }}
                                            >
                                                {isFull ? 'Espera' : 'Anotarse'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
