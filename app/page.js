import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.blob}></div>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Despierta tu Creatividad</h1>
          <p className={styles.subtitle}>
            Aprende a dibujar desde cero o perfecciona tu técnica en Rooster Espacio de Arte.
          </p>
          <div className={styles.ctaButtons}>
            <Link href="/talleres" className="btn btn-primary">
              Ver Talleres
            </Link>
            <Link href="/contacto" className="btn btn-outline">
              Contactanos
            </Link>
          </div>
        </div>
      </section>

      {/* About / Intro Section */}
      <section className={`${styles.section} ${styles.about}`}>
        <h2 className={styles.sectionTitle} style={{ color: 'var(--rooster-yellow)' }}>SOBRE LA ESCUELA</h2>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', color: 'var(--white)' }}>
          <p style={{ fontStyle: 'italic', fontSize: '1.2rem', marginBottom: '2rem' }}>
            "Todos tus sueños pueden hacerse realidad si tienes el coraje de perseguirlos."
            <br />
            <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>- Walt Disney</span>
          </p>

          <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Rooster abrió sus puertas en 2016 y desde sus inicios hasta el día de hoy perseguimos el mismo objetivo:
            poder brindar una base solida a quienes quieran iniciarse o perfeccionarse en el arte del dibujo.
          </p>

          <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
            A través de nociones estéticas, el uso correcto de una variedad de elementos profesionales y
            ejercicios constantes con diferentes técnicas, nuestros alumnos logran dominar el medio para volcar su creatividad sin barreras.
          </p>

          <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
            De más esta decir la importancia que tiene hoy en día la comunicación y la imagen.
            Desde la escuela buscamos formar futuros profesionales, brindándole las herramientas para poder abrirse camino dentro de este campo.
          </p>

          <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
            En nuestros inicios comenzamos con clases de dibujo, pero con el tiempo hemos ido creciendo y sumando diferentes talleres de arte,
            como de cerámica, porcelana fría, talleres de guion de comics, etc.
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={styles.benefits}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className={styles.sectionTitle} style={{ color: 'var(--rooster-yellow)' }}>BENEFICIOS PARA ALUMNOS</h2>
          <p className={styles.benefitsSubtitle}>
            Al ser parte de Rooster, nuestros alumnos tienen descuentos exclusivos en las mejores librerías de la ciudad. ✨🎨
          </p>
          <div className={styles.logoGrid}>
            <div className={styles.logoItem}>
              <Image src="/images/logos/logo-sarmiento.png" alt="Librería Sarmiento" width={220} height={100} style={{ objectFit: 'contain' }} />
            </div>
            <div className={styles.logoItem}>
              <Image src="/images/logos/logo-lirolay.png" alt="Lirolay Librería" width={180} height={100} style={{ objectFit: 'contain' }} />
            </div>
            <div className={styles.logoItem}>
              <Image src="/images/logos/logo-letrae.jpg" alt="Librería Técnica Letra E" width={180} height={100} style={{ objectFit: 'contain' }} />
            </div>
            <a href="https://libreriarexy.vercel.app/" target="_blank" rel="noopener noreferrer" className={`${styles.logoItem} ${styles.rexyLink}`}>
              <Image
                src="/images/logos/logo-rexy.jpg"
                alt="Librería Rexy"
                width={250}
                height={150}
                className={styles.rexyImg}
              />
            </a>
          </div>
        </div>
      </section>

      {/* Image Showcase */}
      <section className={styles.section} style={{ backgroundColor: 'var(--rooster-blue)', color: 'white' }}>
        <div className="container text-center">
          <h2 className={styles.sectionTitle} style={{ color: 'white' }}>Nuestro Espacio</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginTop: '2rem' }}>
            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
              <Image
                src="/images/exposition-poster.png"
                alt="Exposición Anual"
                width={400}
                height={600}
                style={{ borderRadius: '8px', objectFit: 'cover', width: '100%', height: 'auto' }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
