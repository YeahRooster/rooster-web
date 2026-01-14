export default function ContactoPage() {
    return (
        <div className="section-padding container">
            <h1 className="section-title text-center text-yellow" style={{ marginBottom: '3rem' }}>
                Contacto
            </h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '3rem',
                alignItems: 'start'
            }}>
                <div style={{ color: 'var(--white)' }}>
                    <h2 style={{ color: 'var(--rooster-yellow)', marginBottom: '1rem' }}>Visítanos</h2>
                    <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                        <strong>Dirección:</strong><br />
                        Pedro de Vega 2275<br />
                        Santa Fe, Argentina
                    </p>

                    <h2 style={{ color: 'var(--rooster-yellow)', marginTop: '2rem', marginBottom: '1rem' }}>Llámanos o Escribinos</h2>
                    <p style={{ fontSize: '1.2rem' }}>
                        <strong>Teléfono / WhatsApp:</strong><br />
                        (0342) 155-263036
                    </p>
                    <p style={{ fontSize: '1.2rem', marginTop: '1rem' }}>
                        <strong>Redes Sociales:</strong><br />
                        @roosterespacio
                    </p>
                </div>

                <div style={{
                    height: '400px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #374151'
                }}>
                    <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3406.2719280145217!2d-60.69420792348398!3d-31.603310306260718!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x959754160a0f5d91%3A0xc6c421711776596e!2sPedro%20de%20Vega%202275%2C%20S3004EML%20Santa%20Fe!5e0!3m2!1ses-419!2sar!4v1705008544000!5m2!1ses-419!2sar"
                    ></iframe>
                </div>
            </div>
        </div>
    );
}
