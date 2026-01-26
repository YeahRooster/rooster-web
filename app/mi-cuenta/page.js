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
    const [isDragging, setIsDragging] = useState(false);

    // Estados para recursos tipo Nota/Enlace
    const [resourceMode, setResourceMode] = useState('file'); // 'file' o 'note'
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');

    // Estados para pagos
    const [suggestedPayment, setSuggestedPayment] = useState(null);
    const [loadingPayment, setLoadingPayment] = useState(false);

    useEffect(() => {
        if (user && user.role === 'student') {
            loadSuggestedPayment();
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

    const loadSuggestedPayment = async () => {
        if (!user?.dni) return;
        setLoadingPayment(true);
        try {
            const res = await fetch(`/api/v2/payments/suggest-amount?alumno_dni=${user.dni}&metodo_pago=TRANSFERENCIA`);
            const data = await res.json();
            if (data.status === 'success') {
                setSuggestedPayment(data);
            }
        } catch (error) {
            console.error('Error cargando sugerencia de pago:', error);
        } finally {
            setLoadingPayment(false);
        }
    };

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

    const processFile = async (file) => {
        if (!file) return;

        // Validar tamaño máximo (ej: 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('El archivo es muy pesado (máx 10MB)');
            return;
        }

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
                        teacher: user.nombre,
                        teacher_dni: user.dni
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

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        processFile(file);
    };

    // Manejadores para Drag & Drop
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        processFile(file);
    };

    const handleNoteUpload = async () => {
        if (!noteTitle || !noteContent) return;
        setLoadingTeacher(true);
        try {
            const res = await fetch('/api/teacher/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'shareNote',
                    filename: noteTitle,
                    data: noteContent, // Texto o Link
                    taller: user.taller,
                    teacher: user.nombre,
                    filetype: noteContent.startsWith('http') ? 'link' : 'note',
                    teacher_dni: user.dni
                })
            });
            const result = await res.json();
            if (result.status === 'success') {
                setNoteTitle('');
                setNoteContent('');
                setResourceMode('file');
                loadTeacherData();
                alert('Nota/Link compartido con éxito!');
            } else {
                alert('Error: ' + result.message);
            }
        } catch (err) {
            console.error("Error al compartir nota:", err);
            alert('Error al conectar con el servidor');
        } finally {
            setLoadingTeacher(false);
        }
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 className={styles.cardTitle} style={{ margin: 0 }}>Mis Alumnos</h2>
                            <button
                                onClick={() => window.location.href = '/cronograma'}
                                style={{ background: '#f59e0b', color: '#0d1b2a', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                📅 Ver Cronograma
                            </button>
                        </div>
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
                        <div
                            className={`${styles.uploadBox} ${isDragging ? styles.dragging : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                        >
                            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                                <button
                                    onClick={() => setResourceMode('file')}
                                    style={{ background: resourceMode === 'file' ? 'var(--rooster-yellow)' : 'none', color: resourceMode === 'file' ? '#000' : '#fff', border: '1px solid var(--rooster-yellow)', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                >📁 Archivo</button>
                                <button
                                    onClick={() => setResourceMode('note')}
                                    style={{ background: resourceMode === 'note' ? 'var(--rooster-yellow)' : 'none', color: resourceMode === 'note' ? '#000' : '#fff', border: '1px solid var(--rooster-yellow)', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                >📝 Nota / Link</button>
                            </div>

                            {resourceMode === 'file' ? (
                                <>
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
                                </>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <input
                                        type="text"
                                        placeholder="Título de la nota o enlace"
                                        value={noteTitle}
                                        onChange={(e) => setNoteTitle(e.target.value)}
                                        style={{ padding: '8px', borderRadius: '4px', background: '#000', border: '1px solid #333', color: '#fff' }}
                                    />
                                    <textarea
                                        placeholder="Escribe un mensaje o pega un link aquí..."
                                        value={noteContent}
                                        onChange={(e) => setNoteContent(e.target.value)}
                                        rows="3"
                                        style={{ padding: '8px', borderRadius: '4px', background: '#000', border: '1px solid #333', color: '#fff', resize: 'vertical' }}
                                    />
                                    <button
                                        onClick={handleNoteUpload}
                                        disabled={loadingTeacher || !noteTitle || !noteContent}
                                        className={styles.uploadBtn}
                                        style={{ width: '100%' }}
                                    >
                                        🚀 Compartir Nota / Link
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className={styles.resourceList}>
                            {teacherData.resources.length === 0 ? <p style={{ color: '#aaa', fontStyle: 'italic' }}>No hay recursos compartidos.</p> : null}
                            {teacherData.resources.map((r, i) => {
                                const isLink = r.url?.startsWith('http');
                                return (
                                    <div key={i} className={styles.resourceItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <span style={{ fontWeight: 'bold' }}>{isLink ? '📄' : '📝'} </span>
                                            {isLink ? (
                                                <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none' }}>{r.nombre}</a>
                                            ) : (
                                                <span style={{ color: 'var(--rooster-yellow)' }}>{r.nombre}</span>
                                            )}
                                            <br />
                                            <small style={{ color: '#aaa', fontSize: '0.75rem' }}>
                                                {r.fecha} {!isLink && ` - "${r.url.substring(0, 30)}${r.url.length > 30 ? '...' : ''}"`}
                                            </small>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (confirm(`¿Borrar ${isLink ? 'este archivo' : 'esta nota'}?`)) {
                                                    const res = await fetch(`/api/resources?id=${r.id}`, { method: 'DELETE' });
                                                    if (res.ok) loadTeacherData();
                                                }
                                            }}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '5px' }}
                                            title="Eliminar"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                );
                            })}
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

                {/* NUEVO: Tarjeta de Pago Automatizada */}
                <div className={styles.profileCard} style={{ border: '1px solid #ffd700' }}>
                    <h2 className={styles.cardTitle}>💳 Pagar Cuota del Mes</h2>
                    {loadingPayment ? <p>Calculando monto actual...</p> : (
                        suggestedPayment ? (
                            <div>
                                <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
                                    {suggestedPayment.taller} - Cuota {suggestedPayment.cuota_numero}
                                </p>

                                <div style={{ background: '#1f2937', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                                    <p style={{ color: '#9ca3af', margin: 0 }}>Monto a pagar hoy:</p>
                                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4ade80', margin: '5px 0' }}>
                                        ${suggestedPayment.monto_sugerido}
                                    </p>
                                    <small style={{ color: '#ffd700' }}>
                                        ℹ️ {suggestedPayment.nota}
                                    </small>
                                </div>

                                <div style={{ borderTop: '1px solid #374151', paddingTop: '15px' }}>
                                    <p style={{ marginBottom: '5px' }}><strong>Datos para Transferencia:</strong></p>
                                    <p style={{ fontFamily: 'monospace', background: '#000', padding: '5px', borderRadius: '4px' }}>
                                        Alias: <span style={{ color: '#ffd700', fontSize: '1.2em' }}>escuelarooster</span>
                                    </p>
                                    <p style={{ fontSize: '0.9em', color: '#9ca3af' }}>
                                        Titular: Emiliano Gallo
                                    </p>
                                </div>

                                <button
                                    className="btn btn-primary"
                                    style={{ width: '100%', marginTop: '15px' }}
                                    onClick={() => {
                                        const msg = `Hola! Ya realicé el pago de la Cuota ${suggestedPayment.cuota_numero} ($${suggestedPayment.monto_sugerido}) para ${user.nombre}. Adjunto comprobante!`;
                                        window.open(`https://wa.me/5493416417649?text=${encodeURIComponent(msg)}`, '_blank');
                                    }}
                                >
                                    📲 Informar Pago (WhatsApp)
                                </button>
                            </div>
                        ) : (
                            <p>No tienes pagos pendientes o no estás inscripto en un ciclo activo.</p>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
