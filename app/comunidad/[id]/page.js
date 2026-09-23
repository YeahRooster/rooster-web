'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';

export default function PostDetail() {
    const { id } = useParams();
    const { user, loading } = useAuth();
    const router = useRouter();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);
    const [loadingData, setLoadingData] = useState(true);
    const [lightboxImage, setLightboxImage] = useState(null);

    useEffect(() => {
        if (!loading && user) {
            fetchPost();
            fetchComments();
        }
    }, [user, loading, id]);

    const fetchPost = async () => {
        try {
            const res = await fetch(`/api/v2/comunidad/posts?includeHidden=true`);
            const data = await res.json();
            if (data.status === 'success') {
                const found = data.posts.find(p => p.id.toString() === id);
                setPost(found);
            }
        } catch (e) { console.error(e); }
    };

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/v2/comunidad/comments?post_id=${id}`);
            const data = await res.json();
            if (data.status === 'success') {
                setComments(data.comments);
            }
        } catch (e) { console.error(e); } finally {
            setLoadingData(false);
        }
    };

    const postComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        if (!user) return alert("Debes iniciar sesión para comentar.");
        if (user.acceso_restringido) return alert("Tu cuenta tiene el acceso restringido a las interacciones.");

        try {
            const res = await fetch('/api/v2/comunidad/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: post.id, alumno_dni: user.dni, comentario: newComment, parent_id: replyingTo })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setNewComment("");
                setReplyingTo(null);
                fetchComments();
            } else {
                alert(data.message || "Error al comentar");
            }
        } catch (error) {
            console.error(error);
            alert("Error al enviar el comentario");
        }
    };

    const deleteComment = async (commentId) => {
        if (!confirm("¿Seguro que quieres borrar este comentario?")) return;
        try {
            const res = await fetch(`/api/v2/comunidad/comments?id=${commentId}`, { method: 'DELETE' });
            if (res.ok) fetchComments();
        } catch (e) { console.error(e); }
    };

    if (loading || loadingData) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Cargando post...</div>;
    if (!post) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Post no encontrado.</div>;

    const topLevelComments = comments.filter(c => !c.parent_id);
    const getReplies = (parentId) => comments.filter(c => c.parent_id === parentId);

    const CommentBlock = ({ comment, depth = 0 }) => {
        const replies = getReplies(comment.id);
        return (
            <div style={{ marginLeft: depth > 0 ? '40px' : '0', marginTop: '15px' }}>
                <div style={{ display: 'flex', gap: '15px', backgroundColor: depth > 0 ? '#111827' : '#1f2937', padding: '15px', borderRadius: '10px', border: '1px solid #374151' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#333', overflow: 'hidden', flexShrink: 0 }}>
                        <img src={comment.alumnos?.avatar_url || `/images/avatars/${comment.alumnos?.avatar_id || 'gallo'}.png`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                                <strong style={{ color: 'var(--rooster-yellow)', fontSize: '1rem' }}>{comment.alumnos?.nombre}</strong>
                                <span style={{ color: '#666', fontSize: '0.8rem' }}>{new Date(comment.created_at).toLocaleString()}</span>
                            </div>
                            {user?.role === 'admin' && (
                                <button onClick={() => deleteComment(comment.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>Eliminar</button>
                            )}
                        </div>
                        <p style={{ margin: '8px 0', color: '#eee', fontSize: '1rem', lineHeight: '1.5' }}>{comment.comentario}</p>
                        
                        {(user?.role === 'student' || user?.role === 'teacher' || user?.role === 'admin') && depth < 2 && (
                            <button onClick={() => setReplyingTo(comment.id)} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>Responder</button>
                        )}
                        
                        {replyingTo === comment.id && (
                            <form onSubmit={postComment} style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder={`Respondiendo a ${comment.alumnos?.nombre}...`} className="form-control" style={{ flex: 1, backgroundColor: '#111827', border: '1px solid #374151' }} autoFocus required />
                                <button type="submit" className="btn btn-primary">Enviar</button>
                                <button type="button" onClick={() => setReplyingTo(null)} className="btn btn-outline" style={{ borderColor: '#666', color: '#ccc' }}>Cancelar</button>
                            </form>
                        )}
                    </div>
                </div>
                {replies.map(reply => <CommentBlock key={reply.id} comment={reply} depth={depth + 1} />)}
            </div>
        );
    };

    return (
        <div style={{ backgroundColor: 'var(--rooster-bg)', minHeight: '80vh', padding: '40px 20px' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
                <button onClick={() => router.push('/comunidad')} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', marginBottom: '20px', fontSize: '1rem' }}>
                    ← Volver al Foro
                </button>

                <div style={{ backgroundColor: '#1a1a2e', borderRadius: '15px', padding: '30px', border: '1px solid #333' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
                        <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--rooster-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#000', fontSize: '1.2rem' }}>
                            {post.autor_nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p style={{ margin: 0, color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>{post.autor_nombre}</p>
                            <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>{new Date(post.fecha_publicacion).toLocaleString()} • {post.autor_rol}</p>
                        </div>
                    </div>

                    <h1 style={{ color: '#fff', fontSize: '2rem', marginBottom: '20px' }}>{post.titulo}</h1>
                    
                    <div className="rich-text-content" style={{ color: '#e5e7eb', fontSize: '1.1rem', lineHeight: '1.8' }} dangerouslySetInnerHTML={{ __html: post.contenido }} />

                    {post.imagenes && post.imagenes.length > 0 && (
                        <div style={{ display: 'flex', gap: '15px', marginTop: '30px', flexWrap: 'wrap' }}>
                            {post.imagenes.map((imgUrl, idx) => (
                                <img 
                                    key={idx} 
                                    src={imgUrl} 
                                    alt={`Adjunto ${idx+1}`} 
                                    onClick={() => setLightboxImage(imgUrl)}
                                    style={{ width: '250px', height: '250px', objectFit: 'cover', borderRadius: '10px', cursor: 'zoom-in', border: '1px solid #444' }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '40px' }}>
                    <h3 style={{ color: 'var(--rooster-yellow)', marginBottom: '20px' }}>Comentarios ({comments.length})</h3>
                    
                    {replyingTo === null && (user?.role === 'student' || user?.role === 'teacher' || user?.role === 'admin') && (
                        <form onSubmit={postComment} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                            <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Escribe un comentario en el foro..." className="form-control" style={{ flex: 1, backgroundColor: '#1a1a2e', border: '1px solid #333', padding: '15px' }} required />
                            <button type="submit" className="btn btn-primary" style={{ padding: '0 30px' }}>Comentar</button>
                        </form>
                    )}

                    <div>
                        {topLevelComments.length === 0 ? (
                            <p style={{ color: '#aaa' }}>Nadie ha comentado todavía.</p>
                        ) : (
                            topLevelComments.map(c => <CommentBlock key={c.id} comment={c} />)
                        )}
                    </div>
                </div>
            </div>

            {lightboxImage && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setLightboxImage(null)}>
                    <img src={lightboxImage} alt="Fullscreen" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                    <button style={{ position: 'absolute', top: '20px', right: '30px', background: 'none', border: 'none', color: 'white', fontSize: '3rem', cursor: 'pointer' }} onClick={() => setLightboxImage(null)}>×</button>
                </div>
            )}
        </div>
    );
}
