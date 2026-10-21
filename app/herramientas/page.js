'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Box, Palette, Maximize2, Minimize2 } from 'lucide-react';
import styles from './page.module.css';

export default function HerramientasPage() {
    const { user } = useAuth();
    const [activeTool, setActiveTool] = useState('anatomy'); // 'anatomy' | 'color'
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Permitir acceso directo vía URL: ?tool=color o ?tool=colores o ?tool=anatomy
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tool = params.get('tool');
            if (tool === 'color' || tool === 'colores' || tool === 'paleta') {
                setActiveTool('color');
            } else if (tool === 'anatomy' || tool === 'anatomia' || tool === '3d') {
                setActiveTool('anatomy');
            }
        }
    }, []);

    const handleSelectTool = (tool) => {
        setActiveTool(tool);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tool', tool);
            window.history.replaceState(null, '', url.toString());
            // Disparar evento de resize suave para que los lienzos recalculen dimensiones inmediatamente
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 60);
        }
    };

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

    const anatomyIframeSrc = `/angleref/index.html?v=20261020m3${user?.role ? `&role=${encodeURIComponent(user.role)}` : ''}`;
    const colorIframeSrc = `/color-palette/index.html?v=20261020m4`;

    const toolMeta = {
        anatomy: {
            title: 'Estudio Anatómico 3D & Referencias de Ángulo',
            badge: isUnlimited ? getRoleBadgeText() : 'Modo Libre · 3 búsquedas diarias',
            badgeClass: isUnlimited ? styles.studentBadge : styles.freeBadge
        },
        color: {
            title: 'Estudio de Color Rooster',
            badge: 'Herramienta Creativa · Acceso Libre',
            badgeClass: styles.freeCreativeBadge
        }
    };

    const currentMeta = toolMeta[activeTool] || toolMeta.anatomy;

    return (
        <div className={`${styles.viewportLayout} ${isFullscreen ? styles.fullscreenMode : ''}`}>
            {/* Barra superior de herramientas unificada y compacta */}
            <header className={styles.unifiedToolbar}>
                <div className={styles.toolSwitchGroup}>
                    <button
                        type="button"
                        className={`${styles.toolTab} ${activeTool === 'anatomy' ? styles.toolTabActive : ''}`}
                        onClick={() => handleSelectTool('anatomy')}
                        title="Estudio Anatómico 3D: Poses, cráneos, manos y figuras completas"
                    >
                        <Box size={16} className={styles.tabIcon} />
                        <span className={styles.tabLabel}>Estudio Anatómico 3D</span>
                    </button>

                    <button
                        type="button"
                        className={`${styles.toolTab} ${activeTool === 'color' ? styles.toolTabActive : ''}`}
                        onClick={() => handleSelectTool('color')}
                        title="Estudio de Color Rooster: Círculo cromático, armonías, extractor y accesibilidad"
                    >
                        <Palette size={16} className={styles.tabIcon} />
                        <span className={styles.tabLabel}>Estudio de Color Rooster</span>
                        <span className={styles.newPill}>Nuevo</span>
                    </button>
                </div>

                <div className={styles.toolbarMeta}>
                    <span className={currentMeta.badgeClass}>{currentMeta.badge}</span>
                    <button 
                        type="button"
                        onClick={toggleFullscreen} 
                        className={styles.btnFullscreen}
                        title={isFullscreen ? "Salir de pantalla completa" : "Modo pantalla completa"}
                    >
                        {isFullscreen ? (
                            <>
                                <Minimize2 size={14} style={{ marginRight: 6 }} />
                                <span>Ventana Normal</span>
                            </>
                        ) : (
                            <>
                                <Maximize2 size={14} style={{ marginRight: 6 }} />
                                <span>Pantalla Completa</span>
                            </>
                        )}
                    </button>
                </div>
            </header>

            {/* Escenario de Herramienta Nativamente Integrada (Full-Bleed Stage) */}
            <main className={styles.appStage}>
                <div className={`${styles.toolFramePane} ${activeTool === 'anatomy' ? styles.paneVisible : styles.paneHidden}`}>
                    <iframe
                        src={anatomyIframeSrc}
                        className={styles.nativeFrame}
                        title="Estudio Anatómico 3D Rooster"
                        allow="clipboard-write; fullscreen"
                    />
                </div>

                <div className={`${styles.toolFramePane} ${activeTool === 'color' ? styles.paneVisible : styles.paneHidden}`}>
                    <iframe
                        src={colorIframeSrc}
                        className={styles.nativeFrame}
                        title="Estudio de Color Rooster"
                        allow="clipboard-write; fullscreen"
                    />
                </div>
            </main>
        </div>
    );
}
