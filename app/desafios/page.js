'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function DesafiosPage() {
    const { user, loading } = useAuth();
    const [challenges, setChallenges] = useState([]);
    const [loadingChallenges, setLoadingChallenges] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [selectedChallenge, setSelectedChallenge] = useState(null);
    const [submissionData, setSubmissionData] = useState({ imageBase64: '', caption: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [voterStats, setVoterStats] = useState({});
    const [selectedImage, setSelectedImage] = useState(null);
    const [showWorksModal, setShowWorksModal] = useState(false);
    const [worksChallenge, setWorksChallenge] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('adultos');

    useEffect(() => {
        if (user && user.role === 'student') {
            loadChallenges();
        }
    }, [user]);

    const loadChallenges = async () => {
        if (!user?.dni) return;
        setLoadingChallenges(true);
        try {
            const res = await fetch(`/api/v2/challenges?dni=${user.dni}`, { cache: 'no-store' });
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
        } catch (e) {
            console.error("Error loading challenges:", e);
        } finally {
            setLoadingChallenges(false);
        }
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
                alert("✅ ¡Obra subida con éxito! Mucha suerte.");
                setShowSubmitModal(false);
                setSubmissionData({ imageBase64: '', caption: '' });
                loadChallenges();
            } else {
                alert("❌ Error: " + data.message);
            }
        } catch (e) {
            alert("Error de conexión");
        } finally {
            setIsSubmitting(false);
        }
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
                loadChallenges();
            } else {
                alert(data.message);
            }
        } catch (e) {
            alert("Error al votar");
        }
    };

    if (loading) return <div className="section-padding container text-center">Cargando perfil...</div>;

    if (!user) {
        if (typeof window !== 'undefined') window.location.href = '/login';
        return null;
    }

    return (
        <div className="section-padding container">
            <h1 className="section-title text-yellow" style={{ marginBottom: '0.5rem' }}>Desafíos Artísticos</h1>
            <p style={{ color: '#9ca3af', marginBottom: '3rem' }}>Participá, creá y apoyá a tus compañeros en los retos mensuales de Rooster.</p>

            {challenges.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🏆</div>
                    <h2 className={styles.emptyTitle}>¡Próximamente!</h2>
                    <p className={styles.emptyText}>
                        Aun no hay desafios disponibles, cuando haya alguno se te avisara en las notificaciones.
                    </p>
                </div>
            ) : (
                <div className={styles.challengesGrid}>
                    {challenges.map(c => {
                        const ahora = new Date();
                        const inicio = new Date(c.fecha_inicio);
                        const finSubida = new Date(c.fecha_cierre_subida);
                        const finVotacion = new Date(c.fecha_cierre_votacion);

                        let etapa = "PROXIMAMENTE";
                        let etapaDesc = "El reto aún no ha comenzado.";
                        let badgeColor = "#374151";

                        if (ahora >= inicio && ahora < finSubida) {
                            etapa = "SUBIDA";
                            etapaDesc = "¡Es hora de crear! Subí tu obra antes del " + finSubida.toLocaleDateString();
                            badgeColor = "#10b981";
                        } else if (ahora >= finSubida && ahora < finVotacion) {
                            etapa = "VOTACION";
                            etapaDesc = "Mirá las obras de tus compañeros y votá por tus 3 favoritas.";
                            badgeColor = "#f59e0b";
                        } else if (ahora >= finVotacion) {
                            etapa = "FINALIZADO";
                            etapaDesc = "El desafío ha terminado. ¡Pronto anunciaremos ganadores!";
                            badgeColor = "#ef4444";
                        }

                        const isTieBreak = c.round > 1;
                        const isFinished = etapa === 'FINALIZADO';

                        if (isTieBreak && etapa === 'VOTACION') {
                            etapa = "🔥 DESEMPATE";
                            etapaDesc = "¡Hay un empate técnico! Votá por tu favorito entre los finalistas (1 solo voto).";
                            badgeColor = "#dc2626";
                        }

                        const hasSubmitted = c.mySubmission;
                        const stats = voterStats[c.id] || { used: 0, locked: false, myVotes: [] };

                        return (
                            <div key={c.id} className={styles.challengeCard}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, color: 'white', fontSize: '1.4rem' }}>{c.titulo}</h3>
                                    <span className={styles.stageBadge} style={{ background: badgeColor }}>{etapa}</span>
                                </div>

                                <p style={{ fontSize: '0.95rem', color: '#d1d5db', lineHeight: '1.5', flex: 1 }}>{c.descripcion || etapaDesc}</p>

                                {(etapa !== 'PROXIMAMENTE' && !isFinished) && (
                                    <div style={{ padding: '10px 0', borderTop: '1px solid #1f2937', marginTop: '1rem', color: '#9ca3af', fontSize: '0.85rem' }}>
                                        {etapaDesc}
                                    </div>
                                )}

                                <div style={{ marginTop: '1.5rem' }}>
                                    {etapa === 'SUBIDA' && (
                                        hasSubmitted ? (
                                            <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '10px' }}>
                                                    <img src={hasSubmitted.imagen_url} alt="Mi Obra" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px' }} />
                                                    <div>
                                                        <p style={{ margin: 0, color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem' }}>✅ ¡Obra subida!</p>
                                                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.8rem' }}>Ya estás participando en el reto.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                className="btn btn-primary"
                                                style={{ width: '100%', padding: '12px', borderRadius: '12px' }}
                                                onClick={() => { setSelectedChallenge(c); setShowSubmitModal(true); }}
                                            >
                                                🎨 Participar y Subir Obra
                                            </button>
                                        )
                                    )}

                                    {/* SECCIÓN DE OBRAS (VOTACIÓN O DESEMPATE ACTIVO) */}
                                    {(etapa === 'VOTACION' || etapa === '🔥 DESEMPATE') && (
                                        <div style={{ background: '#1f2937', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', marginTop: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'white', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                                                <span><span style={{ color: '#f59e0b', fontWeight: 'bold' }}>⚡ ¡Votá en ambas categorías!</span></span>
                                            </div>
                                            <button
                                                className="btn btn-outline"
                                                style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 'bold', border: '1px solid #f59e0b', color: '#f59e0b' }}
                                                onClick={() => { setWorksChallenge(c); setShowWorksModal(true); }}
                                            >
                                                👁️ Abrir Galería y Votar
                                            </button>
                                        </div>
                                    )}

                                    {/* VISTA FINALIZADA (Solo Resumen y Botón) */}
                                    {isFinished && (
                                        <div style={{ background: '#1f2937', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                                            <div style={{ marginBottom: '1rem', padding: '10px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '10px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                                                <p style={{ margin: 0, color: '#eab308', fontWeight: 'bold' }}>⭐ Desafío Concluido</p>
                                                {c.ganador_nombre && <p style={{ color: 'white', marginTop: '5px', fontSize: '1.2rem' }}>🏆 Adultos: <strong>{c.ganador_nombre}</strong></p>}
                                                {c.ganador_menores_nombre && <p style={{ color: 'white', marginTop: '5px', fontSize: '1.2rem' }}>🏆 Niños: <strong>{c.ganador_menores_nombre}</strong></p>}
                                            </div>
                                            <button
                                                className="btn btn-outline"
                                                style={{ width: '100%', padding: '10px' }}
                                                onClick={() => { setWorksChallenge(c); setShowWorksModal(true); }}
                                            >
                                                🖼️ Ver Obras y Resultados
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL DE OBRAS (VOTACIÓN ACTIVA O RESULTADOS) */}
            {showWorksModal && worksChallenge && (() => {
                const ahora = new Date();
                const isFinishedModal = ahora >= new Date(worksChallenge.fecha_cierre_votacion);
                const isVoting = ahora >= new Date(worksChallenge.fecha_cierre_subida) && ahora < new Date(worksChallenge.fecha_cierre_votacion);
                const isTieBreakModal = worksChallenge.round > 1;
                const stats = voterStats[worksChallenge.id] || { used: 0, locked: false, myVotes: [] };

                return (
                    <div className={styles.modalOverlay} onClick={() => setShowWorksModal(false)}>
                        <div className={styles.modalContent} style={{ maxWidth: '1000px', width: '95vw' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #1f2937', paddingBottom: '1rem' }}>
                                <div>
                                    <h2 style={{ color: 'var(--rooster-yellow)', margin: 0 }}>{worksChallenge.titulo}</h2>
                                    <p style={{ color: '#9ca3af', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
                                        {isFinishedModal ? 'Museo de Desafíos - Resultados Finales' : 'Área de Selección y Votación'}
                                    </p>
                                </div>
                                <button onClick={() => setShowWorksModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', justifyContent: 'center' }}>
                                <button 
                                    className={`btn ${selectedCategory === 'adultos' ? 'btn-primary' : 'btn-outline'}`} 
                                    style={{ flex: 1, padding: '10px' }}
                                    onClick={() => setSelectedCategory('adultos')}
                                >
                                    Categoría Adultos
                                </button>
                                <button 
                                    className={`btn ${selectedCategory === 'menores' ? 'btn-primary' : 'btn-outline'}`} 
                                    style={{ flex: 1, padding: '10px' }}
                                    onClick={() => setSelectedCategory('menores')}
                                >
                                    Categoría Menores
                                </button>
                            </div>

                            {isFinishedModal && (
                                <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '12px', border: '1px solid rgba(234, 179, 8, 0.3)', marginBottom: '2rem' }}>
                                    <p style={{ margin: 0, color: '#eab308', fontWeight: 'bold', fontSize: '0.9rem' }}>GANADORES OFICIALES</p>
                                    {worksChallenge.ganador_nombre && <p style={{ color: 'white', marginTop: '5px', fontSize: '1.2rem' }}>🏆 Categoría Adultos: <strong>{worksChallenge.ganador_nombre}</strong></p>}
                                    {worksChallenge.ganador_menores_nombre && <p style={{ color: 'white', marginTop: '5px', fontSize: '1.2rem' }}>🏆 Categoría Menores: <strong>{worksChallenge.ganador_menores_nombre}</strong></p>}
                                </div>
                            )}

                            {isVoting && (() => {
                                const categoryVotesUsed = worksChallenge.submissions?.filter(s => (s.categoria || 'adultos') === selectedCategory && stats.myVotes.includes(s.id)).length || 0;
                                return (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1rem', color: 'white', background: '#1f2937', padding: '15px', borderRadius: '12px' }}>
                                        <span>Votos en esta categoría: <strong>{categoryVotesUsed}/{isTieBreakModal ? 1 : 3}</strong></span>
                                        <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>⚡ Hacé click en la estrella debajo de tu obra favorita para votarla</span>
                                    </div>
                                );
                            })()}

                            <div className={styles.submissionsGrid} style={{ maxHeight: '60vh', overflowY: 'auto', padding: '10px' }}>
                                {worksChallenge.submissions?.filter(s => (s.categoria || 'adultos') === selectedCategory).filter(s => isVoting ? s.alumno_dni !== user.dni : true).map(s => {
                                    const voted = isVoting ? stats.myVotes.includes(s.id) : false;
                                    return (
                                        <div key={s.id} className={styles.submissionItem} onClick={() => setSelectedImage(s.imagen_url)} style={{ cursor: 'zoom-in' }}>
                                            <div style={{ position: 'relative' }}>
                                                <img src={s.imagen_url} alt="Obra" className={styles.submissionImg} />
                                                
                                                {isFinishedModal ? (
                                                    <div className={styles.voteCountBadge}>
                                                        ⭐ {s.total_votos || 0}
                                                    </div>
                                                ) : isVoting ? (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleVote(worksChallenge.id, s.id); }}
                                                        className={`${styles.voteOverlay} ${voted ? styles.voted : ''}`}
                                                        title={voted ? "Quitar voto" : "Votar"}
                                                    >
                                                        {voted ? '★' : '☆'}
                                                    </button>
                                                ) : null}

                                            </div>
                                            <div className={styles.submissionInfo}>
                                                <span className={styles.authorName}>{s.alumno_nombre} {s.alumno_dni === user.dni && "(Mi obra)"}</span>
                                                <p className={styles.submissionBio}>{s.bio || "Sin descripción"}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!worksChallenge.submissions || worksChallenge.submissions.filter(s => (s.categoria || 'adultos') === selectedCategory).filter(s => isVoting ? s.alumno_dni !== user.dni : true).length === 0) && (
                                    <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#6b7280', fontSize: '0.8rem', padding: '1rem' }}>No hay obras en esta categoría para mostrar.</p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {showSubmitModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2 style={{ color: 'var(--rooster-yellow)', marginBottom: '0.5rem' }}>Participar en el Reto</h2>
                        <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.1rem' }}>{selectedChallenge?.titulo}</h3>
                        <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '2rem' }}>Subí una foto de tu obra y contanos un poquito sobre ella.</p>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Tu Obra:</label>
                            {submissionData.imageBase64 ? (
                                <div style={{ position: 'relative' }}>
                                    <img src={`data:image/jpeg;base64,${submissionData.imageBase64}`} style={{ width: '100%', borderRadius: '12px', border: '1px solid #374151' }} />
                                    <button
                                        onClick={() => setSubmissionData({ ...submissionData, imageBase64: '' })}
                                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >✕</button>
                                </div>
                            ) : (
                                <div style={{ border: '2px dashed #374151', padding: '2.5rem', textAlign: 'center', borderRadius: '16px', background: 'rgba(0,0,0,0.2)' }}>
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
                                    <label htmlFor="sub-file" style={{ cursor: 'pointer', color: 'var(--rooster-yellow)', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '2rem' }}>📷</span>
                                        Seleccionar Foto
                                    </label>
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Contanos sobre tu obra (Bio/Descripción):</label>
                            <textarea
                                style={{ width: '100%', background: '#0d1b2a', border: '1px solid #374151', borderRadius: '10px', color: 'white', padding: '12px', resize: 'vertical', fontSize: '0.95rem' }}
                                rows="3"
                                placeholder="¿En qué te inspiraste?"
                                value={submissionData.caption}
                                onChange={(e) => setSubmissionData({ ...submissionData, caption: e.target.value })}
                            ></textarea>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-outline" style={{ flex: 1, padding: '12px' }} onClick={() => setShowSubmitModal(false)}>Cancelar</button>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '12px' }}
                                disabled={isSubmitting}
                                onClick={handleSubmitChallenge}
                            >
                                {isSubmitting ? 'Subiendo...' : '🚀 Subir Obra'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LIGHTBOX MODAL (Igual que en Galeria) */}
            {selectedImage && (
                <div className={styles.lightboxOverlay} onClick={() => setSelectedImage(null)}>
                    <button className={styles.closeLightbox} onClick={() => setSelectedImage(null)}>&times;</button>
                    <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                        <img src={selectedImage} className={styles.lightboxImage} alt="Zoom" />
                    </div>
                </div>
            )}
        </div>
    );
}
