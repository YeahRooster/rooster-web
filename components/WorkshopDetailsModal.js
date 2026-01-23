import { useState } from 'react';
import Image from 'next/image';
import styles from './WorkshopDetailsModal.module.css';

export default function WorkshopDetailsModal({ workshop, onClose, onEnroll }) {
    if (!workshop) return null;

    const { shifts = [] } = workshop;

    // Limpiar el link de la imagen
    const validImage = (workshop.image && typeof workshop.image === 'string' && workshop.image.trim().startsWith('http'))
        ? workshop.image.trim()
        : '/images/logo.jpg';

    const [selectedShifts, setSelectedShifts] = useState([]);

    const toggleShift = (shift) => {
        if (selectedShifts.find(s => s.id === shift.id)) {
            setSelectedShifts(selectedShifts.filter(s => s.id !== shift.id));
        } else {
            // Permitir máximo 2 para el Taller de Dibujo, 1 para el resto (o según necesites)
            const max = workshop.title?.toUpperCase().includes('DIBUJO') ? 2 : 1;
            if (selectedShifts.length < max) {
                setSelectedShifts([...selectedShifts, shift]);
            } else {
                alert(`Para este taller solo podés seleccionar hasta ${max} horario${max > 1 ? 's' : ''}.`);
            }
        }
    };

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

                            <h3 className={styles.subtitle}>Seleccioná tus horarios:</h3>
                            <div className={styles.shiftList}>
                                {shifts.map((shift, index) => {
                                    const available = shift.seats - shift.enrolled;
                                    const isFull = available <= 0;
                                    const isSelected = selectedShifts.find(s => s.id === shift.id);

                                    return (
                                        <div key={index}
                                            className={`${styles.shiftItem} ${isSelected ? styles.selectedShift : ''}`}
                                            onClick={() => !isFull && toggleShift(shift)}
                                        >
                                            <div className={styles.shiftInfo}>
                                                <strong>{shift.day}</strong>
                                                <span>{shift.time}</span>
                                                <small className={isFull ? styles.full : ''}>
                                                    {isFull ? 'Cupo lleno' : `${available} lugares`}
                                                </small>
                                            </div>
                                            <div className={styles.selectionIndicator}>
                                                {isSelected ? '✅' : '➕'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                className={styles.confirmBtn}
                                disabled={selectedShifts.length === 0}
                                onClick={() => {
                                    onClose();
                                    onEnroll(selectedShifts); // Pasamos el array de seleccionados
                                }}
                            >
                                {selectedShifts.length > 0
                                    ? `Inscribirme en ${selectedShifts.length} horario${selectedShifts.length > 1 ? 's' : ''}`
                                    : 'Seleccioná un horario'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
