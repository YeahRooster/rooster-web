'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.role === 'admin') {
            const loadStats = async () => {
                try {
                    // INTENTO V2: SUPABASE
                    const res = await fetch('/api/v2/admin/stats');
                    if (!res.ok) throw new Error("Falla V2");
                    const data = await res.json();
                    setStats(data);
                } catch (err) {
                    console.warn("Falla en stats V2, usando V1...");
                    fetch('/api/admin/stats')
                        .then(res => res.json())
                        .then(data => setStats(data))
                        .catch(e => console.error("Error total en stats:", e));
                } finally {
                    setLoading(false);
                }
            };
            loadStats();
        }
    }, [user]);

    if (authLoading || loading) return <div className="section-padding container text-center">Cargando Panel de Control...</div>;

    if (!user || user.role !== 'admin') {
        if (typeof window !== 'undefined') window.location.href = '/login';
        return null;
    }

    return (
        <div className="section-padding container">
            <h1 className="section-title text-yellow">Panel de Administración</h1>

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
