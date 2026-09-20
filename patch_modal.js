const fs = require('fs'); 
let c = fs.readFileSync('app/mi-cuenta/page.js', 'utf8'); 

c = c.replace("// PANEL DEL ALUMNO", `{showCertModal && editingCertStudent && (
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
            </div>
        );
    }

    // PANEL DEL ALUMNO`);

fs.writeFileSync('app/mi-cuenta/page.js', c, 'utf8');
