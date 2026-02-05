'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [allResources, setAllResources] = useState([]);
    const [talleres, setTalleres] = useState([]); // Para editor de precios
    const [paymentsHistory, setPaymentsHistory] = useState([]);
    const [view, setView] = useState('stats'); // 'stats', 'students', 'resources', 'payments'
    const [filter, setFilter] = useState('all');
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (user && user.role === 'admin') {
            loadStats();
            loadStudents();
            loadAllResources();
            loadTalleres();
        }
    }, [user]);

    const loadTalleres = async () => {
        try {
            const res = await fetch('/api/v2/talleres/prices');
            const data = await res.json();
            if (data.status === 'success') {
                // Agrupar talleres por nombre base (sin turno/horario)
                const talleresUnicos = {};
                data.talleres.forEach(t => {
                    // Extraer nombre base del taller (sin "- Lunes 10hs", etc)
                    const nombreBase = t.titulo.split('-')[0].trim();
                    if (!talleresUnicos[nombreBase]) {
                        talleresUnicos[nombreBase] = {
                            ...t,
                            titulo: nombreBase,
                            ids: [t.id] // Array de IDs para actualizar todos los turnos
                        };
                    } else {
                        // Si ya existe, agregar el ID al array
                        talleresUnicos[nombreBase].ids.push(t.id);
                    }
                });
                setTalleres(Object.values(talleresUnicos));
            }
        } catch (e) { console.error(e); }
    };

    const loadPaymentsHistory = async () => {
        try {
            const res = await fetch('/api/v2/payments/history');
            const data = await res.json();
            if (data.status === 'success') setPaymentsHistory(data.alumnos);
        } catch (e) { console.error(e); }
    };

    const savePrice = async (tallerIds, precio_base, precio_desc_dia10, precio_desc_efectivo) => {
        try {
            // Actualizar TODOS los turnos del taller (si tiene múltiples horarios)
            const promises = tallerIds.map(id =>
                fetch('/api/v2/talleres/prices', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ taller_id: id, precio_base, precio_desc_dia10, precio_desc_efectivo })
                })
            );
            await Promise.all(promises);
            alert(`✅ Precios actualizados para todos los turnos`);
            loadTalleres();
        } catch (e) { alert('Error al guardar precios'); }
    };

    const loadAllResources = async () => {
        try {
            // Sin param 'taller', devuelve todos
            const res = await fetch('/api/resources');
            const data = await res.json();
            if (data.status === 'success') setAllResources(data.resources);
        } catch (e) { console.error(e); }
    };

    const loadStats = async () => {
        try {
            const res = await fetch('/api/v2/admin/stats', { cache: 'no-store' });
            const data = await res.json();
            setStats(data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const generateCoupon = async (alumno, mesIdx, montoBase) => {
        const concepto = `Cuota ${mesIdx + 1}/${new Date().getFullYear()} - ${alumno.taller}`;
        const monto = parseFloat(prompt(`Generar datos de pago para ${alumno.alumno_nombre}\nConcepto: ${concepto}\n\nConfirmar monto a cobrar:`, montoBase || 0));

        if (!monto || isNaN(monto)) return;

        try {
            const res = await fetch('/api/v2/payments/coupons/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    alumno_dni: alumno.alumno_dni,
                    monto_a_cobrar: monto,
                    concepto
                })
            });
            const data = await res.json();

            if (data.status === 'success') {
                if (data.type === 'TRANSFERENCIA') {
                    // Copiar mensaje al portapapeles
                    navigator.clipboard.writeText(data.link).then(() => {
                        alert(`✅ Datos de transferencia copiados al portapapeles!\n\nAlias: ${data.datos_bancos.alias}\nMonto: $${monto}\n\nPodés pegar el mensaje en WhatsApp.`);
                    });
                } else {
                    // PayPal u otro link
                    prompt(`✅ Link de ${data.type} generado!\nCopiá este link:`, data.link);
                }
            } else {
                alert('Error: ' + data.message);
            }
        } catch (e) { alert('Error generando cupón'); }
    };

    const sendRenewalAlerts = async () => {
        if (!confirm('¿Enviar alertas de renovación a alumnos próximos a vencer (Mes 11)?')) return;
        try {
            const res = await fetch('/api/v2/notifications/renewal-alerts', { method: 'POST' });
            const data = await res.json();
            if (data.status === 'success') {
                alert(`✅ Se procesaron ${data.procesados} alertas.\n\nAlumnos notificados:\n${data.detalles.map(d => `- ${d.alumno} (Vence: ${d.vence})`).join('\n')}`);
                // Recargar para ver estados actualizados
                loadPaymentsHistory();
            } else {
                alert('Error: ' + data.message);
            }
        } catch (e) { alert('Error enviando alertas'); }
    };

    const handleSync = async () => {
        if (!confirm('¿Sincronizar base de datos con Google Sheets?\n\nEste proceso actualizará alumnos, inscripciones y pagos con la información más reciente del Excel.')) return;

        setIsSyncing(true);
        try {
            const res = await fetch('/api/v2/admin/sync', { method: 'POST' });
            const data = await res.json();

            if (data.status === 'success') {
                alert('✅ Sincronización completada con éxito.');
                loadStats();
                loadStudents();
                loadAllResources();
            } else {
                alert('❌ Error en sincronización: ' + data.message);
            }
        } catch (e) {
            alert('❌ Error al conectar con el servidor para sincronizar.');
            console.error(e);
        } finally {
            setIsSyncing(false);
        }
    };

    const editCustomPrice = async (inscId, nombre, montoActual) => {
        const nuevoMonto = prompt(`💸 Establecer precio especial para ${nombre}\n(Solo para este taller. Dejar en 0 para usar precio general):\n\nActual: ${montoActual > 0 ? '$' + montoActual : 'General'}`, montoActual || 0);

        if (nuevoMonto === null) return;

        try {
            const res = await fetch('/api/v2/admin/enrollment/update-price', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inscripcion_id: inscId, monto_personalizado: parseFloat(nuevoMonto) })
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert('✅ Precio actualizado');
                loadPaymentsHistory();
            } else {
                alert('Error: ' + data.message);
            }
        } catch (e) { alert('Error al actualizar precio'); }
    };

    const loadStudents = async (status = '') => {
        try {
            const res = await fetch(`/api/v2/admin/students${status ? `?status=${status}` : ''}`, { cache: 'no-store' });
            const result = await res.json();
            if (result.status === 'success') {
                setStudents(result.data);
            }
        } catch (err) { console.error(err); }
    };

    const [processingDni, setProcessingDni] = useState(null);

    const toggleStudentStatus = async (dni, currentStatus) => {
        setProcessingDni(dni);
        try {
            const res = await fetch('/api/v2/admin/students', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni, activo: !currentStatus })
            });
            const result = await res.json();
            if (result.status === 'success') {
                await loadStudents(filter === 'all' ? '' : filter);
                await loadStats();
            }
        } catch (err) { alert("Error al cambiar estado"); }
        finally { setProcessingDni(null); }
    };

    const toggleNotifications = async (dni, currentStatus) => {
        // Actualización optimista para feedback instantáneo
        setStudents(prev => prev.map(s => s.dni === dni ? { ...s, notificaciones_activas: !currentStatus } : s));

        try {
            const res = await fetch('/api/v2/admin/students', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni, notificaciones_activas: !currentStatus })
            });
            const result = await res.json();
            if (result.status !== 'success') {
                // Revertir si falló
                setStudents(prev => prev.map(s => s.dni === dni ? { ...s, notificaciones_activas: currentStatus } : s));
                alert("Error al actualizar: " + result.message);
            }
        } catch (err) {
            setStudents(prev => prev.map(s => s.dni === dni ? { ...s, notificaciones_activas: currentStatus } : s));
            alert("Error de conexión al cambiar notificaciones");
        }
    };

    const sendPaymentReminders = async () => {
        const secret = 'rooster-reminders-2026';
        if (!confirm('¿Enviar recordatorios de pago automáticos?\n\nEste proceso enviará mails a los alumnos que deban el mes actual.')) return;

        try {
            const res = await fetch(`/api/v2/notifications/payment-reminders?secret=${secret}`);
            const data = await res.json();
            if (data.status === 'success') {
                alert(`✅ Se procesaron ${data.total_procesados} avisos.\n\nTipo: ${data.tipoAlerta}`);
            } else {
                alert('Error: ' + data.message);
            }
        } catch (e) { alert('Error enviando recordatorios'); }
    };

    const showPassword = async (dni) => {
        try {
            const res = await fetch(`/api/v2/admin/student-details?dni=${dni}`);
            const data = await res.json();
            if (data.status === 'success') {
                prompt(`🔑 Contraseña actual de ${data.data.nombre}:`, data.data.password);
            } else {
                alert('Error: ' + data.message);
            }
        } catch (e) { alert('Error obteniendo contraseña'); }
    };

    if (authLoading || loading) return <div className="section-padding container text-center">Cargando Panel de Control...</div>;

    if (!user || user.role !== 'admin') {
        if (typeof window !== 'undefined') window.location.href = '/login';
        return null;
    }

    return (
        <div className="section-padding container">
            <h1 className="section-title text-yellow">Panel de Administración</h1>

            <div className={styles.tabs}>
                <button className={`${styles.tab} ${view === 'stats' ? styles.tabActive : ''}`} onClick={() => setView('stats')}>📈 Estadísticas</button>
                <button className={`${styles.tab} ${view === 'students' ? styles.tabActive : ''}`} onClick={() => setView('students')}>👤 Gestión de Alumnos</button>
                <button className={`${styles.tab} ${view === 'resources' ? styles.tabActive : ''}`} onClick={() => setView('resources')}>📚 Materiales</button>
                <button className={`${styles.tab} ${view === 'payments' ? styles.tabActive : ''}`} onClick={() => { setView('payments'); loadPaymentsHistory(); loadTalleres(); }}>💳 Pagos</button>
                <button className={`${styles.tab}`} onClick={() => window.location.href = '/cronograma'}>📅 Ver Cronograma</button>
            </div>

            {view === 'stats' && (
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <h3>Neto Mensual (Estimado)</h3>
                        <p className={styles.bigNumber}>${stats?.netoMensual || 0}</p>
                        <span>Basado en cuotas pagadas y comisiones</span>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Alumnos Totales</h3>
                        <p className={styles.bigNumber}>{stats?.totalAlumnos || 0}</p>
                        <span>En todos los talleres</span>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Profesores</h3>
                        <p className={styles.bigNumber}>{stats?.totalProfesores || 0}</p>
                        <span>Docentes activos</span>
                    </div>
                </div>
            )}

            {view === 'students' && (
                <div className={styles.studentsSection}>
                    <div className={styles.filterBar}>
                        <button onClick={() => { setFilter('all'); loadStudents(); }} className={filter === 'all' ? styles.btnFilterActive : ''}>Todos</button>
                        <button onClick={() => { setFilter('pending'); loadStudents('pending'); }} className={filter === 'pending' ? styles.btnFilterActive : ''}>Pendientes 🟡</button>
                        <button onClick={() => { setFilter('active'); loadStudents('active'); }} className={filter === 'active' ? styles.btnFilterActive : ''}>Activos 🟢</button>
                    </div>

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>DNI</th>
                                    <th>Alertas</th>
                                    <th>Estado</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s) => (
                                    <tr key={s.dni}>
                                        <td>{s.nombre}</td>
                                        <td>{s.dni}</td>
                                        <td>
                                            <label className={styles.switch}>
                                                <input
                                                    type="checkbox"
                                                    checked={s.notificaciones_activas !== false} // Por defecto true si es null o true
                                                    onChange={() => toggleNotifications(s.dni, s.notificaciones_activas !== false)}
                                                />
                                                <span className={styles.slider}></span>
                                            </label>
                                        </td>
                                        <td>
                                            <span className={s.activo ? styles.tagActive : styles.tagPending}>
                                                {s.activo ? 'Activo' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button
                                                    onClick={() => toggleStudentStatus(s.dni, s.activo)}
                                                    className={s.activo ? styles.btnDeactivate : styles.btnActivate}
                                                    disabled={processingDni === s.dni}
                                                    title={s.activo ? "Dar de Baja" : "Dar de Alta"}
                                                >
                                                    {processingDni === s.dni ? '...' : (s.activo ? '🛑' : '✅')}
                                                </button>
                                                <button
                                                    onClick={() => showPassword(s.dni)}
                                                    className={styles.actionBtn}
                                                    title="Ver Contraseña"
                                                    style={{ background: '#3b82f6', border: 'none', cursor: 'pointer', padding: '5px 10px', borderRadius: '4px', fontSize: '1.2rem' }}
                                                >
                                                    👁️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === 'resources' && (
                <div className={styles.studentsSection}> {/* Reusamos estilos de sección */}
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Archivo</th>
                                    <th>Taller</th>
                                    <th>Profesor</th>
                                    <th>Subido</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    // Fetch resources on render if needed, or better, use effect. 
                                    // For simplicity here, we assume a loadResources function populates a state 'allResources'
                                    // But since I can't inject state easily in replace_file, I'll allow this block to use 'allResources' if I define it above,
                                    // OR I will refactor to put logic inside this block? No, react hooks rules.
                                    // I MUST inject the state variable 'allResources' in the top of component first.
                                    return allResources.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center">No hay recursos compartidos.</td></tr>
                                    ) : (
                                        allResources.map(r => (
                                            <tr key={r.id}>
                                                <td><a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>📄 {r.nombre}</a></td>
                                                <td>{r.taller}</td>
                                                <td>{r.profesor}</td>
                                                <td>{r.fecha}</td>
                                                <td>
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm('¿Borrar archivo de profesor?')) {
                                                                await fetch(`/api/resources?id=${r.id}`, { method: 'DELETE' });
                                                                loadAllResources(); // Reload
                                                            }
                                                        }}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                                    >🗑️</button>
                                                </td>
                                            </tr>
                                        ))
                                    );
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === 'payments' && (
                <div className={styles.studentsSection}>
                    {/* Editor de Precios */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h2>⚙️ Configuración de Precios</h2>
                        <p style={{ color: '#888', marginBottom: '1rem' }}>Actualizar cada 2-3 meses según inflación</p>
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Taller</th>
                                        <th>Precio Base</th>
                                        <th>Desc. hasta día 10</th>
                                        <th>Desc. Efectivo</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {talleres.map(t => (
                                        <tr key={t.ids[0]}>
                                            <td>{t.titulo}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    defaultValue={t.precio_base}
                                                    id={`precio_base_${t.ids[0]}`}
                                                    style={{ width: '120px', padding: '5px' }}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    defaultValue={t.precio_desc_dia10}
                                                    id={`precio_dia10_${t.ids[0]}`}
                                                    style={{ width: '120px', padding: '5px' }}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    defaultValue={t.precio_desc_efectivo}
                                                    id={`precio_efectivo_${t.ids[0]}`}
                                                    style={{ width: '120px', padding: '5px' }}
                                                />
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => {
                                                        const base = document.getElementById(`precio_base_${t.ids[0]}`).value;
                                                        const dia10 = document.getElementById(`precio_dia10_${t.ids[0]}`).value;
                                                        const efectivo = document.getElementById(`precio_efectivo_${t.ids[0]}`).value;
                                                        savePrice(t.ids, parseFloat(base), parseFloat(dia10), parseFloat(efectivo));
                                                    }}
                                                    className="btn btn-primary"
                                                    style={{ padding: '5px 15px' }}
                                                >
                                                    💾 Guardar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Vista Horizontal de Pagos */}
                    <div>
                        <h2>📊 Historial de Pagos (Vista Horizontal)</h2>
                        <p style={{ color: '#888', marginBottom: '1rem' }}>Cada celda = cuota del ciclo anual del alumno</p>
                        <div className={styles.tableWrapper} style={{ overflowX: 'auto' }}>
                            <table className={styles.table} style={{ minWidth: '1200px' }}>
                                <thead>
                                    <tr>
                                        <th>Alumno</th>
                                        <th>Taller</th>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                            <th key={n} style={{ textAlign: 'center' }}>C{n}</th>
                                        ))}
                                        <th>Inscr.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paymentsHistory.length === 0 && (
                                        <tr><td colSpan="15">Cargando historial...</td></tr>
                                    )}
                                    {paymentsHistory.map((alumno, idx) => (
                                        <tr key={idx}>
                                            <td style={{ minWidth: '200px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 'bold' }}>{alumno.alumno_nombre}</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                                                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>DNI: {alumno.alumno_dni}</span>
                                                        <button
                                                            onClick={() => editCustomPrice(alumno.id, alumno.alumno_nombre, alumno.monto_personalizado)}
                                                            className={styles.smallActionBtn}
                                                            title="Editar precio especial"
                                                            style={{
                                                                background: alumno.monto_personalizado > 0 ? '#059669' : '#4b5563',
                                                                border: 'none',
                                                                color: 'white',
                                                                fontSize: '0.65rem',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {alumno.monto_personalizado > 0 ? `$${alumno.monto_personalizado} ✏️` : '💰 Especial'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{alumno.taller}</td>
                                            {alumno.pagos.map((pago, pidx) => (
                                                <td key={pidx} style={{
                                                    textAlign: 'center',
                                                    background: pago.pagado ? '#1c8a3c' : '#2a2a2a', // Fondo oscuro si no pagó
                                                    border: pago.pagado ? 'none' : '1px solid #444',
                                                    color: 'white',
                                                    fontSize: '0.9em',
                                                    cursor: !pago.pagado ? 'pointer' : 'default',
                                                    position: 'relative'
                                                }}
                                                    title={!pago.pagado ? "Clic para generar cupón de pago" : "Pagado"}
                                                    onClick={() => !pago.pagado && generateCoupon(alumno, pidx, pago.monto)}
                                                >
                                                    {pago.pagado ? (
                                                        <>
                                                            ✅<br />
                                                            <small>${Math.round(pago.monto)}</small>
                                                        </>
                                                    ) : (
                                                        <span style={{ opacity: 0.5 }}>
                                                            🔗<br />
                                                            <small>Generar</small>
                                                        </span>
                                                    )}
                                                </td>
                                            ))}
                                            <td style={{
                                                background: alumno.estado_inscripcion === 'VIGENTE' ? '#1c8a3c' : '#8a1c1c',
                                                color: 'white'
                                            }}>
                                                {alumno.estado_inscripcion === 'POR_VENCER' && '⚠️ '}
                                                {alumno.fecha_vencimiento_ciclo || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Botón de Acciones Masivas */}
                        <div style={{ marginTop: '2rem' }}>
                            <button
                                onClick={sendRenewalAlerts}
                                className="btn btn-outline"
                                style={{ border: '1px solid #eab308', color: '#eab308' }}
                            >
                                🔔 Alerta Renovación Anual
                            </button>
                            <button
                                onClick={sendPaymentReminders}
                                className="btn btn-outline"
                                style={{ border: '1px solid #10b981', color: '#10b981', marginLeft: '10px' }}
                            >
                                📩 Enviar Avisos de Pago del Mes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.adminActions}>
                <h2>Gestión Rápida</h2>
                <div className={styles.buttonGroup}>
                    <a href="https://docs.google.com/spreadsheets/d/1X562v1K8Y0oP70zI1yWlVlA-pX-L9X9E-8X9L9X9E-8X" target="_blank" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                        Abrir Google Sheets
                    </a>
                    <button className="btn btn-outline" onClick={() => window.location.href = '/mi-cuenta'}>
                        👤 Mi Perfil / Seguridad
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSync}
                        disabled={isSyncing}
                        style={{ background: isSyncing ? '#4b5563' : '#10b981', border: 'none' }}
                    >
                        {isSyncing ? '⏳ Sincronizando...' : '📥 Sincronizar desde Sheets'}
                    </button>
                    <button className="btn btn-outline" onClick={() => window.location.reload()}>
                        🔄 Refrescar Vista
                    </button>
                </div>
            </div>

            <div className={styles.infoBox}>
                <p>💡 <strong>Tip:</strong> Para que el cálculo del Neto sea exacto, asegúrate de que cada taller en la pestaña <code>TALLERES</code> tenga su porcentaje de comisión asignado (1.0 para vos, 0.3 para otros profes).</p>
            </div>
        </div>
    );
}
