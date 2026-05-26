'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import WorkshopCard from '@/components/WorkshopCard';
import WorkshopDetailsModal from '@/components/WorkshopDetailsModal';
import EnrollmentModal from '@/components/EnrollmentModal';

export default function TalleresPage() {
    const [workshops, setWorkshops] = useState([]);
    const [selectedWorkshop, setSelectedWorkshop] = useState(null);
    const [enrollWorkshop, setEnrollWorkshop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadWorkshops = async () => {
            try {
                console.log("Cargando talleres (Supabase)...");
                const res = await fetch(`/api/v2/workshops?t=${Date.now()}`);
                if (!res.ok) throw new Error('Error cargando talleres');
                const data = await res.json();
                setWorkshops(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Error cargando talleres:", err);
                setError("No se pudieron cargar los talleres. Intente de nuevo más tarde.");
            } finally {
                setLoading(false);
            }
        };
        loadWorkshops();
    }, []);

    // Agrupar talleres por título
    const groupedWorkshops = workshops.reduce((acc, w) => {
        const title = w.title || 'Sin Título';
        if (!acc[title]) {
            acc[title] = { ...w, shifts: [w] };
        } else {
            acc[title].shifts.push(w);
        }
        return acc;
    }, {});

    const workshopList = Object.values(groupedWorkshops);

    if (loading) return <div className="section-padding container text-center">Cargando talleres...</div>;

    return (
        <div className="section-padding container">
            <h1 className="section-title text-yellow" style={{ marginBottom: '1rem' }}>Nuestros Talleres</h1>
            <p style={{ color: 'var(--white)', marginBottom: '3rem', fontSize: '1.1rem', textAlign: 'center' }}>
                Explora nuestras propuestas y reserva tu lugar en la disciplina que más te guste.
            </p>

            <div className={styles.workshopGrid}>
                {error ? (
                    <div className="text-center" style={{ gridColumn: '1 / -1', padding: '3rem', color: '#ff4444' }}>
                        <p>Error al cargar talleres: {error}</p>
                        <small style={{ color: '#6b7280' }}>Verifica la consola del navegador para más detalles.</small>
                    </div>
                ) : workshopList.length === 0 ? (
                    <div className="text-center" style={{ gridColumn: '1 / -1', padding: '3rem', color: '#6b7280' }}>
                        No hay talleres activos en este momento. Verifica tu planilla de Google Sheets.
                    </div>
                ) : (
                    workshopList.map((w, index) => (
                        <WorkshopCard
                            key={index}
                            workshop={w}
                            onClick={() => setSelectedWorkshop(w)}
                            onEnroll={(shift) => setEnrollWorkshop(shift || w)}
                        />
                    ))
                )}
            </div>

            {selectedWorkshop && (
                <WorkshopDetailsModal
                    workshop={selectedWorkshop}
                    onClose={() => setSelectedWorkshop(null)}
                    onEnroll={(shift) => setEnrollWorkshop(shift)}
                />
            )}

            {enrollWorkshop && (
                <EnrollmentModal
                    workshop={enrollWorkshop}
                    onClose={() => setEnrollWorkshop(null)}
                    onSuccess={() => {
                        setEnrollWorkshop(null);
                        alert('¡Inscripción enviada con éxito! Nos pondremos en contacto pronto.');
                        window.location.reload(); // Recargar para ver cupos actualizados
                    }}
                />
            )}
        </div>
    );
}
