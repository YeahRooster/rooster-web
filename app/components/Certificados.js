'use client';
import { useState, useRef, useEffect } from 'react';
import styles from '../mi-cuenta/page.module.css';

export default function Certificados({ user }) {
    const certificateRef = useRef();
    const formalCertRef = useRef();
    const [generating, setGenerating] = useState(false);
    const [customMode, setCustomMode] = useState(false);
    const [customTopics, setCustomTopics] = useState("");
    const [requests, setRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(true);

    const loadRequests = async () => {
        try {
            const res = await fetch(`/api/v2/certificates/request?dni=${user.dni}`);
            const data = await res.json();
            if (data.status === 'success') {
                setRequests(data.requests);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingRequests(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, [user.dni]);

    const getTeacherName = (tallerNombre) => {
        const upper = tallerNombre.toUpperCase();
        if (upper.includes('GUION') || upper.includes('GUIÓN')) return "Jorge Roldán";
        if (upper.includes('INGLES') || upper.includes('INGLÉS')) return "Evangelina Sanchez";
        if (upper.includes('ITALIANO')) return "Alejandro Bustamante Friggeri";
        return "Emiliano Gallo"; 
    };

    const requestCertificate = async (type, topics = "") => {
        setGenerating(true);
        try {
            const res = await fetch('/api/v2/certificates/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dni: user.dni,
                    nombre: user.nombre,
                    tipo: type,
                    temario: topics
                })
            });
            if (res.ok) {
                alert('Solicitud enviada correctamente. Te notificaremos cuando el administrador la apruebe.');
                setCustomMode(false);
                setCustomTopics("");
                loadRequests();
            } else {
                alert('Error al enviar solicitud.');
            }
        } catch (e) {
            alert('Error al enviar solicitud.');
        } finally {
            setGenerating(false);
        }
    };

    const generatePDF = async (type, titleStr, descStr, topics = "", teacherName = "Emiliano Gallo") => {
        setGenerating(true);
        try {
            const isFormal = type === 'regularity' || type === 'custom';
            const activeRef = isFormal ? formalCertRef : certificateRef;
            
            const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            const date = new Date();
            const dateText = `${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`;

            if (isFormal) {
                const fTitleEl = document.getElementById('formal-title');
                const fP1El = document.getElementById('formal-p1');
                const fTopicsSec = document.getElementById('formal-topics-section');
                const fTopicsList = document.getElementById('formal-topics');
                const fDate = document.getElementById('formal-date');

                if (type === 'regularity') {
                    fTitleEl.innerText = "CONSTANCIA DE ALUMNO REGULAR";
                    fP1El.innerHTML = `Por la presente se deja constancia de que <strong>${user.nombre}</strong> (DNI: ${user.dni}), es alumno/a regular activo/a durante el ciclo lectivo ${date.getFullYear()} en las clases de Rooster Espacio de Arte, participando activamente en las instancias de aprendizaje.`;
                    fTopicsSec.style.display = 'none';
                } else if (type === 'custom') {
                    fTitleEl.innerText = "CONSTANCIA DE ASISTENCIA Y CONTENIDOS APRENDIDOS";
                    fP1El.innerHTML = `Por la presente se deja constancia de que <strong>${user.nombre}</strong> (DNI: ${user.dni}), ha asistido durante el ciclo lectivo ${date.getFullYear()} a clases regulares en Rooster Espacio de Arte, participando activamente en las instancias de aprendizaje teórico-prácticas correspondientes al área de Artes Visuales.`;
                    fTopicsSec.style.display = 'block';
                    
                    const topicsArray = topics.split('\n').filter(t => t.trim().length > 0);
                    if (topicsArray.length > 0) {
                        fTopicsList.innerHTML = `<ul style="margin: 0; padding-left: 20px;">${topicsArray.map(t => `<li style="margin-bottom: 5px;">${t}</li>`).join('')}</ul>`;
                    } else {
                        fTopicsList.innerHTML = `<p>${topics}</p>`;
                    }
                }
                
                fDate.innerText = `${dateText}, Santa Fe, Argentina.`;
                activeRef.current.style.display = 'block';

            } else {
                const titleEl = document.getElementById('cert-title');
                const descEl = document.getElementById('cert-desc');
                const dateEl = document.getElementById('cert-date');
                const topicsEl = document.getElementById('cert-topics');
                const teacherEl = document.getElementById('cert-teacher');

                if (type === 'stage') {
                    titleEl.innerText = "Certificado otorgado a:";
                    descEl.innerText = `Por haber completado satisfactoriamente ${titleStr} de`;
                } else if (type === 'language') {
                    titleEl.innerText = "Certificado otorgado a:";
                    descEl.innerText = `Por haber completado satisfactoriamente el nivel ${titleStr} de`;
                }
                
                const courseEl = document.getElementById('cert-course');
                if (courseEl) courseEl.innerText = descStr;

                topicsEl.innerText = topics ? topics : "";
                teacherEl.innerText = teacherName;
                dateEl.innerText = `Entregado el mes de ${meses[date.getMonth()].toLowerCase()} de ${date.getFullYear()}`;

                activeRef.current.style.display = 'block';
            }

            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            const canvas = await html2canvas(activeRef.current, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');

            const orientation = isFormal ? 'portrait' : 'landscape';
            const pdf = new jsPDF(orientation, 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Certificado_${user.nombre.replace(/\\s+/g, '_')}.pdf`);

            activeRef.current.style.display = 'none';
        } catch (error) {
            console.error("Error generando PDF: ", error);
            alert("Hubo un error al generar el certificado.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className={styles.card}>
            <h2 className={styles.cardTitle}>🎓 Mis Certificados</h2>
            <p style={{ color: '#ccc', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Aquí puedes solicitar constancias y descargar tus certificados oficiales al completar cada etapa de tus talleres.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--rooster-yellow)' }}>Solicitar Constancias (Para presentar)</h3>
                <button 
                    onClick={() => requestCertificate('regularity')} 
                    disabled={generating}
                    className="btn btn-outline"
                    style={{ borderColor: '#3b82f6', color: '#3b82f6', background: 'transparent' }}
                >
                    📝 Solicitar Constancia de Alumno Regular
                </button>

                {!customMode ? (
                    <button 
                        onClick={() => setCustomMode(true)} 
                        disabled={generating}
                        className="btn btn-outline"
                        style={{ borderColor: '#a855f7', color: '#a855f7', background: 'transparent' }}
                    >
                        ⚙️ Constancia Personalizada (Añadir Temario)
                    </button>
                ) : (
                    <div style={{ background: '#1f2937', padding: '1rem', borderRadius: '8px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>Temas abordados (Opcional, un tema por línea):</label>
                        <textarea
                            value={customTopics}
                            onChange={(e) => setCustomTopics(e.target.value)}
                            placeholder="Tema 1\nTema 2\nTema 3..."
                            rows="4"
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #4b5563', background: '#111', color: '#fff', marginBottom: '1rem' }}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={() => requestCertificate('custom', customTopics)} 
                                disabled={generating}
                                className="btn btn-primary"
                                style={{ background: '#a855f7', borderColor: '#a855f7' }}
                            >
                                Enviar Solicitud
                            </button>
                            <button onClick={() => setCustomMode(false)} className="btn btn-outline">Cancelar</button>
                        </div>
                    </div>
                )}

                {requests.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                        <h4 style={{ color: '#9ca3af', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Mis Solicitudes</h4>
                        {requests.map(req => (
                            <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '0.8rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
                                <div>
                                    <p style={{ margin: 0, color: '#fff', fontSize: '0.9rem' }}>
                                        {req.tipo === 'regularity' ? 'Constancia Regular' : 'Constancia Personalizada'}
                                    </p>
                                    <small style={{ color: '#6b7280' }}>Estado: {req.estado}</small>
                                </div>
                                {req.estado === 'APROBADO' ? (
                                    <button
                                        onClick={() => generatePDF(req.tipo, null, null, req.temario, "Emiliano Gallo")}
                                        className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                    >⬇️ Descargar</button>
                                ) : (
                                    <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>⏳ Pendiente</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ borderTop: '1px solid #333', margin: '1rem 0' }}></div>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--rooster-yellow)' }}>Certificados de Etapa / Nivel</h3>
                
                {user.inscripciones && user.inscripciones.map((inscripcion, idx) => {
                    const tallerNombre = inscripcion.taller_nombre;
                    const certData = inscripcion.certificados_data || {};
                    const isDibujo = tallerNombre.toUpperCase().includes('DIBUJO') || tallerNombre.toUpperCase().includes('MANGA');
                    const isIdioma = tallerNombre.toUpperCase().includes('INGLÉS') || tallerNombre.toUpperCase().includes('INGLES') || tallerNombre.toUpperCase().includes('ITALIANO');
                    const teacherName = getTeacherName(tallerNombre);

                    const renderItems = [];

                    if (isDibujo) {
                        const stages = [
                            { key: 'etapa_1_aprobada', title: 'el Ciclo Inicial', label: 'Etapa 1 (Ciclo Inicial)' },
                            { key: 'etapa_2_aprobada', title: 'el Ciclo Medio', label: 'Etapa 2 (Ciclo Medio)' },
                            { key: 'etapa_3_aprobada', title: 'el Ciclo Completo', label: 'Certificado de Finalización' }
                        ];

                        stages.forEach(st => {
                            const hasCompleted = certData[st.key];
                            renderItems.push(
                                <div key={st.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '1rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '1.5rem', opacity: hasCompleted ? 1 : 0.3 }}>{hasCompleted ? '🏆' : '🔒'}</span>
                                        <div>
                                            <h4 style={{ margin: 0, color: hasCompleted ? '#fff' : '#6b7280' }}>{st.label}</h4>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>{tallerNombre}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => generatePDF('stage', st.title, tallerNombre, "", teacherName)}
                                        disabled={generating || !hasCompleted}
                                        className="btn"
                                        style={{ background: hasCompleted ? '#10b981' : '#374151', color: hasCompleted ? '#fff' : '#9ca3af', border: 'none', cursor: hasCompleted ? 'pointer' : 'not-allowed' }}
                                    >
                                        {hasCompleted ? '⬇️ Descargar' : 'Pendiente'}
                                    </button>
                                </div>
                            );
                        });
                    }

                    if (isIdioma && certData.nivel_idioma) {
                        renderItems.push(
                            <div key="idioma" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '1rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '1.5rem' }}>🏆</span>
                                    <div>
                                        <h4 style={{ margin: 0, color: '#fff' }}>Nivel {certData.nivel_idioma}</h4>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>{tallerNombre}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => generatePDF('language', certData.nivel_idioma, tallerNombre, "", teacherName)}
                                    disabled={generating}
                                    className="btn"
                                    style={{ background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer' }}
                                >
                                    ⬇️ Descargar
                                </button>
                            </div>
                        );
                    }

                    return (
                        <div key={idx}>
                            {renderItems.length > 0 ? renderItems : (
                                <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>{tallerNombre}: Aún no hay certificados disponibles.</p>
                            )}
                        </div>
                    );
                })}
            </div>

            
            {/* ELEMENTO OCULTO PARA EL PDF - ETAPAS / NIVELES (LANDSCAPE) */}
            <div 
                ref={certificateRef}
                style={{
                    display: 'none',
                    width: '1123px',
                    height: '794px',
                    backgroundColor: '#fff',
                    position: 'absolute',
                    top: '-9999px',
                    left: '-9999px',
                    padding: '20px',
                    boxSizing: 'border-box',
                }}
            >
                <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#f6f7eb',
                    border: '35px solid #1a2b4c',
                    boxSizing: 'border-box',
                    padding: '40px 60px',
                    textAlign: 'center',
                    fontFamily: 'sans-serif',
                    color: '#1a2b4c',
                    boxShadow: 'inset 0 0 0 5px #f6f7eb, inset 0 0 0 6px #1a2b4c'
                }}>
                    <div style={{ marginBottom: '20px' }}>
                        <img id="cert-logo" src="/images/rooster_espacio_arte.png" alt="Logo" style={{ maxWidth: '300px', margin: '0 auto', display: 'block' }} />
                    </div>
                    
                    <h1 id="cert-title" style={{ fontSize: '20px', margin: '15px 0', fontWeight: 'normal', color: '#1a2b4c' }}>
                        Certificado otorgado a:
                    </h1>
                    
                    <h2 id="cert-name" style={{ fontSize: '42px', margin: '10px 0', color: '#1a2b4c', fontWeight: 'bold' }}>
                        {user.nombre}
                    </h2>
                    
                    <p style={{ fontSize: '20px', margin: '5px 0', fontWeight: 'bold' }}>DNI {user.dni}</p>
                    
                    <p id="cert-desc" style={{ fontSize: '22px', marginTop: '30px', marginBottom: '10px' }}>
                        Por haber completado satisfactoriamente el ciclo inicial de
                    </p>
                    
                    <h2 id="cert-course" style={{ fontSize: '32px', margin: '10px 0', color: '#1a2b4c', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        TALLER DE DIBUJO
                    </h2>

                    <p id="cert-topics" style={{ fontSize: '18px', fontStyle: 'italic', display: 'none' }}></p>
                    
                    <div id="cert-teacher-container" style={{ marginTop: '20px' }}>
                        <p style={{ fontSize: '20px', margin: '5px 0' }}>dictado por</p>
                        <p id="cert-teacher" style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0' }}>Emiliano Gallo</p>
                    </div>
                    
                    <div style={{ marginTop: '50px', fontSize: '16px' }}>
                        <p id="cert-date">Entregado el mes de diciembre de 2026</p>
                    </div>
                </div>
            </div>

            {/* ELEMENTO OCULTO PARA EL PDF - CONSTANCIA (PORTRAIT) */}
            <div 
                ref={formalCertRef}
                style={{
                    display: 'none',
                    width: '794px',
                    height: '1123px',
                    backgroundColor: '#ffffff',
                    position: 'absolute',
                    top: '-9999px',
                    left: '-9999px',
                    fontFamily: '"Times New Roman", Times, serif',
                    padding: '80px',
                    boxSizing: 'border-box',
                    color: '#000',
                    textAlign: 'left'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <img src="/images/rooster_espacio_arte_black.png" alt="Logo" style={{ maxWidth: '200px' }} />
                    <div style={{ textAlign: 'right', fontSize: '14px', lineHeight: '1.4' }}>
                        <strong>Santa Fe – Capital</strong><br />
                        <strong>(0342) 155-263036</strong><br />
                        <strong>Redes: @roosterespacio</strong>
                    </div>
                </div>
                <hr style={{ borderTop: '2px solid #000', marginBottom: '40px' }} />

                <h1 id="formal-title" style={{ fontSize: '18px', textAlign: 'center', fontWeight: 'bold', marginBottom: '40px', textTransform: 'uppercase' }}>
                    CONSTANCIA DE ASISTENCIA Y CONTENIDOS APRENDIDOS
                </h1>

                <p id="formal-p1" style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '20px', textAlign: 'justify' }}>
                    Por la presente se deja constancia de que <strong>{user.nombre}</strong> (DNI: {user.dni}), ha asistido durante el ciclo lectivo {new Date().getFullYear()} a clases regulares en Rooster Espacio de Arte, participando activamente en las instancias de aprendizaje.
                </p>

                <div id="formal-topics-section" style={{ display: 'none' }}>
                    <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '10px' }}>
                        En lo transcurrido del año, el/la alumno/a trabajó en los siguientes contenidos y técnicas:
                    </p>
                    <div id="formal-topics" style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '20px', marginLeft: '20px' }}>
                        {/* Topics Injected Here */}
                    </div>
                    <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '40px', textAlign: 'justify' }}>
                        Se destaca su compromiso y evolución artística a lo largo del año, demostrando adquisición de habilidades técnicas y expresivas acordes al nivel trabajado.
                    </p>
                </div>

                <hr style={{ borderTop: '1px solid #ccc', marginBottom: '20px', marginTop: '60px' }} />

                <p id="formal-date" style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '30px' }}>
                    {/* Date injected here */}
                </p>

                <p style={{ fontSize: '16px' }}>
                    Rooster Espacio de Arte
                </p>
            </div>
        </div>
    );
}
