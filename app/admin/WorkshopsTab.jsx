'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function WorkshopsTab() {
    const [workshops, setWorkshops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        titulo: '',
        dia: '',
        horario: '',
        descripcion_corta: '',
        descripcion_larga: '',
        imagen_url: '',
        cupos_totales: 15,
        activo: true,
        tipo_cobro: 'MENSUAL',
        comision: 1
    });

    useEffect(() => {
        loadWorkshops();
    }, []);

    const loadWorkshops = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/v2/admin/workshops');
            const data = await res.json();
            if (data.status === 'success') {
                setWorkshops(data.data);
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const method = editingId ? 'PUT' : 'POST';
            const body = editingId ? { ...formData, id: editingId } : formData;

            const res = await fetch('/api/v2/admin/workshops', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.status === 'success') {
                setShowModal(false);
                loadWorkshops();
            } else {
                alert('Error al guardar: ' + data.message);
            }
        } catch (e) {
            alert('Error de conexión');
        }
    };

    const handleEdit = (w) => {
        setFormData(w);
        setEditingId(w.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Seguro que quieres eliminar este taller? Se perderán las inscripciones asociadas.')) return;
        try {
            const res = await fetch(`/api/v2/admin/workshops?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.status === 'success') {
                loadWorkshops();
            } else {
                alert('Error al eliminar');
            }
        } catch (e) { alert('Error de conexión'); }
    };

    if (loading) return <div>Cargando talleres...</div>;

    return (
        <div className={styles.studentsSection}>
            <div className={styles.topActions}>
                <div>
                    <h2>🏢 Gestión de Talleres</h2>
                    <p style={{ color: '#aaa' }}>Crea, edita o elimina talleres de la plataforma.</p>
                </div>
                <button
                    className="btn btn-primary"
                    style={{ background: '#f59e0b', border: 'none', fontWeight: 'bold' }}
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ titulo: '', dia: '', horario: '', descripcion_corta: '', descripcion_larga: '', imagen_url: '', cupos_totales: 15, activo: true, tipo_cobro: 'MENSUAL', comision: 1 });
                        setShowModal(true);
                    }}
                >
                    + Nuevo Taller
                </button>
            </div>

            <div className={styles.cardsGrid}>
                {workshops.map(w => (
                    <div key={w.id} className={styles.studentCard} style={{ opacity: w.activo ? 1 : 0.6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ color: 'white', margin: 0 }}>{w.titulo}</h3>
                                <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 'bold' }}>{w.dia} - {w.horario}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => handleEdit(w)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✏️</button>
                                <button onClick={() => handleDelete(w.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>🗑️</button>
                            </div>
                        </div>
                        {w.imagen_url && <img src={w.imagen_url} alt="taller" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginTop: '10px' }} />}
                        <p style={{ fontSize: '0.9rem', color: '#9ca3af', margin: '0.5rem 0' }}>{w.descripcion_corta}</p>
                        
                        <div style={{ background: '#1f2937', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>Cupos:</span>
                                <strong style={{ color: 'white' }}>{w.cupos_ocupados}/{w.cupos_totales}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>Estado:</span>
                                <strong style={{ color: w.activo ? '#10b981' : '#f87171' }}>{w.activo ? 'Activo' : 'Inactivo'}</strong>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: '600px' }}>
                        <h2>{editingId ? 'Editar Taller' : 'Nuevo Taller'}</h2>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                            <input type="text" placeholder="Título (ej: Dibujo Kids)" value={formData.titulo} onChange={e => setFormData({ ...formData, titulo: e.target.value })} required className={styles.formInput} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input type="text" placeholder="Día (ej: Lunes)" value={formData.dia} onChange={e => setFormData({ ...formData, dia: e.target.value })} required className={styles.formInput} />
                                <input type="text" placeholder="Horario (ej: 18:00hs)" value={formData.horario} onChange={e => setFormData({ ...formData, horario: e.target.value })} required className={styles.formInput} />
                            </div>
                            <input type="text" placeholder="Descripción Corta" value={formData.descripcion_corta} onChange={e => setFormData({ ...formData, descripcion_corta: e.target.value })} required className={styles.formInput} />
                            <textarea placeholder="Descripción Larga" value={formData.descripcion_larga} onChange={e => setFormData({ ...formData, descripcion_larga: e.target.value })} rows={4} className={styles.formInput} />
                            <input type="text" placeholder="URL de Imagen (ej: https://...)" value={formData.imagen_url} onChange={e => setFormData({ ...formData, imagen_url: e.target.value })} className={styles.formInput} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input type="number" placeholder="Cupos Totales" value={formData.cupos_totales} onChange={e => setFormData({ ...formData, cupos_totales: parseInt(e.target.value) })} required className={styles.formInput} />
                                <select value={formData.activo ? "1" : "0"} onChange={e => setFormData({ ...formData, activo: e.target.value === "1" })} className={styles.formInput}>
                                    <option value="1">Activo (Visible en web)</option>
                                    <option value="0">Oculto</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px' }}>Ganancia Neta (ej: 0.7 = 70%)</label>
                                    <input type="number" step="0.05" min="0" max="1" placeholder="Ej: 0.7" value={formData.comision} onChange={e => setFormData({ ...formData, comision: parseFloat(e.target.value) })} required className={styles.formInput} />
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" style={{ border: 'none' }}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" style={{ background: '#f59e0b', border: 'none', color: 'white' }}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
