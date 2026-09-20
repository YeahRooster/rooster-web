const fs = require('fs');
let c = fs.readFileSync('app/components/Certificados.js', 'utf8');

// Update stages titles
c = c.replace(/title: 'el Ciclo Inicial del Taller de Dibujo'/g, "title: 'el Ciclo Inicial'");
c = c.replace(/title: 'el Ciclo Medio del Taller de Dibujo'/g, "title: 'el Ciclo Medio'");
c = c.replace(/title: 'el Taller de Dibujo Completo'/g, "title: 'el Ciclo Completo'");

// Update generatePDF calls to pass tallerNombre as descStr
c = c.replace(/generatePDF\('stage', st\.title, null, "", teacherName\)/g, "generatePDF('stage', st.title, tallerNombre, \"\", teacherName)");

// Find the generatePDF logic for 'stage' and 'language'
c = c.replace(/if \(type === 'stage'\) \{[\s\S]*?activeRef\.current\.style\.display = 'block';/m, `if (type === 'stage') {
                    titleEl.innerText = "Certificado otorgado a:";
                    descEl.innerText = \`Por haber completado satisfactoriamente \${titleStr} de\`;
                } else if (type === 'language') {
                    titleEl.innerText = "Certificado otorgado a:";
                    descEl.innerText = \`Por haber completado satisfactoriamente el nivel \${titleStr} de\`;
                }
                
                const courseEl = document.getElementById('cert-course');
                if (courseEl) courseEl.innerText = descStr;

                topicsEl.innerText = topics ? topics : "";
                teacherEl.innerText = teacherName;
                dateEl.innerText = \`Entregado el mes de \${meses[date.getMonth()].toLowerCase()} de \${date.getFullYear()}\`;

                activeRef.current.style.display = 'block';`);

// Replace logo path for formal cert
c = c.replace(/<img src="\/images\/logo_espacio_arte\.jpg"/g, '<img src="/images/rooster_espacio_arte.png"');

// Replace landscape template HTML
const newLandscapeTemplate = `
            {/* ELEMENTO OCULTO PARA EL PDF - ETAPAS / NIVELES (LANDSCAPE) */}
            <div 
                ref={certificateRef}
                style={{
                    display: 'none',
                    width: '1123px',
                    height: '794px',
                    backgroundColor: '#fff',
                    position: 'absolute',
                    top: '-9999px',
                    left: '-9999px',
                    padding: '20px',
                    boxSizing: 'border-box',
                }}
            >
                <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#f6f7eb',
                    border: '35px solid #1a2b4c',
                    boxSizing: 'border-box',
                    padding: '40px 60px',
                    textAlign: 'center',
                    fontFamily: 'sans-serif',
                    color: '#1a2b4c',
                    boxShadow: 'inset 0 0 0 5px #f6f7eb, inset 0 0 0 6px #1a2b4c'
                }}>
                    <div style={{ marginBottom: '20px' }}>
                        <img id="cert-logo" src="/images/rooster_espacio_arte.png" alt="Logo" style={{ maxWidth: '300px', margin: '0 auto', display: 'block' }} />
                    </div>
                    
                    <h1 id="cert-title" style={{ fontSize: '20px', margin: '15px 0', fontWeight: 'normal', color: '#1a2b4c' }}>
                        Certificado otorgado a:
                    </h1>
                    
                    <h2 id="cert-name" style={{ fontSize: '42px', margin: '10px 0', color: '#1a2b4c', fontWeight: 'bold' }}>
                        {user.nombre}
                    </h2>
                    
                    <p style={{ fontSize: '20px', margin: '5px 0', fontWeight: 'bold' }}>DNI {user.dni}</p>
                    
                    <p id="cert-desc" style={{ fontSize: '22px', marginTop: '30px', marginBottom: '10px' }}>
                        Por haber completado satisfactoriamente el ciclo inicial de
                    </p>
                    
                    <h2 id="cert-course" style={{ fontSize: '32px', margin: '10px 0', color: '#1a2b4c', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        TALLER DE DIBUJO
                    </h2>

                    <p id="cert-topics" style={{ fontSize: '18px', fontStyle: 'italic', display: 'none' }}></p>
                    
                    <div id="cert-teacher-container" style={{ marginTop: '20px' }}>
                        <p style={{ fontSize: '20px', margin: '5px 0' }}>dictado por</p>
                        <p id="cert-teacher" style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0' }}>Emiliano Gallo</p>
                    </div>
                    
                    <div style={{ marginTop: '50px', fontSize: '16px' }}>
                        <p id="cert-date">Entregado el mes de diciembre de 2026</p>
                    </div>
                </div>
            </div>`;

c = c.replace(/\{\/\* ELEMENTO OCULTO PARA EL PDF - ETAPAS \/ NIVELES \(LANDSCAPE\) \*\/\}(.|\n)*?(?=\{\/\* ELEMENTO OCULTO PARA EL PDF - CONSTANCIA)/, newLandscapeTemplate + '\n\n            ');

fs.writeFileSync('app/components/Certificados.js', c, 'utf8');
