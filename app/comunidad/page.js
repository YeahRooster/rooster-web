'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import styles from '../galeria/page.module.css'; 

export default function ComunidadIndex() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);

    useEffect(() => {
        if (!loading && user) {
            fetchPosts();
        }
    }, [user, loading]);

    const fetchPosts = async () => {
        try {
            const res = await fetch(`/api/v2/comunidad/posts?includeHidden=${user?.role === 'admin' || user?.role === 'teacher'}`);
            const data = await res.json();
            if (data.status === 'success') {
                setPosts(data.posts);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingPosts(false);
        }
    };

    const toggleVisibility = async (e, postId, currentHidden) => {
        e.stopPropagation();
        if (!confirm(`¿Seguro que quieres ${currentHidden ? 'mostrar' : 'ocultar'} esta publicación?`)) return;
        try {
            const res = await fetch('/api/v2/comunidad/posts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: postId, oculto: !currentHidden })
            });
            if (res.ok) fetchPosts();
        } catch (err) { console.error(err); }
    };

    const deletePost = async (e, postId) => {
        e.stopPropagation();
        if (!confirm("¿Seguro que quieres eliminar definitivamente esta publicación?")) return;
        try {
            const res = await fetch(`/api/v2/comunidad/posts?id=${postId}`, { method: 'DELETE' });
            if (res.ok) fetchPosts();
        } catch (err) { console.error(err); }
    };

    if (loading) return null;

    return (
        <div style={{ backgroundColor: 'var(--rooster-bg)', minHeight: '80vh', padding: '40px 20px' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
                <h1 style={{ color: 'var(--rooster-yellow)', textAlign: 'center', marginBottom: '10px' }}>Foro Comunidad Rooster</h1>
                <p style={{ textAlign: 'center', color: '#ccc', marginBottom: '20px' }}>
                    Ideas, ejercicios, disparadores creativos y novedades.
                </p>

                {(user?.role === 'admin' || user?.role === 'teacher') && (
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <button onClick={() => router.push('/comunidad/nuevo')} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '1rem' }}>
                            + Nueva Publicación
                        </button>
                    </div>
                )}

                {loadingPosts ? (
                    <p style={{ textAlign: 'center', color: '#fff' }}>Cargando foro...</p>
                ) : posts.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#aaa' }}>Aún no hay publicaciones en el foro.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {posts.map(post => {
                            const isScheduled = new Date(post.fecha_publicacion) > new Date();
                            return (
                                <div 
                                    key={post.id} 
                                    onClick={() => router.push(`/comunidad/${post.id}`)}
                                    style={{ 
                                        backgroundColor: '#1a1a2e', 
                                        borderRadius: '12px', 
                                        padding: '20px',
                                        border: '1px solid #333', 
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s, border-color 0.2s',
                                        position: 'relative',
                                        opacity: post.oculto ? 0.6 : 1
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--rooster-yellow)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#333'; }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <h2 style={{ color: '#fff', fontSize: '1.3rem', margin: '0 0 10px 0' }}>{post.titulo}</h2>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#888', fontSize: '0.9rem' }}>
                                                <span>Por <strong>{post.autor_nombre}</strong></span>
                                                <span>•</span>
                                                <span>{new Date(post.fecha_publicacion).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span>❤️ {post.likes_count}</span>
                                                <span>•</span>
                                                <span>💬 {post.comments_count}</span>
                                            </div>
                                        </div>

                                        {(user?.role === 'admin' || user?.role === 'teacher') && (
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                {isScheduled && <span style={{ backgroundColor: '#eab308', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>PROGRAMADO</span>}
                                                {post.oculto && <span style={{ backgroundColor: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>OCULTO</span>}
                                                
                                                {user?.role === 'admin' && (
                                                    <>
                                                        <button onClick={(e) => toggleVisibility(e, post.id, post.oculto)} className="btn" style={{ background: '#374151', color: '#fff', border: 'none', padding: '4px 8px', fontSize: '0.75rem' }}>
                                                            {post.oculto ? 'Mostrar' : 'Ocultar'}
                                                        </button>
                                                        <button onClick={(e) => deletePost(e, post.id)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                                                            Eliminar
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
