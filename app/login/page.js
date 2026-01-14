'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function LoginPage() {
    const [dni, setDni] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/payments?dni=${dni.trim()}&pass=${password.trim()}`);
            const result = await res.json();

            if (res.ok && result.status === 'success') {
                login({
                    nombre: result.nombre,
                    email: result.email,
                    dni: result.dni,
                    role: result.role,
                    taller: result.taller,
                    pagos: result.pagos || []
                });
                if (result.role === 'admin') {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/mi-cuenta';
                }
            } else {
                setError(result.message || 'DNI o contraseña incorrectos.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="section-padding container">
            <div className={styles.loginCard}>
                <h1 className="section-title text-center text-yellow" style={{ fontSize: '2rem', marginBottom: '2rem' }}>
                    Ingreso a Rooster
                </h1>

                <form onSubmit={handleLogin} className={styles.form}>
                    <div className={styles.field}>
                        <label>DNI / Usuario</label>
                        <input
                            type="text"
                            placeholder="Tu DNI"
                            value={dni}
                            onChange={(e) => setDni(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Contraseña</label>
                        <input
                            type="password"
                            placeholder="******"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Ingresando...' : 'Entrar'}
                    </button>

                    <p className={styles.note}>
                        Consulta tus pagos y descarga materiales exclusivos de clase.
                    </p>
                </form>
            </div>
        </div>
    );
}
