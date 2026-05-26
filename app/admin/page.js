'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import WorkshopsTab from './WorkshopsTab';
import ReportsTab from './ReportsTab';

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [allResources, setAllResources] = useState([]);
    const [talleres, setTalleres] = useState([]); // Para editor de precios
    const [paymentsHistory, setPaymentsHistory] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [view, setView] = useState('stats'); // 'stats', 'students', 'resources', 'payments', 'gallery', 'workshops', 'reports'
    const [filter, setFilter] = useState('all');
    const [showInactive, setShowInactive] = useState(false);
    const [galleryPosts, setGalleryPosts] = useState([]);
    const [challenges, setChallenges] = useState([]);
    const [showChallengeModal, setShowChallengeModal] = useState(false);
    const [newChallenge, setNewChallenge] = useState({
        titulo: '',
        descripcion: '',
        talleres_participantes: [],
        fecha_inicio: '',
        fecha_cierre_subida: '',
        fecha_cierre_votacion: ''
    });
    const [isSavingChallenge, setIsSavingChallenge] = useState(false);
    const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
    const [currentSubmissions, setCurrentSubmissions] = useState([]);
    const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

    // Estados para Centro de Comunicación
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [selectedTallerIds, setSelectedTallerIds] = useState([]); // Array de IDs
    const [broadcastTargetAll, setBroadcastTargetAll] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    // NUEVOS ESTADOS: Búsqueda y Modal de Alumno
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [newStudent, setNewStudent] = useState({ dni: '', nombre: '', email: '', telefono: '', talleres: [] });
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    
    // ESTADOS PARA EDICIÓN DE ALUMNOS
    const [showEditStudentModal, setShowEditStudentModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [isSavingStudent, setIsSavingStudent] = useState(false);

    useEffect(() => {
        if (user && user.role === 'admin') {
            loadStats();
            loadStudents(); // Cargará datos enriquecidos
            loadAllResources();
            loadTalleres();
            loadGalleryPosts();
            loadChallenges();
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
                            ids: [t.id], // Array de IDs para actualizar todos los turnos
                            activo_grupal: t.activo
                        };
                    } else {
                        // Si ya existe, agregar el ID al array
                        talleresUnicos[nombreBase].ids.push(t.id);
                        if (t.activo) talleresUnicos[nombreBase].activo_grupal = true;
                    }
                });
                setTalleres(Object.values(talleresUnicos));
            }
        } catch (e) { console.error(e); }
    };

    const toggleWorkshop = async (tallerIds, currentStatus) => {
        try {
            const promises = tallerIds.map(id =>
                fetch('/api/v2/talleres/prices', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ taller_id: id, activo: !currentStatus })
                })
            );
            await Promise.all(promises);
            // Actualizar el estado de manera optimista
            setTalleres(prev => prev.map(t => t.ids[0] === tallerIds[0] ? { ...t, activo_grupal: !currentStatus } : t));
        } catch (e) { alert('Error al actualizar visibilidad'); }
    };

    const loadPaymentsHistory = async (year) => {
        try {
            const targetYear = year !== undefined ? year : selectedYear;
            const res = await fetch(`/api/v2/payments/history?anio=${targetYear}`);
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

    const loadGalleryPosts = async () => {
        try {
            const res = await fetch('/api/social/posts?status=all&limit=50', { cache: 'no-store' });
            if (!res.ok) throw new Error('Error cargando galería');

            const data = await res.json();
            if (data.status === 'success') setGalleryPosts(data.data); // Nota: api/social/posts devuelve { data: posts }
        } catch (e) {
            console.error("Error al cargar galería:", e);
        }
    };

    const toggleFeaturePost = async (postId, currentStatus) => {
        try {
            const res = await fetch('/api/v2/gallery/feature', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: postId, featured: !currentStatus })
            });
            const data = await res.json();
            if (data.status === 'success') {
                // Actualización optimista o recarga
                setGalleryPosts(prev => prev.map(p => p.id === postId ? { ...p, featured: !currentStatus } : p));
            } else {
                alert('Error: ' + data.message);
            }
        } catch (e) { alert('Error al destacar obra'); }
    };

    const deletePost = async (postId) => {
        if (!confirm('¿Seguro que querés eliminar esta obra definitivamente?')) return;
        try {
            const res = await fetch(`/api/social/posts?id=${postId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.status === 'success') {
                setGalleryPosts(prev => prev.filter(p => p.id !== postId));
            } else {
                alert('Error al eliminar');
            }
        } catch (e) { alert('Error de conexión'); }
    };

    const loadStats = async () => {
        try {
            const res = await fetch('/api/v2/admin/stats', { cache: 'no-store' });
            const data = await res.json();
            setStats(data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const loadChallenges = async () => {
        try {
            const res = await fetch('/api/v2/admin/challenges');
            const data = await res.json();
            if (data.status === 'success') setChallenges(data.data);
        } catch (e) { console.error(e); }
    };

    const loadChallengeSubmissions = async (challengeId) => {
        setIsLoadingSubmissions(true);
        setShowSubmissionsModal(true);
        try {
            const res = await fetch(`/api/v2/admin/challenges?challenge_id=${challengeId}`);
            const data = await res.json();
            if (data.status === 'success') setCurrentSubmissions(data.data);
        } catch (e) { console.error(e); }
        finally { setIsLoadingSubmissions(false); }
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
            // Usamos la v2 de /enriched para tener estado de pago y cuotas
            const res = await fetch(`/api/v2/admin/students/enriched`, { cache: 'no-store' });
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

    const toggleAccesoRestringido = async (dni, currentStatus) => {
        if (!confirm(`¿Estás seguro que quieres ${currentStatus ? 'desbloquear' : 'bloquear'} la plataforma para este alumno?`)) return;
        setProcessingDni(dni);
        try {
            const res = await fetch('/api/v2/admin/students', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni, acceso_restringido: !currentStatus })
            });
            const result = await res.json();
            if (result.status === 'success') {
                await loadStudents(filter === 'all' ? '' : filter);
            } else {
                alert("Error al actualizar acceso: " + result.message);
            }
        } catch (err) { alert("Error de conexión al cambiar acceso"); }
        finally { setProcessingDni(null); }
    };

    const markManualPayment = async (dni, taller, mes, anio, monto) => {
        const confirmMonto = prompt(`Efectivo: Confirmar monto pagado para el mes ${mes}:`, monto || 0);
        if (!confirmMonto || isNaN(confirmMonto)) return;
        
        try {
            const res = await fetch('/api/v2/admin/payments/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni, taller, mes, anio, monto: parseFloat(confirmMonto) })
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert('✅ Pago registrado en caja');
                loadPaymentsHistory();
                loadStats();
            } else {
                alert('Error: ' + data.message);
            }
        } catch (e) {
            alert('Error de conexión al registrar pago');
        }
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

    const handleBroadcast = async () => {
        if (!broadcastMessage.trim()) return alert("Escribí un mensaje.");
        if (!broadcastTargetAll && selectedTallerIds.length === 0) return alert("Seleccioná al menos un taller o marcá 'Todos'.");

        setIsBroadcasting(true);
        try {
            const res = await fetch('/api/social/notifications/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mensaje: broadcastMessage,
                    tallerIds: selectedTallerIds,
                    targetAll: broadcastTargetAll
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert(`✅ Notificación enviada a ${data.count} alumnos.`);
                setShowBroadcastModal(false);
                setBroadcastMessage('');
                setSelectedTallerIds([]);
                setBroadcastTargetAll(false);
            } else { alert('Error: ' + data.message); }
        } catch (e) { alert('Error enviando notificación'); }
        finally { setIsBroadcasting(false); }
    };

    const handleAddStudent = async () => {
        if (!newStudent.dni || !newStudent.nombre) return alert("DNI y Nombre son obligatorios");
        setIsAddingStudent(true);
        try {
            const res = await fetch('/api/v2/admin/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStudent)
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert("✅ Alumno registrado y sincronizado con éxito.");
                setShowAddStudentModal(false);
                setNewStudent({ dni: '', nombre: '', email: '', telefono: '', talleres: [] });
                loadStudents();
            } else {
                alert("❌ Error: " + data.message);
            }
        } catch (e) { alert("Error al registrar alumno"); }
        finally { setIsAddingStudent(false); }
    };

    const handleEditStudent = async () => {
        if (!editingStudent.nombre) return alert("El nombre es obligatorio");
        setIsSavingStudent(true);
        try {
            const res = await fetch('/api/v2/admin/students', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dni: editingStudent.dni,
                    nombre: editingStudent.nombre,
                    email: editingStudent.email || null,
                    telefono: editingStudent.telefono || null
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert("✅ Datos del alumno actualizados con éxito.");
                setShowEditStudentModal(false);
                setEditingStudent(null);
                loadStudents();
            } else {
                alert("❌ Error: " + data.message);
            }
        } catch (e) {
            alert("Error al actualizar datos del alumno");
        } finally {
            setIsSavingStudent(false);
        }
    };

    const sendIndividualReminder = async (dni, nombre) => {
        if (!confirm(`¿Enviar recordatorio de pago a ${nombre}?`)) return;
        try {
            const res = await fetch('/api/social/notifications/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mensaje: `¡Hola ${nombre}! Te recordamos que la cuota del mes se encuentra vencida. Por favor regularizá tu situación en Mi Cuenta.`,
                    targetDni: dni // Necesitaré ajustar la API para aceptar targetDni o usar la existente
                })
            });
            const data = await res.json();
            if (data.status === 'success') alert("✅ Recordatorio enviado.");
        } catch (e) { alert("Error al enviar recordatorio"); }
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

    const handleSaveChallenge = async () => {
        if (!newChallenge.titulo || !newChallenge.fecha_inicio || !newChallenge.fecha_cierre_subida || !newChallenge.fecha_cierre_votacion) {
            return alert("Faltan campos obligatorios");
        }
        setIsSavingChallenge(true);
        try {
            const res = await fetch('/api/v2/admin/challenges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newChallenge)
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert("✅ Desafío creado con éxito");
                setShowChallengeModal(false);
                setNewChallenge({ titulo: '', descripcion: '', talleres_participantes: [], fecha_inicio: '', fecha_cierre_subida: '', fecha_cierre_votacion: '' });
                loadChallenges();
            } else {
                alert("❌ Error: " + data.message);
            }
        } catch (e) { alert("Error al guardar desafío"); }
        finally { setIsSavingChallenge(false); }
    };

    const handleDeleteChallenge = async (id) => {
        if (!confirm('¿Seguro que querés eliminar este desafío? Se perderán todas las obras y votos.')) return;
        try {
            const res = await fetch(`/api/v2/admin/challenges?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.status === 'success') {
                loadChallenges();
            } else { alert('Error al eliminar'); }
        } catch (e) { alert('Error de conexión'); }
    };

    const handleDeleteSubmission = async (submissionId) => {
        if (!confirm("¿Seguro que quieres eliminar esta obra? El alumno podrá volver a subir una nueva una vez eliminada.")) return;
        try {
            const res = await fetch(`/api/v2/admin/challenges?submission_id=${submissionId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.status === 'success') {
                // Actualizar la lista local quitando la obra eliminada
                setCurrentSubmissions(prev => prev.filter(s => s.id !== submissionId));
                alert("Obra eliminada correctamente.");
            } else {
                alert("Error: " + data.message);
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        }
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
                <button className={`${styles.tab} ${view === 'students' ? styles.tabActive : ''}`} onClick={() => setView('students')}>👤 Alumnos</button>
                <button className={`${styles.tab} ${view === 'workshops' ? styles.tabActive : ''}`} onClick={() => { setView('workshops'); loadTalleres(); }}>🏢 Talleres</button>
                <button className={`${styles.tab} ${view === 'resources' ? styles.tabActive : ''}`} onClick={() => setView('resources')}>📚 Materiales</button>
                <button className={`${styles.tab} ${view === 'gallery' ? styles.tabActive : ''}`} onClick={() => { setView('gallery'); loadGalleryPosts(); }}>🎨 Galería</button>
                <button className={`${styles.tab} ${view === 'payments' ? styles.tabActive : ''}`} onClick={() => { setView('payments'); loadPaymentsHistory(); loadTalleres(); }}>💳 Pagos</button>
                <button className={`${styles.tab} ${view === 'reports' ? styles.tabActive : ''}`} onClick={() => { setView('reports'); loadPaymentsHistory(); }}>📊 Reportes</button>
                <button className={`${styles.tab} ${view === 'challenges' ? styles.tabActive : ''}`} onClick={() => { setView('challenges'); loadChallenges(); loadTalleres(); }}>🏆 Desafíos</button>
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
                        <h3>Alumnos Activos</h3>
                        <p className={styles.bigNumber}>{stats?.totalAlumnos || 0}</p>
                        <span>Cursa actualmente</span>
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
                    <div className={styles.topActions}>
                        <div className={styles.searchBar}>
                            <input
                                type="text"
                                placeholder="Buscar por nombre, DNI o email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <span className={styles.searchIcon}>🔍</span>
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{ background: '#c084fc', border: 'none', fontWeight: 'bold' }}
                            onClick={() => setShowAddStudentModal(true)}
                        >
                            + Nuevo Alumno
                        </button>
                    </div>

                    <div className={styles.filterBar}>
                        <button onClick={() => { setFilter('all'); loadStudents(); }} className={filter === 'all' ? styles.btnFilterActive : ''}>Todos</button>
                        <button onClick={() => { setFilter('pending'); loadStudents('pending'); }} className={filter === 'pending' ? styles.btnFilterActive : ''}>Pendientes 🟡</button>
                        <button onClick={() => { setFilter('active'); loadStudents('active'); }} className={filter === 'active' ? styles.btnFilterActive : ''}>Activos 🟢</button>
                        
                        <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', color: '#9ca3af', cursor: 'pointer' }}>
                            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
                            Mostrar Inactivos (Bajas)
                        </label>
                    </div>

                    <div className={styles.cardsGrid}>
                        {students
                            .filter(s => {
                                const q = searchQuery.toLowerCase();
                                return s.nombre.toLowerCase().includes(q) || s.dni.includes(q) || (s.email && s.email.toLowerCase().includes(q));
                            })
                            .filter(s => {
                                if (filter === 'all') {
                                    if (!showInactive && !s.activo) return false;
                                    return true;
                                }
                                return filter === 'active' ? s.activo : !s.activo;
                            })
                            .sort((a, b) => {
                                if (a.activo === b.activo) return a.nombre.localeCompare(b.nombre);
                                return a.activo ? -1 : 1;
                            })
                            .map((s) => (
                                <div key={s.dni} className={styles.studentCard} style={{ opacity: s.activo ? 1 : 0.6, filter: s.activo ? 'none' : 'grayscale(80%)' }}>
                                    <div className={styles.cardHeader}>
                                        <div className={styles.avatar}>
                                            {s.nombre.charAt(0).toUpperCase()}
                                        </div>
                                        <div className={styles.headerInfo}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                        <h4 style={{ margin: 0 }}>{s.nombre}</h4>
                                                        <button
                                                            onClick={() => {
                                                                setEditingStudent({ dni: s.dni, nombre: s.nombre, email: s.email || '', telefono: s.telefono || '' });
                                                                setShowEditStudentModal(true);
                                                            }}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', padding: '2px', display: 'inline-flex', alignSelf: 'center' }}
                                                            title="Editar datos de contacto"
                                                        >
                                                            ✏️
                                                        </button>
                                                    </div>
                                                    <p>{s.email || 'Sin email'}</p>
                                                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>{s.dni}</p>
                                                    <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{s.telefono || 'Sin teléfono'}</p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'flex-start' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                        <span style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 'bold' }}>ALERTAS</span>
                                                        <label className={styles.switch}>
                                                            <input
                                                                type="checkbox"
                                                                checked={s.notificaciones_activas}
                                                                onChange={() => toggleNotifications(s.dni, s.notificaciones_activas)}
                                                            />
                                                            <span className={styles.slider}></span>
                                                        </label>
                                                    </div>
                                                    <div className={`${styles.statusBadge} ${s.paga_este_mes ? styles.statusPaid : styles.statusPending}`} style={{ position: 'static' }}>
                                                        {s.paga_este_mes ? 'PAGADO' : 'PENDIENTE'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.cardBody}>
                                        <div className={styles.feeInfo}>
                                            <span>Cobro Mensual</span>
                                            <strong onClick={() => {
                                                // Permitir edición rápida si es un solo taller
                                                if (s.inscripciones?.length === 1) {
                                                    editCustomPrice(s.inscripciones[0].id, s.nombre, s.inscripciones[0].monto);
                                                } else {
                                                    alert("Este alumno tiene varios talleres. Editá los precios en la sección de 'Pagos'.");
                                                }
                                            }} style={{ cursor: 'pointer' }}>
                                                ${s.cuota_total}/mes ✏️
                                            </strong>
                                        </div>
                                        <div className={styles.vencimiento}>
                                            <span>📅 Día 10</span>
                                        </div>
                                    </div>

                                    <div className={styles.cardActions}>
                                        <a href={`https://wa.me/${s.telefono?.replace(/\D/g, '') || ''}`} target="_blank" rel="noreferrer" className={styles.actionBtnSocial}>
                                            WhatsApp
                                        </a>
                                        <a href={`mailto:${s.email}`} className={styles.actionBtnSocial}>
                                            Email
                                        </a>
                                        <button onClick={() => sendIndividualReminder(s.dni, s.nombre)} className={styles.actionBtnSocial} style={{ background: 'rgba(192, 132, 252, 0.1)', color: '#c084fc' }}>
                                            Recordatorio
                                        </button>
                                    </div>

                                    <div className={styles.cardFooter}>
                                        <button onClick={() => showPassword(s.dni)} className={styles.footerBtn}>🔑 Pass</button>
                                        <button
                                            onClick={() => toggleAccesoRestringido(s.dni, s.acceso_restringido)}
                                            className={`${styles.footerBtn} ${s.acceso_restringido ? styles.textRed : styles.textGreen}`}
                                        >
                                            {s.acceso_restringido ? '🚫 Desbloquear' : '🔓 Bloquear'}
                                        </button>
                                        <button
                                            onClick={() => toggleStudentStatus(s.dni, s.activo)}
                                            className={`${styles.footerBtn} ${s.activo ? styles.textRed : styles.textGreen}`}
                                        >
                                            {s.activo ? '🛑 Baja' : '✅ Alta'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        }
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
                                {allResources.length === 0 ? (
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
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === 'gallery' && (
                <div className={styles.studentsSection}>
                    <div className={styles.topActions} style={{ marginBottom: '1rem' }}>
                        <p style={{ color: '#aaa' }}>Marcá con la estrella (⭐) las obras que querés que aparezcan en el Muro de Honor de la Home.</p>
                        <button className="btn btn-outline" onClick={loadGalleryPosts}>🔄 Actualizar</button>
                    </div>
                    <div className={styles.cardsGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                        {galleryPosts.map(post => (
                            <div key={post.id} className={styles.studentCard} style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ height: '200px', backgroundColor: '#333', position: 'relative' }}>
                                    <img
                                        src={post.imagen_url}
                                        alt="Obra"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    {post.featured && (
                                        <div style={{ position: 'absolute', top: 10, right: 10, background: 'gold', borderRadius: '50%', padding: '5px' }}>⭐</div>
                                    )}
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    <h4 style={{ margin: '0 0 5px 0' }}>{post.autor?.nombre} {post.autor?.apellido}</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px' }}>{new Date(post.fecha_publicacion).toLocaleDateString()}</p>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => toggleFeaturePost(post.id, post.featured)}
                                            style={{
                                                flex: 1,
                                                padding: '8px',
                                                border: '1px solid #ffd700',
                                                background: post.featured ? '#ffd700' : 'transparent',
                                                color: post.featured ? '#000' : '#ffd700',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {post.featured ? '⭐ Destacada' : '☆ Destacar'}
                                        </button>
                                        <button
                                            onClick={() => deletePost(post.id)}
                                            style={{ padding: '8px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', borderRadius: '5px', cursor: 'pointer' }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === 'challenges' && (
                <div className={styles.studentsSection}>
                    <div className={styles.topActions}>
                        <div>
                            <h2>🏆 Gestión de Desafíos</h2>
                            <p style={{ color: '#aaa' }}>Crea retos para tus alumnos y gestiona las etapas de subida y votación.</p>
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{ background: '#f59e0b', border: 'none', fontWeight: 'bold' }}
                            onClick={() => setShowChallengeModal(true)}
                        >
                            + Crear Nuevo Desafío
                        </button>
                    </div>

                    <div className={styles.cardsGrid}>
                        {challenges.length === 0 && <p className="text-center" style={{ gridColumn: '1/-1', opacity: 0.5, padding: '2rem' }}>No hay desafíos creados aún.</p>}
                        {challenges.map(c => {
                            const ahora = new Date();
                            const inicio = new Date(c.fecha_inicio);
                            const finSubida = new Date(c.fecha_cierre_subida);
                            const finVotacion = new Date(c.fecha_cierre_votacion);

                            let etapa = "Programado";
                            let etapaColor = "#9ca3af";
                            if (ahora >= inicio && ahora < finSubida) {
                                etapa = "Subida de Obras 🎨";
                                etapaColor = "#60a5fa";
                            } else if (ahora >= finSubida && ahora < finVotacion) {
                                etapa = "Votación Abierta 🗳️";
                                etapaColor = "#f59e0b";
                            } else if (ahora >= finVotacion) {
                                etapa = "Finalizado ✅";
                                etapaColor = "#10b981";
                            }

                            return (
                                <div key={c.id} className={styles.studentCard}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 style={{ color: 'white', margin: 0 }}>{c.titulo}</h3>
                                            <span style={{ fontSize: '0.8rem', color: etapaColor, fontWeight: 'bold' }}>{etapa}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                onClick={() => loadChallengeSubmissions(c.id)}
                                                className="btn btn-outline"
                                                style={{ padding: '4px 12px', fontSize: '0.8rem', border: '1px solid #60a5fa', color: '#60a5fa' }}
                                            >
                                                👁️ Ver Obras
                                            </button>
                                            <button onClick={() => handleDeleteChallenge(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>🗑️</button>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: '#9ca3af', margin: '0.5rem 0' }}>{c.descripcion?.substring(0, 100)}...</p>

                                    <div style={{ background: '#1f2937', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <span>Inicio:</span>
                                            <strong style={{ color: 'white' }}>{inicio.toLocaleDateString()}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <span>Fin Subida:</span>
                                            <strong style={{ color: 'white' }}>{finSubida.toLocaleDateString()}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Fin Votación:</span>
                                            <strong style={{ color: 'white' }}>{finVotacion.toLocaleDateString()}</strong>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                        {c.talleres_participantes?.map(t => (
                                            <span key={t} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px' }}>{t}</span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {view === 'workshops' && <WorkshopsTab />}
            
            {view === 'reports' && <ReportsTab />}

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
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                    <span style={{ fontWeight: 'bold' }}>{t.titulo}</span>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>COMISIÓN: {t.comision || '1.0'}</span>
                                                        <span style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: 'bold' }}>MODALIDAD: {t.tipo_cobro || 'MENSUAL'}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>VISIBLE EN WEB:</span>
                                                        <label className={styles.switch} style={{ transform: 'scale(0.7)', margin: 0, height: '24px' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={t.activo_grupal}
                                                                onChange={() => toggleWorkshop(t.ids, t.activo_grupal)}
                                                            />
                                                            <span className={styles.slider}></span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </td>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <h2 style={{ margin: 0 }}>📊 Historial de Pagos (Vista Horizontal)</h2>
                                <p style={{ color: '#888', margin: '4px 0 0 0' }}>Cada celda representa el mes de pago calendario para el año seleccionado</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e1e1e', padding: '4px 8px', borderRadius: '8px', border: '1px solid #333' }}>
                                <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 'bold' }}>AÑO:</span>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => {
                                        const yr = parseInt(e.target.value);
                                        setSelectedYear(yr);
                                        loadPaymentsHistory(yr);
                                    }}
                                    style={{
                                        background: '#121212',
                                        border: '1px solid #444',
                                        color: 'white',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold',
                                        outline: 'none',
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'inherit'
                                    }}
                                >
                                    {Array.from({ length: 2040 - 2025 + 1 }, (_, i) => 2025 + i).map(year => (
                                        <option key={year} value={year} style={{ background: '#1e1e1e', color: 'white' }}>
                                            {year} {year === new Date().getFullYear() ? '(Actual)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className={styles.tableWrapper} style={{ overflowX: 'auto' }}>
                            <table className={styles.table} style={{ minWidth: '1200px' }}>
                                <thead>
                                    <tr>
                                        <th>Alumno</th>
                                        <th>Taller</th>
                                        {['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'].map((mes, idx) => (
                                            <th key={idx} style={{ textAlign: 'center', minWidth: '85px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 'bold' }}>{mes}</span>
                                                    <span style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '2px' }}>{String(selectedYear).substring(2)}</span>
                                                </div>
                                            </th>
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
                                                    position: 'relative'
                                                }}>
                                                    {pago.pagado ? (
                                                        <>
                                                            ✅<br />
                                                            <small>${Math.round(pago.monto)}</small>
                                                        </>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px' }}>
                                                            <button 
                                                                onClick={() => generateCoupon(alumno, pidx, pago.monto)}
                                                                style={{ background: 'transparent', border: '1px solid #60a5fa', color: '#60a5fa', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7em' }}
                                                            >
                                                                🔗 Enviar Link
                                                            </button>
                                                            <button 
                                                                onClick={() => markManualPayment(alumno.alumno_dni, alumno.taller, pidx + 1, selectedYear, pago.monto)}
                                                                style={{ background: '#059669', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7em' }}
                                                            >
                                                                💵 Efectivo
                                                            </button>
                                                        </div>
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
                            <button
                                onClick={() => setShowBroadcastModal(true)}
                                className="btn btn-outline"
                                style={{ border: '1px solid #c084fc', color: '#c084fc', marginLeft: '10px' }}
                            >
                                📣 Comunicar a Alumnos
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE COMUNICACIÓN */}
            {showBroadcastModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Centro de Comunicación 📣</h2>
                        <p className={styles.modalSubtitle}>Enviá una notificación directa a la campanita de los alumnos.</p>

                        <div className={styles.formGroup}>
                            <label>Tu mensaje:</label>
                            <textarea
                                className={styles.textarea}
                                placeholder="Escribe aquí lo que quieras comunicar..."
                                value={broadcastMessage}
                                onChange={(e) => setBroadcastMessage(e.target.value)}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>¿A quién enviar?</label>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className={styles.checkboxItem} style={{ fontWeight: 'bold', borderBottom: '1px solid #374151', paddingBottom: '0.8rem', marginBottom: '0.8rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={broadcastTargetAll}
                                        onChange={(e) => {
                                            setBroadcastTargetAll(e.target.checked);
                                            if (e.target.checked) setSelectedTallerIds([]);
                                        }}
                                    />
                                    🚀 Enviar a TODOS los alumnos activos
                                </label>
                            </div>

                            {!broadcastTargetAll && (
                                <div className={styles.selectorGrid}>
                                    {talleres.map(t => (
                                        <label key={t.titulo} className={styles.checkboxItem}>
                                            <input
                                                type="checkbox"
                                                checked={selectedTallerIds.some(id => t.ids.includes(id))}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedTallerIds(prev => [...prev, ...t.ids]);
                                                    } else {
                                                        setSelectedTallerIds(prev => prev.filter(id => !t.ids.includes(id)));
                                                    }
                                                }}
                                            />
                                            {t.titulo}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                className="btn btn-outline"
                                onClick={() => setShowBroadcastModal(false)}
                                disabled={isBroadcasting}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleBroadcast}
                                style={{ background: '#c084fc', border: 'none' }}
                                disabled={isBroadcasting}
                            >
                                {isBroadcasting ? 'Enviando...' : 'Enviar Notificación'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAddStudentModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>👤 Registrar Nuevo Alumno</h2>
                        <p className={styles.modalSubtitle}>Completá los datos para cargar al alumno en Supabase y el Excel.</p>

                        <div className={styles.formGroup} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label>DNI:</label>
                                <input
                                    type="text"
                                    className={styles.textarea}
                                    style={{ minHeight: 'auto', padding: '0.8rem' }}
                                    value={newStudent.dni}
                                    onChange={(e) => setNewStudent({ ...newStudent, dni: e.target.value })}
                                />
                            </div>
                            <div>
                                <label>Nombre Completo:</label>
                                <input
                                    type="text"
                                    className={styles.textarea}
                                    style={{ minHeight: 'auto', padding: '0.8rem' }}
                                    value={newStudent.nombre}
                                    onChange={(e) => setNewStudent({ ...newStudent, nombre: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label>Email:</label>
                                <input
                                    type="email"
                                    className={styles.textarea}
                                    style={{ minHeight: 'auto', padding: '0.8rem' }}
                                    value={newStudent.email}
                                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label>Teléfono (WhatsApp):</label>
                                <input
                                    type="text"
                                    className={styles.textarea}
                                    style={{ minHeight: 'auto', padding: '0.8rem' }}
                                    placeholder="Ej: 549342..."
                                    value={newStudent.telefono}
                                    onChange={(e) => setNewStudent({ ...newStudent, telefono: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Inscribir a Talleres:</label>
                            <div className={styles.selectorGrid} style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {talleres.map(t => (
                                    <div key={t.ids[0]} className={styles.checkboxItem}>
                                        <input
                                            type="checkbox"
                                            id={`new-taller-${t.ids[0]}`}
                                            checked={newStudent.talleres.includes(t.ids[0])}
                                            onChange={(e) => {
                                                if (e.target.checked) setNewStudent({ ...newStudent, talleres: [...newStudent.talleres, t.ids[0]] });
                                                else setNewStudent({ ...newStudent, talleres: newStudent.talleres.filter(id => id !== t.ids[0]) });
                                            }}
                                        />
                                        <label htmlFor={`new-taller-${t.ids[0]}`} style={{ margin: 0 }}>{t.titulo}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button className="btn" onClick={() => setShowAddStudentModal(false)}>Cancelar</button>
                            <button
                                className="btn btn-primary"
                                disabled={isAddingStudent}
                                onClick={handleAddStudent}
                                style={{ background: '#10b981', borderColor: '#10b981' }}
                            >
                                {isAddingStudent ? 'Registrando...' : 'Registrar Alumno'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showEditStudentModal && editingStudent && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>✏️ Editar Datos de Alumno</h2>
                        <p className={styles.modalSubtitle}>Modificá los datos de contacto de {editingStudent.nombre}. Los cambios se guardarán en la base de datos.</p>

                        <div className={styles.formGroup} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label>DNI (No editable):</label>
                                <input
                                    type="text"
                                    className={styles.textarea}
                                    style={{ minHeight: 'auto', padding: '0.8rem', opacity: 0.6, background: '#111827' }}
                                    value={editingStudent.dni}
                                    disabled
                                />
                            </div>
                            <div>
                                <label>Nombre Completo:</label>
                                <input
                                    type="text"
                                    className={styles.textarea}
                                    style={{ minHeight: 'auto', padding: '0.8rem' }}
                                    value={editingStudent.nombre}
                                    onChange={(e) => setEditingStudent({ ...editingStudent, nombre: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label>Email:</label>
                                <input
                                    type="email"
                                    className={styles.textarea}
                                    style={{ minHeight: 'auto', padding: '0.8rem' }}
                                    value={editingStudent.email}
                                    onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label>Teléfono (WhatsApp):</label>
                                <input
                                    type="text"
                                    className={styles.textarea}
                                    style={{ minHeight: 'auto', padding: '0.8rem' }}
                                    placeholder="Ej: 549342..."
                                    value={editingStudent.telefono}
                                    onChange={(e) => setEditingStudent({ ...editingStudent, telefono: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button className="btn" onClick={() => setShowEditStudentModal(false)}>Cancelar</button>
                            <button
                                className="btn btn-primary"
                                disabled={isSavingStudent}
                                onClick={handleEditStudent}
                                style={{ background: '#10b981', borderColor: '#10b981' }}
                            >
                                {isSavingStudent ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSubmissionsModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: '900px', width: '900px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ color: 'var(--rooster-yellow)', margin: 0 }}>🖼️ Obras Recibidas</h2>
                            <button className="btn" onClick={() => setShowSubmissionsModal(false)}>Cerrar</button>
                        </div>

                        {isLoadingSubmissions ? (
                            <p className="text-center">Cargando obras...</p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem', maxHeight: '70vh', overflowY: 'auto', padding: '10px' }}>
                                {currentSubmissions.map(s => (
                                    <div key={s.id} style={{ background: '#111827', borderRadius: '12px', overflow: 'hidden', border: '1px solid #374151' }}>
                                        <div style={{ height: '180px' }}>
                                            <img src={s.imagen_url} alt="Obra" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div style={{ padding: '10px' }}>
                                            <strong style={{ display: 'block', color: 'white', fontSize: '0.9rem' }}>{s.alumno_nombre}</strong>
                                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{s.alumno_dni}</span>
                                            <span style={{ display: 'block', color: '#ffd700', fontWeight: 'bold', marginTop: '5px', fontSize: '0.85rem' }}>
                                                ⭐ {s.votos || 0} {s.votos === 1 ? 'voto' : 'votos'}
                                            </span>
                                            <p style={{ fontSize: '0.8rem', color: '#d1d5db', marginTop: '8px', fontStyle: 'italic' }}>"{s.bio}"</p>

                                            <button
                                                className="btn"
                                                onClick={() => handleDeleteSubmission(s.id)}
                                                style={{
                                                    marginTop: '10px',
                                                    width: '100%',
                                                    fontSize: '0.75rem',
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    color: '#ef4444',
                                                    border: '1px solid rgba(239, 68, 68, 0.2)'
                                                }}
                                            >
                                                🗑️ Eliminar Obra
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {currentSubmissions.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', opacity: 0.5 }}>Aún no se han subido obras para este desafío.</p>}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showChallengeModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>🏆 Crear Nuevo Desafío</h2>
                        <p className={styles.modalSubtitle}>Configura el nombre, reglas y fechas del reto artístico.</p>

                        <div className={styles.formGroup}>
                            <label>Nombre del Desafío:</label>
                            <input
                                type="text"
                                className={styles.textarea}
                                style={{ minHeight: 'auto', padding: '0.8rem' }}
                                placeholder="Ej: Paisajes de Verano"
                                value={newChallenge.titulo}
                                onChange={(e) => setNewChallenge({ ...newChallenge, titulo: e.target.value })}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Reglas y Condiciones:</label>
                            <textarea
                                className={styles.textarea}
                                placeholder="Ej: Una sola obra por alumno. Técnica libre..."
                                value={newChallenge.descripcion}
                                onChange={(e) => setNewChallenge({ ...newChallenge, descripcion: e.target.value })}
                            />
                        </div>

                        <div className={styles.formGroup} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            <div>
                                <label>Fecha Inicio:</label>
                                <input
                                    type="date"
                                    className={styles.textarea}
                                    style={{ minHeight: 'auto', padding: '0.8rem' }}
                                    value={newChallenge.fecha_inicio}
                                    onChange={(e) => setNewChallenge({ ...newChallenge, fecha_inicio: e.target.value })}
                                />
                            </div>
                            <div>
                                <label>Cierre Subida (y Voto):</label>
                                <input
                                    type="date"
                                    className={styles.textarea}
                                    style={{ minHeight: 'auto', padding: '0.8rem' }}
                                    value={newChallenge.fecha_cierre_subida}
                                    onChange={(e) => setNewChallenge({ ...newChallenge, fecha_cierre_subida: e.target.value })}
                                />
                            </div>
                            <div>
                                <label>Cierre Final:</label>
                                <input
                                    type="date"
                                    className={styles.textarea}
                                    style={{ minHeight: 'auto', padding: '0.8rem' }}
                                    value={newChallenge.fecha_cierre_votacion}
                                    onChange={(e) => setNewChallenge({ ...newChallenge, fecha_cierre_votacion: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Talleres que pueden participar:</label>
                            <div className={styles.selectorGrid} style={{ maxHeight: '180px' }}>
                                {talleres.map(t => (
                                    <label key={t.titulo} className={styles.checkboxItem}>
                                        <input
                                            type="checkbox"
                                            checked={newChallenge.talleres_participantes.includes(t.titulo)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setNewChallenge(prev => ({ ...prev, talleres_participantes: [...prev.talleres_participantes, t.titulo] }));
                                                } else {
                                                    setNewChallenge(prev => ({ ...prev, talleres_participantes: prev.talleres_participantes.filter(n => n !== t.titulo) }));
                                                }
                                            }}
                                        />
                                        {t.titulo}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button className="btn" onClick={() => setShowChallengeModal(false)}>Cancelar</button>
                            <button
                                className="btn btn-primary"
                                disabled={isSavingChallenge}
                                onClick={handleSaveChallenge}
                                style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
                            >
                                {isSavingChallenge ? 'Creando...' : 'Publicar Desafío'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.adminActions}>
                <h2>Gestión Rápida</h2>
                <div className={styles.buttonGroup}>
                    <button className="btn btn-outline" onClick={() => window.location.href = '/mi-cuenta'}>
                        👤 Mi Perfil / Seguridad
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
