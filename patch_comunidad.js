const fs = require('fs');
let c = fs.readFileSync('app/comunidad/page.js', 'utf8');

const targetImports = `import styles from '../galeria/page.module.css'; // Reutilizamos estilos de galeria para consistencia`;
const replacementImports = `import styles from '../galeria/page.module.css';
import { useDropzone } from 'react-dropzone';`;
c = c.replace(targetImports, replacementImports);

const targetState = `    const [loadingComments, setLoadingComments] = useState(false);`;
const replacementState = `    const [loadingComments, setLoadingComments] = useState(false);

    // Editor / Moderation
    const [showEditor, setShowEditor] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editDate, setEditDate] = useState("");
    const [editImages, setEditImages] = useState([]); // File objects before upload
    const [uploadingPost, setUploadingPost] = useState(false);

    const onDrop = (acceptedFiles) => {
        setEditImages(prev => [...prev, ...acceptedFiles]);
    };
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*': []} });

    const removeImage = (index) => {
        setEditImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        setUploadingPost(true);
        try {
            let uploadedUrls = [];
            // Subir imagenes a Cloudinary
            for (const file of editImages) {
                const base64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => resolve(ev.target.result.split(',')[1]);
                    reader.readAsDataURL(file);
                });
                
                const res = await fetch('/api/v2/comunidad/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: base64 })
                });
                const result = await res.json();
                if (result.status === 'success') {
                    uploadedUrls.push(result.url);
                }
            }

            // Crear post
            const postRes = await fetch('/api/v2/comunidad/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    titulo: editTitle,
                    contenido: editContent,
                    imagenes: uploadedUrls,
                    autor_nombre: user.nombre,
                    autor_dni: user.dni,
                    autor_rol: user.role,
                    fecha_publicacion: editDate ? new Date(editDate).toISOString() : new Date().toISOString()
                })
            });
            const postResult = await postRes.json();
            if (postResult.status === 'success') {
                alert("Publicación creada correctamente.");
                setShowEditor(false);
                setEditTitle("");
                setEditContent("");
                setEditImages([]);
                setEditDate("");
                fetchPosts();
            } else {
                alert("Error al crear post: " + postResult.message);
            }
        } catch (error) {
            console.error(error);
            alert("Error general.");
        } finally {
            setUploadingPost(false);
        }
    };

    const toggleVisibility = async (postId, currentHidden) => {
        if (!confirm(\`¿Seguro que quieres \${currentHidden ? 'mostrar' : 'ocultar'} esta publicación?\`)) return;
        try {
            const res = await fetch('/api/v2/comunidad/posts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: postId, oculto: !currentHidden })
            });
            if (res.ok) fetchPosts();
        } catch (e) { console.error(e); }
    };

    const deletePost = async (postId) => {
        if (!confirm("¿Seguro que quieres eliminar definitivamente esta publicación?")) return;
        try {
            const res = await fetch(\`/api/v2/comunidad/posts?id=\${postId}\`, { method: 'DELETE' });
            if (res.ok) fetchPosts();
        } catch (e) { console.error(e); }
    };`;
c = c.replace(targetState, replacementState);

const targetFetch = `const res = await fetch('/api/v2/comunidad/posts');`;
const replacementFetch = `const res = await fetch(\`/api/v2/comunidad/posts?includeHidden=\${user?.role === 'admin' || user?.role === 'teacher'}\`);`;
c = c.replace(targetFetch, replacementFetch);

const targetHeader = `<p style={{ textAlign: 'center', color: '#ccc', marginBottom: '40px' }}>
                    Ideas, ejercicios, disparadores creativos y novedades de nuestros profes.
                </p>`;
const replacementHeader = `<p style={{ textAlign: 'center', color: '#ccc', marginBottom: '20px' }}>
                    Ideas, ejercicios, disparadores creativos y novedades de nuestros profes.
                </p>
                {(user?.role === 'admin' || user?.role === 'teacher') && (
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <button onClick={() => setShowEditor(true)} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '1rem' }}>
                            + Nueva Publicación
                        </button>
                    </div>
                )}`;
c = c.replace(targetHeader, replacementHeader);

const targetFooter = `<Footer />`;
const replacementFooter = `{showEditor && (
                <div className={styles.modalOverlay} onClick={() => setShowEditor(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '90%', height: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <button className={styles.closeBtn} onClick={() => setShowEditor(false)}>×</button>
                        <h2 style={{ color: 'var(--rooster-yellow)', marginBottom: '20px' }}>Crear Publicación</h2>
                        
                        <form onSubmit={handleCreatePost} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }} className="custom-scrollbar">
                            <div>
                                <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>Título</label>
                                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="form-control" style={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }} required />
                            </div>
                            
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>Contenido</label>
                                <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="form-control" style={{ flex: 1, backgroundColor: '#1a1a2e', border: '1px solid #333', minHeight: '150px' }} required />
                            </div>

                            <div>
                                <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>Imágenes (Opcional, podés subir varias)</label>
                                <div {...getRootProps()} style={{ border: '2px dashed #333', padding: '20px', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', backgroundColor: isDragActive ? '#222' : '#1a1a2e' }}>
                                    <input {...getInputProps()} />
                                    <p style={{ color: '#aaa', margin: 0 }}>Arrastrá imágenes aquí, o hacé clic para seleccionar archivos</p>
                                </div>
                                {editImages.length > 0 && (
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                                        {editImages.map((file, idx) => (
                                            <div key={idx} style={{ position: 'relative' }}>
                                                <img src={URL.createObjectURL(file)} alt="preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '5px' }} />
                                                <button type="button" onClick={() => removeImage(idx)} style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer' }}>×</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>Programar Fecha (Opcional - Si la dejás vacía se publica ya)</label>
                                <input type="datetime-local" value={editDate} onChange={e => setEditDate(e.target.value)} className="form-control" style={{ backgroundColor: '#1a1a2e', border: '1px solid #333', colorScheme: 'dark' }} />
                                <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '5px' }}>Si elegís una fecha futura, los alumnos no la verán hasta que llegue ese momento.</p>
                            </div>

                            <div style={{ textAlign: 'right', marginTop: '20px' }}>
                                <button type="submit" disabled={uploadingPost} className="btn btn-primary" style={{ padding: '10px 30px' }}>
                                    {uploadingPost ? 'Publicando...' : 'Publicar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <Footer />`;
c = c.replace(targetFooter, replacementFooter);

const targetAdminBtns = `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>`;
const replacementAdminBtns = `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            {(user?.role === 'admin' || user?.role === 'teacher') && (
                                                <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '10px' }}>
                                                    {new Date(post.fecha_publicacion) > new Date() && <span style={{ backgroundColor: '#eab308', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>PROGRAMADO</span>}
                                                    {post.oculto && <span style={{ backgroundColor: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>OCULTO</span>}
                                                    {user?.role === 'admin' && (
                                                        <>
                                                            <button onClick={() => toggleVisibility(post.id, post.oculto)} className="btn" style={{ background: '#374151', color: '#fff', border: 'none', padding: '4px 8px', fontSize: '0.75rem' }}>{post.oculto ? 'Mostrar' : 'Ocultar'}</button>
                                                            <button onClick={() => deletePost(post.id)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Eliminar</button>
                                                        </>
                                                    )}
                                                </div>
                                            )}`;
c = c.replace(targetAdminBtns, replacementAdminBtns);

const targetPostCard = `<div key={post.id} style={{ backgroundColor: '#1a1a2e', borderRadius: '15px', overflow: 'hidden', border: '1px solid #333' }}>`;
const replacementPostCard = `<div key={post.id} style={{ backgroundColor: '#1a1a2e', borderRadius: '15px', overflow: 'hidden', border: '1px solid #333', position: 'relative', opacity: post.oculto ? 0.6 : 1 }}>`;
c = c.replace(targetPostCard, replacementPostCard);

fs.writeFileSync('app/comunidad/page.js', c, 'utf8');
