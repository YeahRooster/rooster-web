'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [view, setView] = useState('stats'); // 'stats' o 'students'
    const [filter, setFilter] = useState('all'); // 'all', 'active', 'pending'

    useEffect(() => {
        if (user && user.role === 'admin') {
            loadStats();
            loadStudents();
        }
    }, [user]);

    const loadStats = async () => {
        try {
            const res = await fetch('/api/v2/admin/stats', { cache: 'no-store' });
            const data = await res.json();
            setStats(data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const loadStudents = async (status = '') => {
        try {
            const res = await fetch(`/api/v2/admin/students${status ? `?status=${status}` : ''}`, { cache: 'no-store' });
            const result = await res.json();
            if (result.status === 'success') {
                setStudents(result.data);
            }
        } catch (err) { console.error(err); }
    };

    const [processingDni, setProcessingDni] = useState(null);

    const toggleStudentStatus = async (dni, currentStatus) => {
        setProcessingDni(dni);
        try {
            const res = await fetch('/api/v2/admin/students', {
                method: 'PUT',
                body: JSON.stringify({ dni, activo: !currentStatus })
            });
            const result = await res.json();
            if (result.status === 'success') {
                await loadStudents(filter === 'all' ? '' : filter);
                await loadStats();
            }
        } catch (err) { alert("Error al cambiar estado"); }
        finally { setProcessingDni(null); }
    };

    if (authLoading || loading) return <div className="section-padding container text-center">Cargando Panel de Control...</div>;

    if (!user || user.role !== 'admin') {
        if (typeof window !== 'undefined') window.location.href = '/login';
        return null;
    }

    return (
        <div className="section-padding container">
            <h1 className="section-title text-yellow">Panel de Administración</h1>

            <div className={styles.tabs}>
                <button className={`${styles.tab} ${view === 'stats' ? styles.tabActive : ''}`} onClick={() => setView('stats')}>📈 Estadísticas</button>
                <button className={`${styles.tab} ${view === 'students' ? styles.tabActive : ''}`} onClick={() => setView('students')}>👤 Gestión de Alumnos</button>
            </div>

            {view === 'stats' ? (
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <h3>Neto Mensual (Estimado)</h3>
                        <p className={styles.bigNumber}>${stats?.netoMensual || 0}</p>
                        <span>Basado en cuotas pagadas y comisiones</span>
                    </div>

                    <div className={styles.statCard}>
                        <h3>Alumnos Totales</h3>
                        <p className={styles.bigNumber}>{stats?.totalAlumnos || 0}</p>
                        <span>En todos los talleres</span>
                    </div>

                    <div className={styles.statCard}>
                        <h3>Profesores</h3>
                        <p className={styles.bigNumber}>{stats?.totalProfesores || 0}</p>
                        <span>Docentes activos</span>
                    </div>
                </div>
            ) : (
                <div className={styles.studentsSection}>
                    <div className={styles.filterBar}>
                        <button onClick={() => { setFilter('all'); loadStudents(); }} className={filter === 'all' ? styles.btnFilterActive : ''}>Todos</button>
                        <button onClick={() => { setFilter('pending'); loadStudents('pending'); }} className={filter === 'pending' ? styles.btnFilterActive : ''}>Pendientes 🟡</button>
                        <button onClick={() => { setFilter('active'); loadStudents('active'); }} className={filter === 'active' ? styles.btnFilterActive : ''}>Activos 🟢</button>
                    </div>

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>DNI</th>
                                    <th>Estado</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s) => (
                                    <tr key={s.dni}>
                                        <td>{s.nombre}</td>
                                        <td>{s.dni}</td>
                                        <td>
                                            <span className={s.activo ? styles.tagActive : styles.tagPending}>
                                                {s.activo ? 'Activo' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => toggleStudentStatus(s.dni, s.activo)}
                                                className={s.activo ? styles.btnDeactivate : styles.btnActivate}
                                                disabled={processingDni === s.dni}
                                            >
                                                {processingDni === s.dni ? 'Cambiando...' : (s.activo ? 'Dar de Baja' : 'Dar de Alta')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className={styles.adminActions}>
                <h2>Gestión Rápida</h2>
                <div className={styles.buttonGroup}>
                    <a href="https://docs.google.com/spreadsheets/d/1X562v1K8Y0oP70zI1yWlVlA-pX-L9X9E-8X9L9X9E-8X" target="_blank" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                        Abrir Google Sheets
                    </a>
                    <button className="btn btn-outline" onClick={() => window.location.href = '/mi-cuenta'}>
                        👤 Mi Perfil / Seguridad
                    </button>
                    <button className="btn btn-outline" onClick={() => window.location.reload()}>
                        🔄 Actualizar Datos
                    </button>
                </div>
            </div>

            <div className={styles.infoBox}>
                <p>💡 <strong>Tip:</strong> Para que el cálculo del Neto sea exacto, asegúrate de que cada taller en la pestaña <code>TALLERES</code> tenga su porcentaje de comisión asignado (1.0 para vos, 0.3 para otros profes).</p>
            </div>
        </div>
    );
}
