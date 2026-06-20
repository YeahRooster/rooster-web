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
    const [loadingCheckout, setLoadingCheckout] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null);

    // Estado para taller seleccionado (Profes que dan varios)
    const [selectedTaller, setSelectedTaller] = useState('');

    // Estados para desafíos (Retos)
    const [challenges, setChallenges] = useState([]);
    const [loadingChallenges, setLoadingChallenges] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [selectedChallenge, setSelectedChallenge] = useState(null);
    const [submissionData, setSubmissionData] = useState({ imageBase64: '', caption: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [voterStats, setVoterStats] = useState({}); // { challengeId: { used: 0, locked: false, myVotes: [] } }

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const status = params.get('payment');
            if (status) {
                setPaymentStatus(status);
                // Limpiar parámetros para evitar repetir notificaciones
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            }
        }
    }, []);

    useEffect(() => {
        if (user && user.role === 'student') {
            loadSuggestedPayment();
            // Mostrar alerta del 1 al 15 de cada mes (para que se vea hoy día 14)
            const hoy = new Date();
            if (hoy.getDate() <= 15) {
                const dismissed = localStorage.getItem('dismiss_discount_alert');
                if (!dismissed) setShowAlert(true);
            }
            loadAccountChallenges();
        }

        if (user && user.role === 'teacher' && user.taller) {
            const lista = user.taller.split(',').map(t => t.trim());
            if (!selectedTaller) setSelectedTaller(lista[0]);
        }
    }, [user]);

    useEffect(() => {
        if (user && user.role === 'teacher' && selectedTaller) {
            loadTeacherData(selectedTaller);
        }
    }, [user, selectedTaller]);

    const loadSuggestedPayment = async () => {
        if (!user?.dni) return;
        setLoadingPayment(true);
        try {
            const res = await fetch(`/api/v2/payments/suggest-amount?alumno_dni=${user.dni}&metodo_pago=TRANSFERENCIA`, { cache: 'no-store' });
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

    const loadTeacherData = async (tallerName) => {
        const taller = tallerName || selectedTaller;
        if (!taller) return;
        setLoadingTeacher(true);
        try {
            // Alumnos
            const resV2 = await fetch(`/api/v2/teacher/data?taller=${encodeURIComponent(taller)}`, { cache: 'no-store' });
            const dataV2 = await resV2.json();

            // Recursos
            const resRes = await fetch(`/api/resources?taller=${encodeURIComponent(taller)}`, { cache: 'no-store' });
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

    const loadAccountChallenges = async () => {
        if (!user?.dni) return;
        setLoadingChallenges(true);
        try {
            const res = await fetch(`/api/v2/challenges?dni=${user.dni}`);
            const data = await res.json();
            if (data.status === 'success' && Array.isArray(data.data)) {
                setChallenges(data.data);
                const stats = {};
                data.data.forEach(c => {
                    stats[c.id] = {
                        used: (c.myVotes || []).length,
                        locked: c.isLocked || false,
                        myVotes: c.myVotes || []
                    };
                });
                setVoterStats(stats);
            }
        } catch (e) { console.error(e); }
        finally { setLoadingChallenges(false); }
    };

    const handleSubmitChallenge = async () => {
        if (!submissionData.imageBase64 || !submissionData.caption) return alert("Falta imagen o descripción");
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/v2/challenges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    challenge_id: selectedChallenge.id,
                    student_dni: user.dni,
                    student_name: user.nombre,
                    image_base64: submissionData.imageBase64,
                    bio: submissionData.caption
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert("✅ Obra subida con éxito! Mucha suerte.");
                setShowSubmitModal(false);
                setSubmissionData({ imageBase64: '', caption: '' });
                loadAccountChallenges();
            } else { alert("❌ Error: " + data.message); }
        } catch (e) { alert("Error de conexión"); }
        finally { setIsSubmitting(false); }
    };

    const handleVote = async (challengeId, submissionId) => {
        const stats = voterStats[challengeId];
        if (stats?.locked) return alert("🔒 Ya has usado tus 3 votos para este desafío.");

        try {
            const res = await fetch('/api/v2/challenges/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ challenge_id: challengeId, submission_id: submissionId, voter_dni: user.dni })
            });
            const data = await res.json();
            if (data.status === 'success') {
                loadAccountChallenges();
            } else { alert(data.message); }
        } catch (e) { alert("Error al votar"); }
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
                        taller: selectedTaller,
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
                    taller: selectedTaller,
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

    const handleChangePassword = async () => {
        const newPass = prompt("Ingresa tu nueva contraseña:");
        if (!newPass) return;

        if (newPass.length < 4) {
            alert("La contraseña debe tener al menos 4 caracteres.");
            return;
        }

        try {
            const res = await fetch('/api/v2/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dni: user.dni,
                    newPassword: newPass,
                    role: user.role
                })
            });

            const data = await res.json();
            if (data.status === 'success') {
                alert("✅ ¡Éxito! Tu contraseña ha sido cambiada correctamente.");
            } else {
                alert("❌ Error: " + data.message);
            }
        } catch (error) {
            alert("❌ Hubo un problema al conectar con el servidor.");
        }
    };

    const handleMercadoPagoCheckout = async () => {
        if (!user?.dni) return;
        setLoadingCheckout(true);
        try {
            const res = await fetch('/api/v2/payments/mercadopago/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni: user.dni })
            });
            const data = await res.json();
            if (data.status === 'success' && data.init_point) {
                window.location.href = data.init_point;
            } else {
                alert("❌ Error: " + (data.message || 'No se pudo generar la orden de pago. Reintentá.'));
            }
        } catch (error) {
            console.error("Error al procesar pago con MP:", error);
            alert("❌ Hubo un problema al conectar con el servidor.");
        } finally {
            setLoadingCheckout(false);
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
                <h1 className="section-title text-yellow">Panel del Profesor (v2.2): {user.nombre}</h1>

                <div className={styles.profileCard} style={{ marginBottom: '2rem', maxWidth: '600px' }}>
                    <h2 className={styles.cardTitle}>Información Personal</h2>
                    <p><strong>Perfil:</strong> Profesor</p>
                    <p><strong>Nombre:</strong> {user.nombre}</p>
                    <p><strong>DNI:</strong> {user.dni}</p>

                    {/* Selector de Taller si tiene varios */}
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #374151' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--rooster-yellow)', fontWeight: 'bold' }}>
                            Gestionar Taller:
                        </label>
                        <select
                            value={selectedTaller}
                            onChange={(e) => setSelectedTaller(e.target.value)}
                            className={styles.workshopSelect}
                            style={{
                                width: '100%',
                                padding: '10px',
                                background: '#0d1b2a',
                                color: 'white',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                cursor: 'pointer'
                            }}
                        >
                            {user.taller.split(',').map((t, idx) => (
                                <option key={idx} value={t.trim()}>{t.trim()}</option>
                            ))}
                        </select>
                        <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                            * Seleccioná el taller para ver alumnos y subir material específico.
                        </p>
                    </div>

                    <button onClick={handleChangePassword} className={styles.changePassBtn}>
                        🔑 Cambiar Contraseña
                    </button>
                </div>

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
                                            <tr>
                                                <td colSpan="2" className="text-center" style={{ padding: '2rem', color: '#9ca3af' }}>
                                                    No hay alumnos en "{selectedTaller}".
                                                    <br />
                                                    <small>* Verificá la sincronización desde el Admin si esto es un error.</small>
                                                </td>
                                            </tr>
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
            {paymentStatus === 'success' && (
                <div className={styles.discountAlert} style={{ borderColor: '#4ade80', background: '#064e3b' }}>
                    <div className={styles.alertIcon}>✅</div>
                    <div className={styles.alertContent}>
                        <strong>¡Pago recibido con éxito!</strong>
                        <p>Tu pago ha sido acreditado de forma automática y el sistema registrará los cambios en unos momentos. ¡Muchas gracias!</p>
                    </div>
                    <button onClick={() => setPaymentStatus(null)} className={styles.closeAlert}>✕</button>
                </div>
            )}
            {paymentStatus === 'pending' && (
                <div className={styles.discountAlert} style={{ borderColor: '#f59e0b', background: '#78350f' }}>
                    <div className={styles.alertIcon}>⏳</div>
                    <div className={styles.alertContent}>
                        <strong>Pago en proceso</strong>
                        <p>El pago está siendo procesado por MercadoPago. En cuanto se acredite, tu estado se actualizará de forma automática.</p>
                    </div>
                    <button onClick={() => setPaymentStatus(null)} className={styles.closeAlert}>✕</button>
                </div>
            )}
            {paymentStatus === 'failure' && (
                <div className={styles.discountAlert} style={{ borderColor: '#ef4444', background: '#7f1d1d' }}>
                    <div className={styles.alertIcon}>❌</div>
                    <div className={styles.alertContent}>
                        <strong>Error al procesar el pago</strong>
                        <p>Hubo un problema al procesar tu pago con MercadoPago. Por favor, intenta de nuevo o realiza una transferencia manual.</p>
                    </div>
                    <button onClick={() => setPaymentStatus(null)} className={styles.closeAlert}>✕</button>
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
                        🔑 Cambiar Contraseña
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
                                    <tr><th>Taller</th><th>Mes</th><th>Estado</th><th>Fecha</th><th>Monto</th></tr>
                                </thead>
                                <tbody>
                                    {pagos.filter(p => p.mes && p.anio && p.mes !== '-').map((p, i) => (
                                        <tr key={i}>
                                            <td>{p.taller}</td>
                                            <td>{p.mes}</td>
                                            <td>
                                                <span className={
                                                    p.estado?.toLowerCase() === 'pagado' ? styles.tagPaid :
                                                        p.estado?.toLowerCase() === 'excluido' ? styles.tagExcluded :
                                                            styles.tagPending
                                                }>
                                                    {p.estado?.toLowerCase() === 'excluido' ? 'Vacaciones' : p.estado}
                                                </span>
                                            </td>
                                            <td>
                                                <small style={{ color: '#9ca3af' }}>
                                                    {(p.fecha_real_pago || p.fecha_pago) ? new Date(p.fecha_real_pago || p.fecha_pago).toLocaleDateString('es-AR') : '-'}
                                                </small>
                                            </td>
                                            <td>{p.estado?.toLowerCase() === 'excluido' ? 'N/A' : `$${p.monto}`}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className={styles.profileCard} style={{ border: '1px solid #ffd700', gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>🏆 Desafíos Artísticos</h2>
                        <button
                            onClick={() => window.location.href = '/desafios'}
                            className="btn btn-primary"
                            style={{ background: 'var(--rooster-yellow)', color: '#0d1b2a', border: 'none', fontWeight: 'bold' }}
                        >
                            Ver Desafíos Activos →
                        </button>
                    </div>
                    <p style={{ color: '#9ca3af', fontSize: '0.95rem' }}>
                        Participá en los retos mensuales, subí tus obras y votá por las mejores creaciones de la escuela.
                    </p>
                </div>

                <div className={styles.profileCard} style={{ border: '1px solid #ffd700', gridColumn: '1 / -1' }}>
                    {(() => {
                        const adelanto = suggestedPayment?.items?.find(i => i.is_adelantado);
                        const hasDeuda = suggestedPayment?.items?.some(i => !i.is_adelantado);
                        let paymentTitle = "💳 Pagar Cuota del Mes";
                        if (adelanto && !hasDeuda) {
                            paymentTitle = `💳 Si querés adelantar tu pago del mes que viene (${adelanto.mes_nombre}), podés hacerlo acá:`;
                        } else if (hasDeuda && adelanto) {
                            paymentTitle = "💳 Cuotas Pendientes y Adelanto";
                        }
                        return <h2 className={styles.cardTitle}>{paymentTitle}</h2>;
                    })()}
                    {loadingPayment ? <p>Calculando monto actual...</p> : (
                        suggestedPayment && suggestedPayment.items && suggestedPayment.items.length > 0 ? (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                    {suggestedPayment.items.map((item, idx) => (
                                        <div key={idx} style={{ background: '#122336', padding: '1.5rem', borderRadius: '12px', border: '1px solid #2a4a6d' }}>
                                            <p style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px', color: 'var(--rooster-yellow)' }}>
                                                {item.taller}
                                            </p>
                                            <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '1rem' }}>
                                                Cuota {item.cuota_numero} ({item.mes_nombre})
                                            </p>

                                            <div style={{ background: '#0d1b2a', padding: '1rem', borderRadius: '8px', marginBottom: '10px' }}>
                                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4ade80', margin: 0 }}>
                                                    ${item.monto_sugerido}
                                                </p>
                                                <small style={{ color: '#ffd700', fontSize: '0.75rem' }}>
                                                    ℹ️ {item.nota}
                                                </small>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ background: '#1f2937', padding: '1.5rem', borderRadius: '12px', border: '2px dashed #ffd700' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Total a Transferir</h3>
                                            <p style={{ color: '#9ca3af', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
                                                Sumatoria de {suggestedPayment.items.length} taller(es)
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#4ade80', margin: 0 }}>
                                                ${suggestedPayment.items.reduce((acc, curr) => acc + curr.monto_sugerido, 0)}
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ borderTop: '1px solid #374151', marginTop: '1.5rem', paddingTop: '1rem' }}>
                                        <p style={{ marginBottom: '8px' }}><strong>Datos para la Transferencia:</strong></p>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px', background: '#000', padding: '10px', borderRadius: '4px' }}>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.8rem' }}>Alias:</p>
                                                <p style={{ margin: 0, color: '#ffd700', fontSize: '1.2rem', fontFamily: 'monospace' }}>escuelarooster</p>
                                            </div>
                                            <div style={{ borderLeft: '1px solid #333', paddingLeft: '10px' }}>
                                                <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.8rem' }}>Titular:</p>
                                                <p style={{ margin: 0, fontSize: '0.9rem' }}>Emiliano Gallo</p>
                                            </div>
                                            <button
                                                className="btn btn-primary"
                                                style={{
                                                    width: '100%',
                                                    fontSize: '1.15rem',
                                                    padding: '14px',
                                                    marginBottom: '15px',
                                                    background: 'linear-gradient(135deg, #009ee3 0%, #007eb5 100%)',
                                                    border: 'none',
                                                    fontWeight: 'bold',
                                                    color: 'white',
                                                    boxShadow: '0 4px 15px rgba(0, 158, 227, 0.3)',
                                                    transition: 'transform 0.2s, box-shadow 0.2s'
                                                }}
                                                onClick={handleMercadoPagoCheckout}
                                                disabled={loadingCheckout}
                                            >
                                                {loadingCheckout ? '⏳ Generando orden de pago...' : '💳 Pagar Online con MercadoPago'}
                                            </button>

                                            <div style={{ textAlign: 'center', margin: '15px 0', color: '#9ca3af', fontSize: '0.9rem' }}>
                                                — o si ya realizaste una transferencia —
                                            </div>

                                            <button
                                                className="btn btn-outline"
                                                style={{
                                                    width: '100%',
                                                    fontSize: '1rem',
                                                    padding: '10px',
                                                    borderColor: '#25d366',
                                                    color: '#25d366',
                                                    background: 'transparent'
                                                }}
                                                onClick={() => {
                                                    const total = suggestedPayment.items.reduce((acc, curr) => acc + curr.monto_sugerido, 0);
                                                    const detalle = suggestedPayment.items.map(i => `${i.taller} (C${i.cuota_numero})`).join(', ');
                                                    const msg = `Hola! Realicé la transferencia de $${total} por: ${detalle}. Alumno: ${user.nombre}. Adjunto comprobante!`;
                                                    window.open(`https://wa.me/5493425263036?text=${encodeURIComponent(msg)}`, '_blank');
                                                }}
                                            >
                                                📲 Informar Pago por WhatsApp
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <p style={{ fontSize: '1.2rem', color: '#9ca3af' }}>No tienes cuotas pendientes por abonar.</p>
                                <p style={{ fontSize: '0.9rem', color: '#666' }}>¡Gracias por estar al día!</p>
                            </div>
                        )
                    )}
                </div>
            </div>

            {showSubmitModal && (
                <div className={styles.modalOverlay} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#1f2937', padding: '2rem', borderRadius: '20px', maxWidth: '500px', width: '100%', border: '1px solid #374151' }}>
                        <h2 style={{ color: 'var(--rooster-yellow)', marginBottom: '0.5rem' }}>🎨 Participar en {selectedChallenge?.titulo}</h2>
                        <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '2rem' }}>Subí una foto de tu obra y contanos un poquito sobre ella.</p>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Tu Obra:</label>
                            {submissionData.imageBase64 ? (
                                <div style={{ position: 'relative' }}>
                                    <img src={`data:image/jpeg;base64,${submissionData.imageBase64}`} style={{ width: '100%', borderRadius: '12px' }} />
                                    <button onClick={() => setSubmissionData({ ...submissionData, imageBase64: '' })} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', width: '30px', height: '30px' }}>✕</button>
                                </div>
                            ) : (
                                <div style={{ border: '2px dashed #4b5563', padding: '2rem', textAlign: 'center', borderRadius: '12px' }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="sub-file"
                                        hidden
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (f) => setSubmissionData({ ...submissionData, imageBase64: f.target.result.split(',')[1] });
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    <label htmlFor="sub-file" style={{ cursor: 'pointer', color: 'var(--rooster-yellow)', fontWeight: 'bold' }}>📷 Seleccionar Foto</label>
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Contanos sobre tu obra (Bio/Descripción):</label>
                            <textarea
                                style={{ width: '100%', background: '#0d1b2a', border: '1px solid #374151', borderRadius: '8px', color: 'white', padding: '10px', resize: 'vertical' }}
                                rows="3"
                                placeholder="¿Qué te inspiró? ¿Qué materiales usaste?"
                                value={submissionData.caption}
                                onChange={(e) => setSubmissionData({ ...submissionData, caption: e.target.value })}
                            ></textarea>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowSubmitModal(false)}>Cancelar</button>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1, background: 'var(--rooster-yellow)', border: 'none', color: '#0d1b2a' }}
                                disabled={isSubmitting}
                                onClick={handleSubmitChallenge}
                            >
                                {isSubmitting ? 'Subiendo...' : '🚀 Subir Obra'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
