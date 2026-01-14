'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

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
                    <li><Link href="/admin" className={styles.navLink} onClick={closeMenu} style={{ color: 'var(--rooster-yellow)', fontWeight: 'bold' }}>Dashboard</Link></li>
                )}

                {user ? (
                    <div className={styles.userProfile}>
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
