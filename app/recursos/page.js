'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import styles from './page.module.css';

export default function RecursosPage() {
    const { user, loading } = useAuth();

    const [recursosDrive, setRecursosDrive] = useState([]);
    const [fetchingDrive, setFetchingDrive] = useState(false);

    useEffect(() => {
        if (user && user.pagos && user.pagos.length > 0) {
            loadAllResources();
        }
    }, [user]);

    const loadAllResources = async () => {
        setFetchingDrive(true);
        try {
            // Usamos talleresInscriptos que ahora devolvemos en el login v19
            const talleres = user.talleresInscriptos || [];
            let allFiles = [];

            if (talleres.length === 0 && user.pagos) {
                // Respaldar en pagos si por alguna razón no vinieron talleresInscriptos
                const dePagos = [...new Set(user.pagos.map(p => p.taller))];
                talleres.push(...dePagos);
            }

            for (const taller of talleres) {
                const res = await fetch(`/api/resources?taller=${encodeURIComponent(taller)}`);
                const data = await res.json();
                if (data.status === 'success' && data.resources) {
                    allFiles = [...allFiles, ...data.resources];
                }
            }
            setRecursosDrive(allFiles);
        } catch (err) {
            console.error("Error cargando recursos:", err);
        } finally {
            setFetchingDrive(false);
        }
    };

    if (loading) return <div className="section-padding container text-center">Cargando...</div>;

    if (!user) {
        return (
            <div className="section-padding container">
                <div className={styles.restrictedCard}>
                    <div className={styles.lockIcon}>🔒</div>
                    <h1 className="section-title text-center text-yellow">Acceso Restringido</h1>
                    <p className="text-center" style={{ marginBottom: '2rem', color: 'var(--white)' }}>
                        Esta sección es exclusiva para alumnos activos de Rooster Espacio de Arte.
                        Inicia sesión con tu DNI para acceder al material didáctico.
                    </p>
                    <div className="text-center">
                        <Link href="/login" className="btn btn-primary">
                            Ir al Ingreso Alumnos
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Opcional: Validar si tiene alguna cuota pagada
    const hasActivePayment = user.pagos && user.pagos.some(p => p.estado?.toLowerCase() === 'pagado');

    if (!hasActivePayment && user.pagos?.length > 0) {
        return (
            <div className="section-padding container">
                <div className={styles.restrictedCard}>
                    <div className={styles.lockIcon}>⚠️</div>
                    <h1 className="section-title text-center text-yellow">Cuota Pendiente</h1>
                    <p className="text-center" style={{ marginBottom: '2rem', color: 'var(--white)' }}>
                        Hola <strong>{user.nombre}</strong>. Parece que tienes cuotas pendientes.
                        Para acceder a los recursos, debes estar al día con tus pagos.
                    </p>
                    <div className="text-center">
                        <Link href="/mi-cuenta" className="btn btn-primary">
                            Ver mi Estado de Cuenta
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="section-padding container">
            <h1 className="section-title text-center text-yellow" style={{ marginBottom: '1rem' }}>
                Recursos para Alumnos
            </h1>
            <p className="text-center" style={{ marginBottom: '3rem', color: 'var(--white)' }}>
                Hola <strong>{user.nombre}</strong>, aquí tienes el material para tus clases.
            </p>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {fetchingDrive ? (
                    <p className="text-center" style={{ color: '#ccc', padding: '2rem' }}>Buscando material en la nube...</p>
                ) : recursosDrive.length === 0 ? (
                    <div className="text-center" style={{ padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        <p style={{ color: '#999' }}>Aún no hay material específico subido para tu taller.</p>
                        <small style={{ color: '#666' }}>El profesor te avisará cuando haya nuevos recursos disponibles.</small>
                    </div>
                ) : (
                    recursosDrive.map((item, i) => (
                        <div key={i} className={styles.resourceItem}>
                            <div>
                                <h3 style={{ color: 'var(--rooster-yellow)', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{item.nombre}</h3>
                                <span style={{ fontSize: '0.8rem', color: '#ccc' }}>Fecha: {item.fecha}</span>
                            </div>
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', textDecoration: 'none' }}
                            >
                                Descargar / Ver
                            </a>
                        </div>
                    ))
                )}

                <div className={styles.didacticNote}>
                    El material es exclusivo para uso didáctico y personal de los alumnos de Rooster.
                </div>
            </div>
        </div>
    );
}
