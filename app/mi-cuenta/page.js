'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function MiCuentaPage() {
    const { user, loading } = useAuth();
    const [showAlert, setShowAlert] = useState(false);
    const [teacherData, setTeacherData] = useState({ students: [], resources: [] });
    const [loadingTeacher, setLoadingTeacher] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState('');

    useEffect(() => {
        if (user && user.role === 'student') {
            // Mostrar alerta del 1 al 15 de cada mes (para que se vea hoy día 14)
            const hoy = new Date();
            if (hoy.getDate() <= 15) {
                const dismissed = localStorage.getItem('dismiss_discount_alert');
                if (!dismissed) setShowAlert(true);
            }
        }

        if (user && user.role === 'teacher') {
            loadTeacherData();
        }
    }, [user]);

    const loadTeacherData = async () => {
        if (!user?.taller) return;
        setLoadingTeacher(true);
        try {
            // INTENTO V2 (Ultra rápido: Alumnos + Recursos de Supabase)
            const resV2 = await fetch(`/api/v2/teacher/data?taller=${encodeURIComponent(user.taller)}`);
            const dataV2 = await resV2.json();

            // Sincronizar Recursos también desde nuestra API v2
            const resRes = await fetch(`/api/resources?taller=${encodeURIComponent(user.taller)}`);
            const dataRes = await resRes.json();

            setTeacherData({
                students: dataV2.status === 'success' ? dataV2.students : [],
                resources: dataRes.status === 'success' ? dataRes.resources : []
            });
        } catch (err) {
            console.error("Error cargando datos de profe:", err);
        } finally {
            setLoadingTeacher(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadProgress(10);
        setUploadStatus('Leyendo archivo...');

        const reader = new FileReader();
        reader.onload = async (f) => {
            setUploadProgress(30);
            const base64 = f.target.result.split(',')[1];
            try {
                setUploadProgress(50);
                setUploadStatus('Subiendo a Rooster Cloud...');
                const res = await fetch('/api/teacher/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'uploadResource',
                        filename: file.name,
                        filetype: file.type,
                        data: base64,
                        taller: user.taller,
                        teacher: user.nombre
                    })
                });
                const result = await res.json();
                if (result.status === 'success') {
                    setUploadProgress(100);
                    setUploadStatus('¡Hecho!');
                    setTimeout(() => { setUploadProgress(0); loadTeacherData(); }, 1500);
                } else {
                    throw new Error(result.message);
                }
            } catch (err) {
                alert('Error: ' + err.message);
                setUploadProgress(0);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleChangePassword = () => {
        const newPass = prompt("Ingresa tu nueva contraseña:");
        if (newPass) {
            alert("Solicitud enviada. Por seguridad, la administración validará el cambio en las próximas 24hs.");
        }
    };

    const closeAlert = () => {
        setShowAlert(false);
        localStorage.setItem('dismiss_discount_alert', 'true');
    };

    if (loading) return <div className="section-padding container text-center">Cargando...</div>;

    if (!user) {
        if (typeof window !== 'undefined') window.location.href = '/login';
        return null;
    }

    // PANEL DEL PROFESOR
    if (user.role === 'teacher') {
        return (
            <div className="section-padding container">
                <h1 className="section-title text-yellow">Panel del Profesor: {user.nombre}</h1>
                <p className={styles.subtitle}>Taller: {user.taller}</p>

                <div className={styles.teacherGrid}>
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Mis Alumnos</h2>
                        {loadingTeacher ? <p>Cargando lista...</p> : (
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead><tr><th>Nombre</th><th>Estado Cuota</th></tr></thead>
                                    <tbody>
                                        {teacherData.students.length === 0 ? (
                                            <tr><td colSpan="2" className="text-center">No hay alumnos.</td></tr>
                                        ) : (
                                            teacherData.students.map((s, i) => (
                                                <tr key={i}>
                                                    <td>{s.nombre}</td>
                                                    <td>
                                                        <span className={s.estado === 'al dia' ? styles.tagPaid : styles.tagPending}>
                                                            {s.estado === 'al dia' ? 'Al día' : 'Deudor'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Material Compartido</h2>
                        <div className={styles.uploadBox}>
                            <p>Sube material para tus alumnos:</p>
                            <input type="file" id="fileUpload" hidden onChange={handleFileUpload} disabled={uploadProgress > 0} />
                            {uploadProgress === 0 ? (
                                <label htmlFor="fileUpload" className={styles.uploadBtn}>➕ Seleccionar Archivo</label>
                            ) : (
                                <div style={{ marginTop: '1rem' }}>
                                    <div className={styles.progressContainer}>
                                        <div className={styles.progressBar} style={{ width: `${uploadProgress}%` }}></div>
                                    </div>
                                    <span className={styles.progressText}>{uploadStatus}</span>
                                </div>
                            )}
                        </div>
                        <div className={styles.resourceList}>
                            {teacherData.resources.map((r, i) => (
                                <div key={i} className={styles.resourceItem}>
                                    <span>📄 {r.nombre}</span>
                                    <small>{r.fecha}</small>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // PANEL DEL ALUMNO
    const { pagos = [] } = user;
    return (
        <div className="section-padding container">
            {showAlert && (
                <div className={styles.discountAlert}>
                    <div className={styles.alertIcon}>📢</div>
                    <div className={styles.alertContent}>
                        <strong>¡Aprovecha los descuentos de inicio de mes!</strong>
                        <p>Recuerda que abonando hasta el día 10 tienes descuento por transferencia, ¡y uno extra en efectivo!</p>
                    </div>
                    <button onClick={closeAlert} className={styles.closeAlert}>✕</button>
                </div>
            )}
            <h1 className="section-title text-yellow" style={{ marginBottom: '2rem' }}>Mi Cuenta</h1>

            <div className={styles.dashboard}>
                <div className={styles.profileCard}>
                    <h2 className={styles.cardTitle}>Información Personal</h2>
                    <p><strong>{user.role === 'admin' ? 'Perfil' : 'Alumno'}:</strong> {user.nombre || 'No disponible'}</p>
                    {user.role === 'admin' ? (
                        <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            Como administrador, puedes gestionar la escuela desde el Dashboard y cambiar tu contraseña de acceso aquí.
                        </p>
                    ) : (
                        <>
                            <p><strong>Email:</strong> {user.email || 'No disponible'}</p>
                            <p><strong>DNI:</strong> {user.dni || 'No disponible'}</p>
                        </>
                    )}
                    <button onClick={handleChangePassword} className={styles.changePassBtn}>
                        🔑 Cambiar Contraseña Admin
                    </button>
                    {user.role === 'admin' && (
                        <button
                            onClick={() => window.location.href = '/admin'}
                            className={styles.changePassBtn}
                            style={{ marginLeft: '10px', background: 'var(--rooster-yellow)', color: '#0d1b2a' }}
                        >
                            📊 Ir al Dashboard
                        </button>
                    )}
                </div>

                <div className={styles.paymentsCard}>
                    <h2 className={styles.cardTitle}>Estado de Cuotas</h2>
                    {pagos.length === 0 ? (
                        <p className={styles.noData}>No hay pagos registrados para este DNI.</p>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr><th>Taller</th><th>Mes</th><th>Estado</th><th>Monto</th></tr>
                                </thead>
                                <tbody>
                                    {pagos.map((p, i) => (
                                        <tr key={i}>
                                            <td>{p.taller}</td>
                                            <td>{p.mes}</td>
                                            <td>
                                                <span className={p.estado?.toLowerCase() === 'pagado' ? styles.tagPaid : styles.tagPending}>
                                                    {p.estado}
                                                </span>
                                            </td>
                                            <td>${p.monto}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
