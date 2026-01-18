'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function GaleriaPage() {
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

    useEffect(() => {
        loadPosts();
    }, [viewMode]); // Recargar cuando cambia el modo de vista

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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewPost({ ...newPost, image: reader.result.split(',')[1] });
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
                body: JSON.stringify({
                    ...newPost,
                    dni: user.dni,
                    nombre: user.nombre
                })
            });
            const result = await res.json();
            if (result.status === 'success') {
                setShowUploadModal(false);
                setNewPost({ titulo: '', descripcion: '', image: null });
                loadPosts();
            }
        } catch (error) {
            alert("Error al subir obra");
        } finally {
            setUploading(false);
        }
    };

    if (loading && posts.length === 0) return <div className="section-padding container text-center">Cargando Galería de Rooster... 🎨</div>;

    const isAdmin = user?.role === 'admin';

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
                        </div>
                        <div className={styles.postInfo}>
                            <h3 className={styles.postTitle}>{post.titulo}</h3>
                            <p className={styles.postAuthor}>Por {post.alumno_nombre}</p>
                            <div className={styles.interactionBar}>
                                {viewMode === 'active' ? (
                                    <>
                                        <button
                                            className={`${styles.likeButton} ${post.social_likes?.some(l => l.usuario_dni === user?.dni) ? styles.liked : ''}`}
                                            onClick={(e) => { e.stopPropagation(); handleLike(post.id, post.alumno_dni); }}
                                        >
                                            ❤️ {post.likesCount}
                                        </button>

                                        {isAdmin && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); changePostStatus(post.id, 'trash'); }}
                                                style={{ marginLeft: 'auto', background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 8px' }}
                                                title="Mover a Papelera"
                                            >
                                                🗑️ Borrar
                                            </button>
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
        </div>
    );
}
