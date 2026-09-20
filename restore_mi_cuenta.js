const fs = require('fs');
let c = fs.readFileSync('app/mi-cuenta/page.js', 'utf8');

// 1. Add imports
c = c.replace("import styles from './page.module.css';", "import styles from './page.module.css';\nimport Certificados from '../components/Certificados';");

// 2. Add refreshUser
c = c.replace("const { user, loading } = useAuth();", `const { user, loading, refreshUser } = useAuth();
    
    useEffect(() => {
        if (user && user.perfil === 'Alumno') {
            refreshUser();
        }
    }, [user?.dni]);`);

// 3. Add modal states
c = c.replace("const [resourceMode, setResourceMode] = useState('file'); // 'file' o 'note'", `const [resourceMode, setResourceMode] = useState('file');
    const [showCertModal, setShowCertModal] = useState(false);
    const [editingCertStudent, setEditingCertStudent] = useState(null);
    const [certSaving, setCertSaving] = useState(false);`);

// 4. Add handleSaveCertData
if (!c.includes('handleSaveCertData')) {
    c = c.replace("const handleFileUpload = (e) => {", `const handleSaveCertData = async () => { setCertSaving(true); try { const res = await fetch('/api/v2/teacher/certificates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inscripcionId: editingCertStudent.id, certificadosData: editingCertStudent.certificados_data }) }); if(res.ok) { alert('Datos guardados correctamente'); setShowCertModal(false); loadTeacherData(); } else { alert('Error al guardar'); } } catch(err) { console.error(err); alert('Error al guardar'); } finally { setCertSaving(false); } };

    const handleFileUpload = (e) => {`);
}

// 5. Replace Teacher student row button
c = c.replace(/<td>\{s\.nombre\}<\/td>/g, `<td>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{s.nombre}</span>
        <button
            onClick={() => { setEditingCertStudent(s); setShowCertModal(true); }}
            style={{ background: 'none', border: '1px solid #333', padding: '2px 8px', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}
        >🎓 Certificados</button>
    </div>
</td>`);

// 6. Insert Modal
c = c.replace('<div className={styles.teacherGrid}>', `{showCertModal && editingCertStudent && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modal}>
                            <h2 style={{color:'#f59e0b', marginBottom:'1rem'}}>Certificados para {editingCertStudent.nombre}</h2>
                            <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
                                <label style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                    <input type="checkbox" checked={editingCertStudent.certificados_data?.etapa_1_aprobada || false} onChange={(e) => setEditingCertStudent({...editingCertStudent, certificados_data: {...editingCertStudent.certificados_data, etapa_1_aprobada: e.target.checked}})} />
                                    Etapa 1 (Ciclo Inicial) Completada
                                </label>
                                <label style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                    <input type="checkbox" checked={editingCertStudent.certificados_data?.etapa_2_aprobada || false} onChange={(e) => setEditingCertStudent({...editingCertStudent, certificados_data: {...editingCertStudent.certificados_data, etapa_2_aprobada: e.target.checked}})} />
                                    Etapa 2 (Ciclo Medio) Completada
                                </label>
                                <label style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                    <input type="checkbox" checked={editingCertStudent.certificados_data?.etapa_3_aprobada || false} onChange={(e) => setEditingCertStudent({...editingCertStudent, certificados_data: {...editingCertStudent.certificados_data, etapa_3_aprobada: e.target.checked}})} />
                                    Etapa 3 (Finalización) Completada
                                </label>
                                <label style={{marginTop:'1rem'}}>
                                    Nivel de Idioma (solo Inglés/Italiano):
                                    <select value={editingCertStudent.certificados_data?.nivel_idioma || ''} onChange={(e) => setEditingCertStudent({...editingCertStudent, certificados_data: {...editingCertStudent.certificados_data, nivel_idioma: e.target.value}})} style={{width:'100%', padding:'8px', marginTop:'4px', background:'#111', color:'white', border:'1px solid #333'}}>
                                        <option value="">Ninguno</option>
                                        <option value="A1">A1</option>
                                        <option value="A2">A2</option>
                                        <option value="B1">B1</option>
                                        <option value="B2">B2</option>
                                    </select>
                                </label>
                            </div>
                            <div style={{display:'flex', gap:'10px', marginTop:'1.5rem', justifyContent:'flex-end'}}>
                                <button className="btn" onClick={() => setShowCertModal(false)}>Cancelar</button>
                                <button className="btn btn-primary" onClick={handleSaveCertData} disabled={certSaving}>{certSaving ? 'Guardando...' : 'Guardar'}</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className={styles.teacherGrid}>`);

// 7. Inject Certificados for Student view
if (!c.includes('<Certificados user={user} />')) {
    c = c.replace(/<div className=\{styles\.paymentsCard\}>/, `<Certificados user={user} />\n\n                <div className={styles.paymentsCard}>`);
}

fs.writeFileSync('app/mi-cuenta/page.js', c, 'utf8');
