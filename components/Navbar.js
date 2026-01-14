'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className={styles.navbar}>
            <div className={styles.logoContainer}>
                <Link href="/" className={styles.logoLink}>
                    <Image
                        src="/images/logo.jpg"
                        alt="Rooster Escuela de Dibujo"
                        width={120}
                        height={50}
                        className={styles.logo}
                        priority
                    />
                    <span className={styles.brandText}>Rooster, espacio de arte.</span>
                </Link>
            </div>

            <ul className={styles.navLinks}>
                <li><Link href="/" className={styles.navLink}>Inicio</Link></li>
                <li><Link href="/talleres" className={styles.navLink}>Talleres</Link></li>
                <li><Link href="/galeria" className={styles.navLink}>Galería</Link></li>
                <li><Link href="/recursos" className={styles.navLink}>Recursos</Link></li>
                <li><Link href="/contacto" className={styles.navLink}>Contacto</Link></li>
                {user?.role === 'admin' && (
                    <li><Link href="/admin" className={styles.navLink} style={{ color: 'var(--rooster-yellow)', fontWeight: 'bold' }}>Dashboard</Link></li>
                )}

                {user ? (
                    <div className={styles.userProfile}>
                        <div className={styles.userInfo}>
                            <Link href="/mi-cuenta" className={styles.userName}>{user.nombre}</Link>
                            <span className={styles.userEmail}>{user.email}</span>
                        </div>
                        <button onClick={logout} className={styles.logoutBtn} title="Cerrar Sesión">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        </button>
                    </div>
                ) : (
                    <li><Link href="/login" className={styles.loginBtn}>Ingreso Alumnos</Link></li>
                )}
            </ul>
        </nav>
    );
}
