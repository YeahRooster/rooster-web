const fs = require('fs');
let code = fs.readFileSync('app/comunidad/nuevo/page.js', 'utf8');

if (!code.includes('const [notificar, setNotificar] = useState(false);')) {
    code = code.replace(
        'const [uploadingPost, setUploadingPost] = useState(false);',
        'const [uploadingPost, setUploadingPost] = useState(false);\n    const [notificar, setNotificar] = useState(false);'
    );
    
    code = code.replace(
        'fecha_publicacion: editDate ? new Date(editDate).toISOString() : new Date().toISOString()',
        'fecha_publicacion: editDate ? new Date(editDate).toISOString() : new Date().toISOString(),\n                    notificar'
    );
    
    const uiCheckbox = `
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                        <input type="checkbox" id="notificarCheck" checked={notificar} onChange={e => setNotificar(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                        <label htmlFor="notificarCheck" style={{ color: '#fff', cursor: 'pointer', margin: 0, fontWeight: 'bold' }}>Notificar a los alumnos (Aparecerá en la campanita de la web)</label>
                    </div>
                    
                    <button type="submit" className="btn" disabled={uploadingPost} style={{ padding: '15px', fontSize: '1.2rem', marginTop: '10px' }}>`;
                    
    code = code.replace(
        /<button type="submit" className="btn" disabled=\{uploadingPost\}[^>]*>/,
        uiCheckbox
    );
    
    fs.writeFileSync('app/comunidad/nuevo/page.js', code);
}
