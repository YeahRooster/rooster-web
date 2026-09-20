const fs = require('fs'); 
let c = fs.readFileSync('app/admin/page.js', 'utf8'); 

c = c.replace(/import ReportsTab from '\.\/ReportsTab';/, "import ReportsTab from './ReportsTab';\nimport CertificatesTab from './CertificatesTab';"); 

c = c.replace(/<button className=\{\`\$\{styles\.tab\} \$\{view === 'reports'.*?<\/button>/s, "<button className={`\\${styles.tab} \\${view === 'reports' ? styles.tabActive : ''}`} onClick={() => { setView('reports'); loadPaymentsHistory(); }}>📈 Reportes</button>\n                        <button className={`\\${styles.tab} \\${view === 'certificates' ? styles.tabActive : ''}`} onClick={() => setView('certificates')}>📜 Certificados</button>"); 

c = c.replace("{view === 'reports' && <ReportsTab />}", "{view === 'reports' && <ReportsTab />}\n\n            {view === 'certificates' && <CertificatesTab />}"); 

fs.writeFileSync('app/admin/page.js', c, 'utf8');
