'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function CronogramaPage() {
    const { user, loading } = useAuth();
    const [scheduleData, setScheduleData] = useState([]);
    const [loadingSchedule, setLoadingSchedule] = useState(true);

    useEffect(() => {
        if (user && (user.role === 'admin' || user.role === 'teacher')) {
            fetchSchedule();
        }
    }, [user]);

    const fetchSchedule = async () => {
        try {
            // Filtro automático para profes
            const param = user.role === 'teacher' ? `?taller=${encodeURIComponent(user.taller)}` : '';
            const res = await fetch(`/api/schedule${param}`);
            const result = await res.json();
            if (result.status === 'success') {
                setScheduleData(result.data);
            }
        } catch (error) {
            console.error("Error fetching schedule:", error);
        } finally {
            setLoadingSchedule(false);
        }
    };

    if (loading || loadingSchedule) return <div className="section-padding container text-center">Cargando Cronograma... 📅</div>;

    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
        return <div className="section-padding container text-center">⛔ Acceso restringido.</div>;
    }

    // Estructura de la grilla
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const timeBlocks = ['Mañana', 'Siesta', 'Tarde'];

    // Helper para filtrar alumnos por celda
    const getStudentsFor = (day, block) => {
        return scheduleData.filter(s => s.day === day && s.time_block === block);
    };

    return (
        <div className="section-padding container">
            <div style={{ marginBottom: '1rem' }}>
                <button
                    onClick={() => window.location.href = user.role === 'admin' ? '/admin' : '/mi-cuenta'}
                    style={{
                        background: 'transparent',
                        border: '1px solid #f59e0b',
                        color: '#f59e0b',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    ⬅ Volver al Panel
                </button>
            </div>

            <h1 className="section-title text-center text-yellow" style={{ marginBottom: '2rem' }}>
                📅 Cronograma Semanal {user.role === 'teacher' ? `del ${user.taller}` : '(Administración)'}
            </h1>

            <div style={{ overflowX: 'auto' }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    color: 'white',
                    minWidth: '800px', // Scroll en móviles
                    marginBottom: '3rem'
                }}>
                    <thead>
                        <tr style={{ background: '#f59e0b', color: '#0d1b2a' }}>
                            <th style={{ padding: '15px', border: '1px solid #444' }}>HORARIO</th>
                            {days.map(d => (
                                <th key={d} style={{ padding: '15px', border: '1px solid #444' }}>{d.toUpperCase()}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {timeBlocks.map(block => (
                            <tr key={block}>
                                <td style={{
                                    padding: '15px',
                                    border: '1px solid #333',
                                    background: '#1f2937',
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    verticalAlign: 'middle'
                                }}>
                                    {block.toUpperCase()}
                                </td>
                                {days.map(day => {
                                    const students = getStudentsFor(day, block);
                                    return (
                                        <td key={day + block} style={{ padding: '10px', border: '1px solid #333', background: '#111827', verticalAlign: 'top', minHeight: '100px' }}>
                                            {students.length === 0 ? (
                                                <span style={{ color: '#374151', fontSize: '0.8rem' }}>-</span>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                    {students.map((s, idx) => (
                                                        <div key={idx} style={{
                                                            padding: '4px 8px',
                                                            background: 'rgba(245, 158, 11, 0.1)',
                                                            borderLeft: '2px solid #f59e0b',
                                                            borderRadius: '4px',
                                                            fontSize: '0.9rem'
                                                        }}>
                                                            <strong>{s.student}</strong>
                                                            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{s.workshop}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="text-center">
                <p style={{ color: '#9ca3af', fontStyle: 'italic', marginBottom: '20px' }}>
                    * Los horarios se detectan automáticamente según la planilla de inscripción.
                </p>
                <div style={{ background: '#1f2937', padding: '15px', borderRadius: '8px', display: 'inline-block', textAlign: 'left' }}>
                    <h4 style={{ marginTop: 0, color: '#f59e0b' }}>Otros / Sin Definir:</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {scheduleData.filter(s => s.day === 'Otros' || s.day === 'Sin Definir').map((s, idx) => (
                            <li key={idx}><strong>{s.student}</strong> - {s.raw_schedule}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
