const fs = require('fs');
let code = fs.readFileSync('app/comunidad/page.js', 'utf8');

// Add likedPosts state
if (!code.includes('const [likedPosts, setLikedPosts] = useState([]);')) {
    code = code.replace(
        'const [loadingPosts, setLoadingPosts] = useState(true);',
        'const [loadingPosts, setLoadingPosts] = useState(true);\n    const [likedPosts, setLikedPosts] = useState([]);'
    );
}

// Modify fetchPosts
if (!code.includes('fetch(`/api/v2/comunidad/likes?alumno_dni=${user.dni}`)')) {
    code = code.replace(
        'setPosts(data.posts);',
        'setPosts(data.posts);\n                if (user) {\n                    fetch(`/api/v2/comunidad/likes?alumno_dni=${user.dni}`).then(r => r.json()).then(d => { if(d.status === "success") setLikedPosts(d.likes); });\n                }'
    );
}

// Add toggleLike function
const toggleLikeFn = `
    const toggleLike = async (e, postId) => {
        e.stopPropagation();
        if (!user) return alert("Debes iniciar sesión para dar me gusta.");
        if (user.acceso_restringido) return alert("Tu cuenta tiene el acceso restringido a las interacciones.");
        
        try {
            const res = await fetch('/api/v2/comunidad/likes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: postId, alumno_dni: user.dni })
            });
            const data = await res.json();
            if (data.status === 'success') {
                if (data.action === 'liked') {
                    setLikedPosts(prev => [...prev, postId]);
                    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));
                } else {
                    setLikedPosts(prev => prev.filter(id => id !== postId));
                    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) - 1) } : p));
                }
            }
        } catch (err) { console.error(err); }
    };
`;
if (!code.includes('const toggleLike')) {
    code = code.replace('const toggleVisibility', toggleLikeFn + '\n    const toggleVisibility');
}

// Modify UI
const newSpan = `<button onClick={(e) => toggleLike(e, post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: '#888', padding: 0, fontSize: '0.9rem' }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}><span style={{ fontSize: '1.1rem' }}>{likedPosts.includes(post.id) ? '❤️' : '🤍'}</span> <span>{post.likes_count || 0}</span></button>`;
// PS stdout encoding caused weird chars earlier in my read, I'll use regex to replace it
code = code.replace(/<span>[^<]*\{post\.likes_count\}<\/span>/g, newSpan);

fs.writeFileSync('app/comunidad/page.js', code);
