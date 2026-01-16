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

    // Estado para nueva publicación
    const [newPost, setNewPost] = useState({
        titulo: '',
        descripcion: '',
        image: null
    });

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        try {
            const res = await fetch('/api/social/posts');
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
                loadPosts(); // Recargar para actualizar contador
            }
        } catch (error) {
            console.error("Error en Like:", error);
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

    if (loading) return <div className="section-padding container text-center">Cargando Galería de Rooster... 🎨</div>;

    return (
        <div className="section-padding container">
            <h1 className="section-title text-center text-yellow" style={{ marginBottom: '1rem', fontSize: '3rem' }}>
                Galería de la Comunidad
            </h1>
            <p className="text-center" style={{ marginBottom: '3rem', maxWidth: '700px', margin: '0 auto 2rem' }}>
                Un espacio para compartir nuestras obras y celebrar el talento de Rooster.
            </p>

            {user && (user.role === 'student' || user.role === 'teacher' || user.role === 'admin') && (
                <button className={styles.uploadButton} onClick={() => setShowUploadModal(true)}>
                    <span>📸</span> Subir mi Obra
                </button>
            )}

            <div className={styles.galleryGrid}>
                {posts.map((post) => (
                    <div key={post.id} className={styles.postCard}>
                        <div className={styles.imageContainer}>
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
                                <button
                                    className={`${styles.likeButton} ${post.social_likes?.some(l => l.usuario_dni === user?.dni) ? styles.liked : ''}`}
                                    onClick={() => handleLike(post.id, post.alumno_dni)}
                                >
                                    ❤️ {post.likesCount}
                                </button>
                                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                    {new Date(post.fecha_creacion).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

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
