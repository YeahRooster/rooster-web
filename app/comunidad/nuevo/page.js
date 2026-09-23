'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useDropzone } from 'react-dropzone';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function NuevoPost() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editDate, setEditDate] = useState("");
    const [editImages, setEditImages] = useState([]);
    const [uploadingPost, setUploadingPost] = useState(false);

    const onDrop = (acceptedFiles) => setEditImages(prev => [...prev, ...acceptedFiles]);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*': []} });
    const removeImage = (index) => setEditImages(prev => prev.filter((_, i) => i !== index));

    if (loading) return null;
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
        return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>No tienes permiso para ver esta página.</div>;
    }

    const handleCreatePost = async (e) => {
        e.preventDefault();
        setUploadingPost(true);
        try {
            let uploadedUrls = [];
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
                if (result.status === 'success') uploadedUrls.push(result.url);
            }

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
                router.push('/comunidad');
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

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link'],
            ['clean']
        ]
    };

    return (
        <div style={{ backgroundColor: 'var(--rooster-bg)', minHeight: '80vh', padding: '40px 20px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#1a1a2e', padding: '30px', borderRadius: '15px', border: '1px solid #333' }}>
                <h1 style={{ color: 'var(--rooster-yellow)', marginBottom: '20px' }}>Crear Nueva Publicación</h1>
                
                <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ color: '#fff', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Título</label>
                        <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="form-control" style={{ backgroundColor: '#111827', border: '1px solid #333', padding: '12px' }} required />
                    </div>
                    
                    <div>
                        <label style={{ color: '#fff', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Contenido</label>
                        <div style={{ backgroundColor: '#fff', color: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                            <ReactQuill 
                                theme="snow" 
                                value={editContent} 
                                onChange={setEditContent} 
                                modules={modules}
                                style={{ height: '300px' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '40px' }}>
                        <label style={{ color: '#fff', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Imágenes (Opcional)</label>
                        <div {...getRootProps()} style={{ border: '2px dashed #4b5563', padding: '30px', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', backgroundColor: isDragActive ? '#374151' : '#111827' }}>
                            <input {...getInputProps()} />
                            <p style={{ color: '#aaa', margin: 0 }}>Arrastrá imágenes aquí, o hacé clic para seleccionarlas</p>
                        </div>
                        {editImages.length > 0 && (
                            <div style={{ display: 'flex', gap: '15px', marginTop: '15px', flexWrap: 'wrap' }}>
                                {editImages.map((file, idx) => (
                                    <div key={idx} style={{ position: 'relative' }}>
                                        <img src={URL.createObjectURL(file)} alt="preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                                        <button type="button" onClick={() => removeImage(idx)} style={{ position: 'absolute', top: -8, right: -8, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label style={{ color: '#fff', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Programar Publicación (Opcional)</label>
                        <input type="datetime-local" value={editDate} onChange={e => setEditDate(e.target.value)} className="form-control" style={{ backgroundColor: '#111827', border: '1px solid #333', colorScheme: 'dark', padding: '12px' }} />
                        <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '5px' }}>Dejá esto vacío para publicar inmediatamente.</p>
                    </div>

                    <div style={{ textAlign: 'right', marginTop: '10px' }}>
                        <button type="button" onClick={() => router.push('/comunidad')} className="btn" style={{ background: 'transparent', color: '#ccc', marginRight: '15px' }}>Cancelar</button>
                        <button type="submit" disabled={uploadingPost || !editTitle || !editContent} className="btn btn-primary" style={{ padding: '12px 30px', fontSize: '1.1rem' }}>
                            {uploadingPost ? 'Publicando...' : 'Publicar en Foro'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
