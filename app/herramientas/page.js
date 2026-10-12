'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function HerramientasPage() {
    const { user } = useAuth();
    const [isFullscreen, setIsFullscreen] = useState(false);

    const isUnlimited = Boolean(
        user && (
            user.role === 'student' || 
            user.role === 'teacher' || 
            user.role === 'profesor' || 
            user.role === 'admin' || 
            (user.pagos && user.pagos.length > 0)
        )
    );

    const getRoleBadgeText = () => {
        if (!user) return 'Modo Libre · 3 búsquedas diarias';
        if (user.role === 'admin') return 'Administrador · Acceso Ilimitado';
        if (user.role === 'teacher' || user.role === 'profesor') return 'Profesor Rooster · Acceso Ilimitado';
        if (user.role === 'student') return 'Alumno Rooster · Acceso Ilimitado';
        if (user.pagos && user.pagos.length > 0) return 'Miembro Rooster · Acceso Ilimitado';
        return 'Modo Libre · 3 búsquedas diarias';
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const iframeSrc = `/angleref/index.html${user?.role ? `?role=${encodeURIComponent(user.role)}` : ''}`;

    return (
        <div className={`${styles.container} ${isFullscreen ? styles.fullscreenMode : ''}`}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Estudio Anatómico 3D & Referencias de Ángulo</h1>
                    <p className={styles.subtitle}>
                        Herramienta interactiva de perspectiva, poses dinámicas y proporciones para dibujantes de Rooster.
                    </p>
                </div>
                <div className={styles.actions}>
                    {isUnlimited ? (
                        <span className={styles.studentBadge}>{getRoleBadgeText()}</span>
                    ) : (
                        <span className={styles.freeBadge}>Modo Libre · 3 búsquedas diarias</span>
                    )}
                    <button 
                        onClick={toggleFullscreen} 
                        className={styles.btnFullscreen}
                        title={isFullscreen ? "Salir de pantalla completa" : "Modo pantalla completa"}
                    >
                        {isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}
                    </button>
                </div>
            </div>

            <div className={styles.iframeWrapper}>
                <iframe
                    src={iframeSrc}
                    className={styles.iframe}
                    title="Rooster AngleRef Studio"
                    allow="clipboard-write; fullscreen"
                />
            </div>
        </div>
    );
}
