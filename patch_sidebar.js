const fs = require('fs'); 
let c = fs.readFileSync('app/admin/page.js', 'utf8'); 

// Insert import at the top
if (!c.includes('import { BarChart')) {
    c = c.replace(/import styles from '\.\/page\.module\.css';/, "import styles from './page.module.css';\nimport { BarChart, Users, UserCog, Palette, FolderOpen, Image as ImageIcon, DollarSign, TrendingUp, FileText, Award, Calendar } from 'lucide-react';");
}

const newSidebar = `<div className={styles.sidebar}>
                    <div className={styles.tabs}>
                        <button className={\`\${styles.tab} \${view === 'stats' ? styles.tabActive : ''}\`} onClick={() => setView('stats')}>
                            <BarChart size={18} style={{marginRight: '8px'}} /> Estadísticas
                        </button>
                        <button className={\`\${styles.tab} \${view === 'students' ? styles.tabActive : ''}\`} onClick={() => setView('students')}>
                            <Users size={18} style={{marginRight: '8px'}} /> Alumnos
                            {stats?.alumnosPendientes > 0 && (
                                <span style={{ background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', marginLeft: '6px' }}>
                                    {stats.alumnosPendientes}
                                </span>
                            )}
                        </button>
                        <button className={\`\${styles.tab} \${view === 'profesores' ? styles.tabActive : ''}\`} onClick={() => { setView('profesores'); loadProfesores(); }}>
                            <UserCog size={18} style={{marginRight: '8px'}} /> Profesores
                        </button>
                        <button className={\`\${styles.tab} \${view === 'workshops' ? styles.tabActive : ''}\`} onClick={() => { setView('workshops'); loadTalleres(); }}>
                            <Palette size={18} style={{marginRight: '8px'}} /> Talleres
                        </button>
                        <button className={\`\${styles.tab} \${view === 'resources' ? styles.tabActive : ''}\`} onClick={() => setView('resources')}>
                            <FolderOpen size={18} style={{marginRight: '8px'}} /> Materiales
                        </button>
                        <button className={\`\${styles.tab} \${view === 'gallery' ? styles.tabActive : ''}\`} onClick={() => { setView('gallery'); loadGalleryPosts(); loadBannedWords(); }}>
                            <ImageIcon size={18} style={{marginRight: '8px'}} /> Galería
                        </button>
                        <button className={\`\${styles.tab} \${view === 'payments' ? styles.tabActive : ''}\`} onClick={() => { setView('payments'); loadPaymentsHistory(); loadTalleres(); }}>
                            <DollarSign size={18} style={{marginRight: '8px'}} /> Pagos
                        </button>
                        <button className={\`\${styles.tab} \${view === 'reports' ? styles.tabActive : ''}\`} onClick={() => { setView('reports'); loadPaymentsHistory(); }}>
                            <TrendingUp size={18} style={{marginRight: '8px'}} /> Reportes
                        </button>
                        <button className={\`\${styles.tab} \${view === 'certificates' ? styles.tabActive : ''}\`} onClick={() => setView('certificates')}>
                            <FileText size={18} style={{marginRight: '8px'}} /> Certificados
                        </button>
                        <button className={\`\${styles.tab} \${view === 'challenges' ? styles.tabActive : ''}\`} onClick={() => { setView('challenges'); loadChallenges(); loadTalleres(); }}>
                            <Award size={18} style={{marginRight: '8px'}} /> Desafíos
                        </button>
                        <button className={\`\${styles.tab}\`} onClick={() => window.location.href = '/cronograma'}>
                            <Calendar size={18} style={{marginRight: '8px'}} /> Ver Cronograma
                        </button>
                    </div>`;

// Regex to replace the entire sidebar div content until the closing </div> of the sidebar
// We can use a simpler replacement if we match everything between `<div className={styles.tabs}>` and `</div>`

c = c.replace(/<div className=\{styles\.sidebar\}>[\s\S]*?<div className=\{styles\.tabs\}>[\s\S]*?<\/div>[\s\S]*?<\/div>/, newSidebar + '\n                </div>');

fs.writeFileSync('app/admin/page.js', c, 'utf8');
