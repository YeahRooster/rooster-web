'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [pendingStudentsCount, setPendingStudentsCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    useEffect(() => {
        if (user) {
            loadNotifications();
            const interval = setInterval(loadNotifications, 30000); // Poll cada 30s
            return () => clearInterval(interval);
        }
    }, [user]);

    const loadNotifications = async () => {
        try {
            const res = await fetch(`/api/social/notifications?dni=${user.dni}`);
            const result = await res.json();
            if (result.status === 'success') {
                setNotifications(result.data);
                setUnreadCount(result.data.filter(n => !n.leida).length);
            }

            // Si es admin, cargar también solicitudes pendientes de alumnos
            if (user.role === 'admin') {
                const resP = await fetch('/api/v2/admin/students/pending-count');
                const resultP = await resP.json();
                if (resultP.status === 'success') {
                    setPendingStudentsCount(resultP.count);
                }
            }
        } catch (e) { console.error("Error notifications:", e); }
    };

    const toggleNotifications = async () => {
        if (!showNotifications && unreadCount > 0) {
            markAsRead();
        }
        setShowNotifications(!showNotifications);
    };

    const markAsRead = async () => {
        try {
            await fetch('/api/social/notifications', {
                method: 'PUT',
                body: JSON.stringify({ dni: user.dni })
            });
            setUnreadCount(0);
        } catch (e) { console.error(e); }
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.logoContainer}>
                <Link href="/" className={styles.logoLink} onClick={closeMenu}>
                    <Image
                        src="/images/logo.jpg"
                        alt="Rooster Escuela de Dibujo"
                        width={80}
                        height={35}
                        className={styles.logo}
                        priority
                    />
                    <span className={styles.brandText}>Rooster</span>
                </Link>
            </div>

            <button className={styles.mobileMenuBtn} onClick={toggleMenu} aria-label="Menu">
                {isMenuOpen ? '✕' : '☰'}
            </button>

            <ul className={`${styles.navLinks} ${isMenuOpen ? styles.navActive : ''}`}>
                <li><Link href="/" className={styles.navLink} onClick={closeMenu}>Inicio</Link></li>
                <li><Link href="/talleres" className={styles.navLink} onClick={closeMenu}>Talleres</Link></li>
                <li><Link href="/galeria" className={styles.navLink} onClick={closeMenu}>Galería</Link></li>
                <li><Link href="/recursos" className={styles.navLink} onClick={closeMenu}>Recursos</Link></li>
                <li><Link href="/contacto" className={styles.navLink} onClick={closeMenu}>Contacto</Link></li>
                {user?.role === 'admin' && (
                    <li style={{ position: 'relative' }}>
                        <Link href="/admin" className={styles.navLink} onClick={closeMenu} style={{ color: 'var(--rooster-yellow)', fontWeight: 'bold' }}>
                            Dashboard
                            {pendingStudentsCount > 0 && <span className={styles.badgeAdmin}>{pendingStudentsCount}</span>}
                        </Link>
                    </li>
                )}

                {user ? (
                    <div className={styles.userProfile}>
                        {/* Notificaciones */}
                        <div className={styles.notificationWrapper}>
                            <button className={styles.bellBtn} onClick={toggleNotifications}>
                                🔔
                                {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
                            </button>

                            {showNotifications && (
                                <div className={styles.notificationDropdown}>
                                    <h3>Notificaciones</h3>
                                    <div className={styles.notificationList}>
                                        {notifications.length === 0 ? (
                                            <p className={styles.emptyNotif}>No tienes notificaciones aún.</p>
                                        ) : (
                                            notifications.map((n) => (
                                                <div key={n.id} className={`${styles.notificationItem} ${!n.leida ? styles.unreadLine : ''}`}>
                                                    {n.tipo === 'GALLERY_PROMO' ? (
                                                        <p>🎨 {n.mensaje || '¡No te olvides de compartir tu obra en la galería!'}</p>
                                                    ) : n.tipo === 'BROADCAST' ? (
                                                        <p>📢 {n.mensaje}</p>
                                                    ) : n.tipo === 'RECURSO' ? (
                                                        <p>📚 {n.mensaje}</p>
                                                    ) : (
                                                        <p>❤️ <strong>{n.actor_nombre}</strong> le dio me gusta a tu obra.</p>
                                                    )}
                                                    <span>{new Date(n.fecha).toLocaleDateString()}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.userInfo}>
                            <Link href="/mi-cuenta" className={styles.userName} onClick={closeMenu}>{user.nombre}</Link>
                            <span className={styles.userEmail}>{user.email}</span>
                        </div>
                        <button onClick={() => { logout(); closeMenu(); }} className={styles.logoutBtn} title="Cerrar Sesión">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        </button>
                    </div>
                ) : (
                    <li><Link href="/login" className={styles.loginBtn} onClick={closeMenu}>Ingreso Alumnos</Link></li>
                )}
            </ul>
        </nav>
    );
}
