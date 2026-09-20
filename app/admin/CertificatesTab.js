'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function CertificatesTab() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/v2/admin/certificates/requests');
            const data = await res.json();
            if (data.status === 'success') {
                setRequests(data.requests);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleApprove = async (id) => {
        try {
            const res = await fetch('/api/v2/admin/certificates/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                alert('Solicitud aprobada.');
                loadRequests();
            }
        } catch (error) {
            alert('Error al aprobar.');
        }
    };

    return (
        <div className={styles.studentsSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className={styles.cardTitle}>📜 Solicitudes de Certificados</h2>
                <button onClick={loadRequests} className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>🔄 Refrescar</button>
            </div>
            
            {loading ? <p>Cargando solicitudes...</p> : (
                requests.length === 0 ? (
                    <p style={{ color: '#9ca3af' }}>No hay solicitudes de certificados pendientes.</p>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Alumno</th>
                                    <th>DNI</th>
                                    <th>Tipo</th>
                                    <th>Temario</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(req => (
                                    <tr key={req.id}>
                                        <td>{new Date(req.fecha_solicitud).toLocaleDateString('es-AR')}</td>
                                        <td style={{ fontWeight: 'bold' }}>{req.nombre_alumno}</td>
                                        <td>{req.alumno_dni}</td>
                                        <td>{req.tipo === 'regularity' ? 'Regularidad' : 'Personalizada'}</td>
                                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.temario}>
                                            {req.temario || '-'}
                                        </td>
                                        <td>
                                            <span className={req.estado === 'APROBADO' ? styles.tagPaid : styles.tagPending}>
                                                {req.estado}
                                            </span>
                                        </td>
                                        <td>
                                            {req.estado === 'PENDIENTE' && (
                                                <button 
                                                    onClick={() => handleApprove(req.id)}
                                                    className="btn btn-primary"
                                                    style={{ background: '#10b981', borderColor: '#10b981', padding: '4px 8px', fontSize: '0.8rem' }}
                                                >
                                                    ✅ Aprobar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}
        </div>
    );
}
