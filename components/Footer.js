import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.content}>
                <div className={styles.section}>
                    <h3 className={styles.heading}>Rooster</h3>
                    <p>Espacio de Arte</p>
                </div>
                <div className={styles.section}>
                    <h4 className={styles.subheading}>Ubicación</h4>
                    <p>Pedro de Vega 2275</p>
                    <p>Santa Fe, Argentina</p>
                </div>
                <div className={styles.section}>
                    <h4 className={styles.subheading}>Contacto</h4>
                    <p>Tel: (0342) 155-263036</p>
                    <div className={styles.socials}>
                        {/* Add social icons here later */}
                        <span>Instagram: @roosterespacio</span>
                    </div>
                </div>
            </div>
            <div className={styles.copyright}>
                &copy; {new Date().getFullYear()} Rooster Espacio de Arte. Todos los derechos reservados.
            </div>
        </footer>
    );
}
