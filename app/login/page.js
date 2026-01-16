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
            // INTENTO 1: SUPABASE (V2) - Ultra rápido
            console.log("Intentando Login v2 (Supabase)...");
            const resV2 = await fetch('/api/v2/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni: dni.trim(), password: password.trim() })
            });

            const resultV2 = await resV2.json();

            if (resV2.ok && resultV2.status === 'success') {
                login(resultV2);
                redirectUser(resultV2.role);
                return;
            }

            // SI LA CUENTA ESTÁ BLOQUEADA (403), no reintentamos fallback
            if (resV2.status === 403) {
                setError(resultV2.message);
                return;
            }

            // Si llegamos acá es porque el login v2 falló por credenciales incorrectas o error de servidor
            // Si es un error de credentials (401), intentamos en Sheets por si aún no fue migrado
            console.log("Login v2 falló, intentando Fallback a Google Sheets (v1)...");
            const resV1 = await fetch(`/api/payments?dni=${dni.trim()}&pass=${password.trim()}`);
            const resultV1 = await resV1.json();

            if (resV1.ok && resultV1.status === 'success') {
                login(resultV1);
                redirectUser(resultV1.role);
            } else {
                setError(resultV2.message || resultV1.message || 'DNI o contraseña incorrectos.');
            }
        } catch (err) {
            console.error("Login Error:", err);
            setError('Error de conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    const redirectUser = (role) => {
        if (role === 'admin') {
            window.location.href = '/admin';
        } else {
            window.location.href = '/mi-cuenta';
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
