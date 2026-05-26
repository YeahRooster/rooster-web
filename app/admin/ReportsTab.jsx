'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function ReportsTab() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/v2/admin/reports');
            const data = await res.json();
            if (data.status === 'success') {
                setReports(data.data);
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    if (loading) return <div>Cargando reportes...</div>;

    // Calcular máximo para escalar el gráfico
    const maxIngreso = reports.length > 0 ? Math.max(...reports.map(r => r.ingresos)) : 1;

    return (
        <div className={styles.studentsSection}>
            <div className={styles.topActions}>
                <div>
                    <h2>📊 Reportes y Estadísticas Mensuales</h2>
                    <p style={{ color: '#aaa' }}>Evolución de ingresos y alumnos mes a mes.</p>
                </div>
            </div>

            <div style={{ background: '#1f2937', padding: '2rem', borderRadius: '12px', marginTop: '20px', border: '1px solid #374151' }}>
                <h3 style={{ color: 'white', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📈 Historial de Ingresos Netos
                </h3>
                
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', height: '280px', paddingBottom: '10px', overflowX: 'auto', borderBottom: '2px solid #374151', paddingLeft: '10px' }}>
                    {reports.map((r, i) => {
                        const heightPercent = Math.max((r.ingresos / maxIngreso) * 100, 3); // Mínimo 3% de altura
                        return (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '75px', gap: '6px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#34d399', marginBottom: '2px' }}>
                                    ${Math.round(r.ingresos).toLocaleString('es-AR')}
                                </span>
                                {/* Track de la barra con altura fija para evitar colapso de flex */}
                                <div style={{ 
                                    height: '200px', 
                                    width: '36px', 
                                    background: 'rgba(255, 255, 255, 0.03)', 
                                    borderRadius: '6px 6px 0 0', 
                                    display: 'flex', 
                                    alignItems: 'flex-end',
                                    border: '1px solid rgba(255, 255, 255, 0.05)'
                                }}>
                                    <div style={{ 
                                        width: '100%', 
                                        height: `${heightPercent}%`, 
                                        background: 'linear-gradient(180deg, #34d399 0%, #059669 100%)',
                                        borderRadius: '4px 4px 0 0',
                                        transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: '0 0 12px rgba(52, 211, 153, 0.25)',
                                        cursor: 'pointer'
                                    }} title={`$${Math.round(r.ingresos).toLocaleString('es-AR')}`}></div>
                                </div>
                                <span style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px', fontWeight: '600' }}>
                                    {r.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <h3 style={{ color: 'white', marginBottom: '15px' }}>Tabla de Evolución</h3>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Mes / Año</th>
                                <th>Alumnos Pagaron</th>
                                <th>Total Recaudado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.slice().reverse().map((r, idx) => (
                                <tr key={idx}>
                                    <td style={{ fontWeight: 'bold' }}>{r.label}</td>
                                    <td>{r.alumnos_pagaron} alumnos</td>
                                    <td style={{ color: '#10b981', fontWeight: 'bold' }}>${r.ingresos.toLocaleString('es-AR')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
