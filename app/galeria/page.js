'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

function GaleriaPageContent() {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploading, setUploading] = useState(false);

    // MODERACIÓN
    const [viewMode, setViewMode] = useState('active'); // 'active' | 'trash'

    // LIGHTBOX
    const [selectedImage, setSelectedImage] = useState(null);

    // Estado para nueva publicación
    const [newPost, setNewPost] = useState({
        titulo: '',
        descripcion: '',
        image: null
    });

    // COMENTARIOS
    const [selectedPostForComments, setSelectedPostForComments] = useState(null);
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newCommentText, setNewCommentText] = useState('');

    // URL params para abrir post desde notificación
    const searchParams = useSearchParams();

    useEffect(() => {
        loadPosts();
    }, [viewMode]); // Recargar cuando cambia el modo de vista

    // Si viene ?post=ID desde una notificación, abrir ese post automáticamente
    useEffect(() => {
        const postIdFromUrl = searchParams.get('post');
        if (postIdFromUrl && posts.length > 0) {
            const targetPost = posts.find(p => String(p.id) === String(postIdFromUrl));
            if (targetPost) {
                openComments(targetPost);
            }
        }
    }, [posts, searchParams]);

    const loadPosts = async () => {
        setLoading(true);
        try {
            // Consultamos API filtrando por estado
            const res = await fetch(`/api/social/posts?status=${viewMode}`);
            const result = await res.json();
            if (result.status === 'success') {
                setPosts(result.data);
            }
        } catch (error) {
            console.error("Error al cargar galería:", error);
        } finally {
            setLoading(false);
        }
    };

    const openComments = async (post) => {
        if (!user) {
            alert("¡Ingresá con tu cuenta para ver y escribir comentarios!");
            return;
        }
        setSelectedPostForComments(post);
        setComments([]);
        setLoadingComments(true);
        try {
            const res = await fetch(`/api/social/comments?post_id=${post.id}`);
            const result = await res.json();
            if (result.status === 'success') {
                setComments(result.data);
            }
        } catch (error) {
            console.error("Error al cargar comentarios", error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handlePostComment = async () => {
        if (!newCommentText.trim() || !selectedPostForComments) return;
        try {
            const res = await fetch('/api/social/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    post_id: selectedPostForComments.id,
                    autor_dni: user.dni,
                    autor_nombre: user.nombre,
                    texto: newCommentText
                })
            });
            const result = await res.json();
            if (result.status === 'success') {
                setComments(prev => [...prev, result.data]);
                setNewCommentText('');
                // Actualizar el contador en la lista de posts local
                setPosts(prevPosts => prevPosts.map(p => 
                    p.id === selectedPostForComments.id 
                    ? { ...p, commentsCount: (p.commentsCount || 0) + 1 }
                    : p
                ));
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Error al publicar comentario:", error);
        }
    };

    const handleCommentLike = async (commentId) => {
        if (!user) return;
        try {
            const res = await fetch('/api/social/comments/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    comment_id: commentId,
                    usuario_dni: user.dni,
                    usuario_nombre: user.nombre,
                    autor_dni: comments.find(c => c.id === commentId)?.autor_dni,
                    post_id: selectedPostForComments.id
                })
            });
            const result = await res.json();
            if (result.status === 'success') {
                setComments(prev => prev.map(c => {
                    if (c.id === commentId) {
                        const isLiked = c.likedBy?.includes(user.dni);
                        return {
                            ...c,
                            likedBy: isLiked ? (c.likedBy || []).filter(dni => dni !== user.dni) : [...(c.likedBy || []), user.dni],
                            likesCount: isLiked ? Math.max(0, (c.likesCount || 0) - 1) : (c.likesCount || 0) + 1
                        };
                    }
                    return c;
                }));
            }
        } catch (error) {
            console.error("Error al dar like al comentario:", error);
        }
    };

    const handleLike = async (postId, autorDni) => {
        if (!user) {
            alert("¡Ingresá con tu cuenta para poder dar me gusta! 🎨❤️");
            return;
        }
        if (viewMode === 'trash') return; // No dar likes en la basura

        try {
            const res = await fetch('/api/social/like', {
                method: 'POST',
                body: JSON.stringify({
                    post_id: postId,
                    usuario_dni: user.dni,
                    usuario_nombre: user.nombre,
                    autor_dni: autorDni
                })
            });
            const result = await res.json();
            if (result.status === 'success') {
                loadPosts();
            }
        } catch (error) {
            console.error("Error en Like:", error);
        }
    };

    // --- ACCIONES DE MODERACIÓN ---
    const changePostStatus = async (id, newStatus) => {
        if (!confirm(newStatus === 'trash' ? "¿Mover a papelera?" : "¿Restaurar obra?")) return;
        try {
            const res = await fetch('/api/social/posts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    status: newStatus,
                    admin_dni: user.dni // Seguridad básica
                })
            });
            if (res.ok) loadPosts();
        } catch (error) {
            alert("Error al cambiar estado");
        }
    };

    const deletePermanently = async (id) => {
        if (!confirm("⚠️ ¿ESTÁS SEGURO? Esto eliminará la obra PARA SIEMPRE e irreversiblemente.")) return;
        try {
            const res = await fetch(`/api/social/posts?id=${id}&admin_dni=${user.dni}`, {
                method: 'DELETE'
            });
            if (res.ok) loadPosts();
        } catch (error) {
            alert("Error al eliminar");
        }
    };

    const toggleFeature = async (postId, currentStatus) => {
        try {
            const res = await fetch('/api/v2/gallery/feature', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: postId, featured: !currentStatus })
            });
            const data = await res.json();
            if (data.status === 'success') {
                // Actualizar estado local
                setPosts(prev => prev.map(p => p.id === postId ? { ...p, featured: !currentStatus } : p));
            } else {
                alert('Error al destacar: ' + data.message);
            }
        } catch (e) { alert('Error de conexión'); }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validación de tamaño: 15MB (para fotos de alta calidad de celus)
            if (file.size > 15 * 1024 * 1024) {
                alert("La imagen es demasiado pesada (máximo 15MB). Por favor, intentá con una versión un poco más liviana.");
                e.target.value = ""; // Limpiar input
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                // Guardamos el Data URI completo (incluyendo el prefijo data:image/...)
                setNewPost({ ...newPost, image: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!newPost.image) return alert("Por favor seleccioná una imagen");

        setUploading(true);
        try {
            const res = await fetch('/api/social/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newPost,
                    dni: user.dni,
                    nombre: user.nombre
                })
            });

            const result = await res.json();

            if (result.status === 'success') {
                alert("¡Obra subida con éxito! Ya podés verla en la galería. 🎨✨");
                setShowUploadModal(false);
                setNewPost({ titulo: '', descripcion: '', image: null });
                loadPosts();
            } else {
                throw new Error(result.message || "Error del servidor");
            }
        } catch (error) {
            console.error("Error al subir:", error);
            alert("Hubo un problema al subir tu obra. Si la foto es muy grande, intenta achicarla o bajarle la resolución antes de subirla.");
        } finally {
            setUploading(false);
        }
    };

    if (loading && posts.length === 0) return <div className="section-padding container text-center">Cargando Galería de Rooster... 🎨</div>;

    const isAdmin = user?.role === 'admin';

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="section-padding container">
            <h1 className="section-title text-center text-yellow" style={{ marginBottom: '1rem', fontSize: '3rem' }}>
                {viewMode === 'active' ? 'Galería de la Comunidad' : '🗑️ Papelera de Reciclaje'}
            </h1>

            {isAdmin && (
                <div className="text-center" style={{ marginBottom: '2rem' }}>
                    <button
                        onClick={() => setViewMode(viewMode === 'active' ? 'trash' : 'active')}
                        style={{
                            background: viewMode === 'active' ? '#ef4444' : '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {viewMode === 'active' ? '👮‍♂️ Ver Papelera y Moderar' : '🔙 Volver a Galería Pública'}
                    </button>
                </div>
            )}

            {viewMode === 'active' && (
                <p className="text-center" style={{ marginBottom: '3rem', maxWidth: '700px', margin: '0 auto 2rem' }}>
                    Un espacio para compartir nuestras obras y celebrar el talento de Rooster.
                </p>
            )}

            {viewMode === 'active' && user && (user.role === 'student' || user.role === 'teacher' || user.role === 'admin') && (
                <button className={styles.uploadButton} onClick={() => setShowUploadModal(true)}>
                    <span>📸</span> Subir mi Obra
                </button>
            )}

            <div className={styles.galleryGrid}>
                {posts.length === 0 && (
                    <div style={{ textAlign: 'center', width: '100%', gridColumn: '1 / -1', padding: '50px' }}>
                        <h3>{viewMode === 'active' ? 'Aún no hay obras. ¡Sé el primero!' : 'La papelera está vacía 🧹'}</h3>
                    </div>
                )}

                {posts.map((post) => (
                    <div key={post.id} className={styles.postCard} style={{ opacity: viewMode === 'trash' ? 0.8 : 1, border: viewMode === 'trash' ? '2px solid red' : 'none' }}>
                        <div
                            className={styles.imageContainer}
                            onClick={() => setSelectedImage(post.imagen_url)}
                            title="Click para ampliar"
                        >
                            <Image
                                src={post.imagen_url}
                                alt={post.titulo}
                                fill
                                style={{ objectFit: 'cover' }}
                            />
                            {/* Estrella si está destacada (Solo visible para Admin) */}
                            {post.featured && isAdmin && (
                                <div style={{ position: 'absolute', top: 10, right: 10, background: 'gold', borderRadius: '50%', padding: '5px', zIndex: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }}>⭐</div>
                            )}
                        </div>
                        <div className={styles.postInfo}>
                            <h3 className={styles.postTitle}>{post.titulo}</h3>
                            <p className={styles.postAuthor}>Por {post.alumno_nombre}</p>
                            <span className={styles.postDate}>{formatDate(post.fecha_creacion)}</span>

                            <div className={styles.interactionBar}>
                                {viewMode === 'active' ? (
                                    <>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <button
                                                className={`${styles.likeButton} ${post.social_likes?.some(l => l.usuario_dni === user?.dni) ? styles.liked : ''}`}
                                                onClick={(e) => { e.stopPropagation(); handleLike(post.id, post.alumno_dni); }}
                                            >
                                                ❤️ {post.likesCount}
                                            </button>
                                            
                                            <button
                                                className={styles.likeButton}
                                                onClick={(e) => { e.stopPropagation(); openComments(post); }}
                                            >
                                                💬 {post.commentsCount || 0}
                                            </button>
                                        </div>

                                        {isAdmin && (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleFeature(post.id, post.featured); }}
                                                    style={{
                                                        marginLeft: 'auto',
                                                        background: post.featured ? '#ffd700' : 'transparent',
                                                        border: '1px solid #ffd700',
                                                        color: post.featured ? '#000' : '#ffd700',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem',
                                                        padding: '2px 8px',
                                                        marginRight: '5px'
                                                    }}
                                                    title={post.featured ? "Quitar de destacados" : "Destacar en Home"}
                                                >
                                                    {post.featured ? '⭐' : '☆'}
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); changePostStatus(post.id, 'trash'); }}
                                                    style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 8px' }}
                                                    title="Mover a Papelera"
                                                >
                                                    🗑️
                                                </button>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    /* CONTROLES DE PAPELERA */
                                    <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'center' }}>
                                        <button
                                            onClick={() => changePostStatus(post.id, 'active')}
                                            style={{ background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            ♻️ Restaurar
                                        </button>
                                        <button
                                            onClick={() => deletePermanently(post.id)}
                                            style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            ❌ Eliminar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* LIGHTBOX MODAL */}
            {selectedImage && (
                <div className={styles.lightboxOverlay} onClick={() => setSelectedImage(null)}>
                    <button className={styles.closeLightbox} onClick={() => setSelectedImage(null)}>&times;</button>
                    <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                        <img src={selectedImage} className={styles.lightboxImage} alt="Zoom" />
                    </div>
                </div>
            )}

            {/* Modal de Subida */}
            {showUploadModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.uploadModal}>
                        <h2>Subir Nueva Obra 📸</h2>
                        <div className={styles.moderationNotice}>
                            ⚠️ <strong>Aviso Importante:</strong> Para mantener nuestra comunidad segura, no se permite contenido explícito, ofensivo o inapropiado. Cualquier obra que infrinja estas normas será eliminada inmediatamente.
                            <br /><br />
                            📌 <strong>Tamaño máximo:</strong> 15MB. Si tu foto es muy pesada, intenta achicarla un poco antes de subirla.
                        </div>
                        <form onSubmit={handleUpload}>
                            <div className={styles.inputGroup}>
                                <label>Título de la obra</label>
                                <input
                                    type="text"
                                    required
                                    value={newPost.titulo}
                                    onChange={(e) => setNewPost({ ...newPost, titulo: e.target.value })}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Elegí tu dibujo</label>
                                <input type="file" accept="image/*" required onChange={handleImageChange} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Descripción (opcional)</label>
                                <textarea
                                    rows="3"
                                    value={newPost.descripcion}
                                    onChange={(e) => setNewPost({ ...newPost, descripcion: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="submit" className={styles.submitBtn} disabled={uploading}>
                                    {uploading ? 'Subiendo...' : 'Publicar 🚀'}
                                </button>
                                <button
                                    type="button"
                                    className={styles.submitBtn}
                                    style={{ background: '#4b5563' }}
                                    onClick={() => setShowUploadModal(false)}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE COMENTARIOS */}
            {selectedPostForComments && (
                <div className={styles.modalOverlay} onClick={() => setSelectedPostForComments(null)}>
                    <div 
                        className={styles.commentsModal} 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.commentsHeader}>
                            <h3>Comentarios en la obra de {selectedPostForComments.alumno_nombre}</h3>
                            <button className={styles.closeBtn} onClick={() => setSelectedPostForComments(null)}>✖</button>
                        </div>
                        
                        <div className={styles.commentsList}>
                            {loadingComments ? (
                                <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando comentarios...</p>
                            ) : comments.length === 0 ? (
                                <p style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Aún no hay comentarios. ¡Sé el primero en comentar!</p>
                            ) : (
                                comments.map(comment => (
                                    <div key={comment.id} className={styles.commentItem}>
                                        <div className={styles.commentHeader}>
                                            <strong>{comment.autor_nombre}</strong>
                                            <span className={styles.commentDate}>
                                                {new Date(comment.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className={styles.commentText}>{comment.texto}</p>
                                    <div className={styles.commentActions}>
                                            <button 
                                                className={`${styles.likeButton} ${comment.likedBy?.includes(user?.dni) ? styles.liked : ''}`}
                                                onClick={() => handleCommentLike(comment.id)}
                                            >
                                                ❤️ {comment.likesCount || 0}
                                            </button>
                                            {/* Botón borrar: visible para el admin o para el autor del comentario */}
                                            {(user?.dni === '999' || user?.dni === comment.autor_dni) && (
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm('¿Seguro que querés eliminar este comentario?')) return;
                                                        const res = await fetch(`/api/social/comments?id=${comment.id}&dni=${user.dni}`, { method: 'DELETE' });
                                                        const result = await res.json();
                                                        if (result.status === 'success') {
                                                            setComments(prev => prev.filter(c => c.id !== comment.id));
                                                            setPosts(prevPosts => prevPosts.map(p =>
                                                                p.id === selectedPostForComments.id
                                                                ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - 1) }
                                                                : p
                                                            ));
                                                        }
                                                    }}
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}
                                                    title="Eliminar comentario"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className={styles.commentInputContainer}>
                            <textarea
                                className={styles.commentInput}
                                placeholder="Escribe un comentario..."
                                rows="2"
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                maxLength={500}
                            />
                            <button 
                                className={styles.sendCommentBtn}
                                onClick={handlePostComment}
                                disabled={!newCommentText.trim()}
                            >
                                Enviar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function GaleriaPage() {
    return (
        <Suspense fallback={<div className="section-padding container"><p style={{color:'#aaa'}}>Cargando galería...</p></div>}>
            <GaleriaPageContent />
        </Suspense>
    );
}
