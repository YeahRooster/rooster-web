'use client';
import { useState } from 'react';
import styles from './EnrollmentModal.module.css';

export default function EnrollmentModal({ workshop, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        dni: '',
        city: 'Santa Fe',
        locality: '',
        address: '',
        phone: '',
        noPhone: false,
        parentPhone: '',
        isMinor: false,
        tutorName: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/enroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, workshopTitle: workshop.title }),
            });

            if (res.ok) {
                onSuccess();
            } else {
                setError('Hubo un error al enviar la inscripción. Inténtalo de nuevo.');
            }
        } catch (err) {
            setError('Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                <h2 className={styles.title}>Inscribirse a {workshop.title}</h2>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.scrollArea}>
                        <div className={styles.field}>
                            <label>Nombre Completo del Alumno</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className={styles.field}>
                            <label>DNI del Alumno</label>
                            <input
                                type="text"
                                required
                                placeholder="Sin puntos"
                                value={formData.dni}
                                onChange={e => setFormData({ ...formData, dni: e.target.value })}
                            />
                        </div>

                        <div className={styles.fieldRow}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={formData.isMinor}
                                    onChange={e => setFormData({ ...formData, isMinor: e.target.checked })}
                                />
                                El alumno es menor de edad
                            </label>
                        </div>

                        {formData.isMinor && (
                            <div className={styles.field}>
                                <label>Nombre del Padre / Madre / Tutor</label>
                                <input
                                    type="text"
                                    required={formData.isMinor}
                                    value={formData.tutorName}
                                    onChange={e => setFormData({ ...formData, tutorName: e.target.value })}
                                />
                            </div>
                        )}

                        <div className={styles.field}>
                            <label>Ciudad</label>
                            <input
                                type="text"
                                required
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>

                        <div className={styles.field}>
                            <label>Localidad</label>
                            <input
                                type="text"
                                required
                                value={formData.locality}
                                onChange={e => setFormData({ ...formData, locality: e.target.value })}
                            />
                        </div>

                        <div className={styles.field}>
                            <label>Dirección</label>
                            <input
                                type="text"
                                required
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>

                        <div className={styles.field}>
                            <label>Email de contacto</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className={styles.field}>
                            <label>Teléfono (Alumno)</label>
                            <input
                                type="tel"
                                required={!formData.noPhone}
                                disabled={formData.noPhone}
                                value={formData.noPhone ? '' : formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder={formData.noPhone ? "No dispone de teléfono" : ""}
                            />
                            {formData.isMinor && (
                                <label className={styles.checkboxLabelSmall}>
                                    <input
                                        type="checkbox"
                                        checked={formData.noPhone}
                                        onChange={e => setFormData({ ...formData, noPhone: e.target.checked })}
                                    />
                                    No dispone de teléfono propio
                                </label>
                            )}
                        </div>

                        <div className={styles.field}>
                            <label>Celular (Padre / Madre / Tutor)</label>
                            <input
                                type="tel"
                                required={formData.isMinor}
                                placeholder="Opcional si es mayor"
                                value={formData.parentPhone}
                                onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                            />
                        </div>
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Enviando...' : 'Confirmar Inscripción'}
                    </button>
                </form>
            </div>
        </div>
    );
}
