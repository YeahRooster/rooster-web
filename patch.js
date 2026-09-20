const fs = require('fs'); 
let c = fs.readFileSync('app/mi-cuenta/page.js', 'utf8'); 

c = c.replace(/import styles from '\.\/mi-cuenta\.module\.css';/, "import styles from './mi-cuenta.module.css';\nimport Certificados from '../components/Certificados';"); 

c = c.replace("const [resourceMode, setResourceMode] = useState('file');", "const [resourceMode, setResourceMode] = useState('file');\n    const [showCertModal, setShowCertModal] = useState(false);\n    const [editingCertStudent, setEditingCertStudent] = useState(null);\n    const [certSaving, setCertSaving] = useState(false);"); 

c = c.replace("const handleFileUpload = (e) =>", "const handleSaveCertData = async () => { setCertSaving(true); try { const res = await fetch('/api/v2/teacher/certificates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inscripcionId: editingCertStudent.id, certificadosData: editingCertStudent.certificados_data }) }); if(res.ok) { alert('Datos guardados correctamente'); setShowCertModal(false); loadTeacherData(); } else { alert('Error al guardar'); } } catch(err) { console.error(err); alert('Error al guardar'); } finally { setCertSaving(false); } };\n\n    const handleFileUpload = (e) =>"); 

c = c.replace("<div className={styles.paymentsCard}>", "<Certificados user={user} />\n\n                <div className={styles.paymentsCard}>"); 

c = c.replace("<td>{s.nombre}</td>", "<td>\n                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>\n                                                            <span>{s.nombre}</span>\n                                                            <button\n                                                                onClick={() => { setEditingCertStudent(s); setShowCertModal(true); }}\n                                                                style={{ background: 'none', border: '1px solid #333', padding: '2px 8px', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}\n                                                            >🎓 Certificados</button>\n                                                        </div>\n                                                    </td>"); 

fs.writeFileSync('app/mi-cuenta/page.js', c, 'utf8');
