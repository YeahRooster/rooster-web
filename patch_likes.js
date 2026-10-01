const fs = require('fs');
let code = fs.readFileSync('app/comunidad/[id]/page.js', 'utf8');

// Add state for like
if (!code.includes('const [isLiked, setIsLiked] = useState(false);')) {
    code = code.replace(
        'const [lightboxImage, setLightboxImage] = useState(null);',
        'const [lightboxImage, setLightboxImage] = useState(null);\n    const [isLiked, setIsLiked] = useState(false);\n    const [likesCount, setLikesCount] = useState(0);'
    );
}

// Modify fetchPost to also fetch likes if needed, or we just set likesCount from post data
if (!code.includes('setLikesCount(found.likes_count || 0);')) {
    code = code.replace(
        'setPost(found);',
        'setPost(found);\n                setLikesCount(found.likes_count || 0);\n                if (user) {\n                    fetch(`/api/v2/comunidad/likes?alumno_dni=${user.dni}`).then(r => r.json()).then(d => {\n                        if (d.status === "success") setIsLiked(d.likes.includes(found.id));\n                    });\n                }'
    );
}

// Add toggleLike function
const toggleLikeFn = `
    const toggleLike = async () => {
        if (!user) return alert("Debes iniciar sesión para dar me gusta.");
        if (user.acceso_restringido) return alert("Tu cuenta tiene el acceso restringido a las interacciones.");
        
        try {
            const res = await fetch('/api/v2/comunidad/likes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: post.id, alumno_dni: user.dni })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setIsLiked(data.action === 'liked');
                setLikesCount(prev => data.action === 'liked' ? prev + 1 : prev - 1);
            }
        } catch (e) { console.error(e); }
    };
`;
if (!code.includes('const toggleLike')) {
    code = code.replace('const postComment = async (e) => {', toggleLikeFn + '\n    const postComment = async (e) => {');
}

// Add the like button to the UI
const likeBtnUI = `
                    <div className="rich-text-content" style={{ color: '#e5e7eb', fontSize: '1.1rem', lineHeight: '1.8' }} dangerouslySetInnerHTML={{ __html: post.contenido }} />

                    <div style={{ marginTop: '30px', padding: '15px 0', borderTop: '1px solid #333', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button onClick={toggleLike} style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid #444', borderRadius: '30px', padding: '8px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '1.4rem' }}>{isLiked ? '❤️' : '🤍'}</span>
                            <span style={{ color: isLiked ? '#ef4444' : '#fff', fontWeight: 'bold' }}>{likesCount} {likesCount === 1 ? 'Me gusta' : 'Me gustas'}</span>
                        </button>
                    </div>
`;
if (!code.includes('isLiked ?')) {
    code = code.replace(
        '<div className="rich-text-content" style={{ color: \'#e5e7eb\', fontSize: \'1.1rem\', lineHeight: \'1.8\' }} dangerouslySetInnerHTML={{ __html: post.contenido }} />',
        likeBtnUI
    );
}

fs.writeFileSync('app/comunidad/[id]/page.js', code);
