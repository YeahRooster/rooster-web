const fs = require('fs'); 
let c = fs.readFileSync('app/components/Certificados.js', 'utf8'); 

c = c.replace("certificateRef.current.style.display = 'block';", `const isFormal = (type === 'regularity' || type === 'custom');
            certificateRef.current.style.backgroundColor = isFormal ? '#ffffff' : '#fff4cc';
            certificateRef.current.style.border = isFormal ? '20px solid #f3f4f6' : '30px solid #0d1b2a';
            certificateRef.current.style.padding = isFormal ? '80px 100px' : '60px';
            certificateRef.current.style.textAlign = isFormal ? 'left' : 'center';
            certificateRef.current.style.color = isFormal ? '#1f2937' : '#0d1b2a';

            const logoImg = document.getElementById('cert-logo');
            if (logoImg) {
                logoImg.style.maxWidth = isFormal ? '150px' : '400px';
                logoImg.style.margin = isFormal ? '0 0 60px 0' : '0 auto';
                logoImg.style.display = 'block';
            }

            const titleElStyles = document.getElementById('cert-title');
            if (titleElStyles) {
                titleElStyles.style.fontSize = isFormal ? '20px' : '32px';
                titleElStyles.style.color = isFormal ? '#6b7280' : '#0d1b2a';
            }
            
            const nameElStyles = document.getElementById('cert-name');
            if (nameElStyles) {
                nameElStyles.style.fontSize = isFormal ? '36px' : '48px';
            }

            const teacherContainer = document.getElementById('cert-teacher-container');
            if (teacherContainer) {
                teacherContainer.style.textAlign = isFormal ? 'left' : 'center';
                teacherContainer.style.marginTop = isFormal ? '60px' : 'auto';
            }

            certificateRef.current.style.display = 'block';`);

c = c.replace('<img src="/images/logo_espacio_arte.jpg" alt="Logo"', '<img id="cert-logo" src="/images/logo_espacio_arte.jpg" alt="Logo"');
c = c.replace('<h2 style={{ fontSize: \'48px\', margin: \'10px 0\', color: \'#0d1b2a\', fontWeight: \'bold\' }}>', '<h2 id="cert-name" style={{ fontSize: \'48px\', margin: \'10px 0\', color: \'#0d1b2a\', fontWeight: \'bold\' }}>');
c = c.replace('<div style={{ marginTop: \'auto\', paddingTop: \'40px\' }}>', '<div id="cert-teacher-container" style={{ marginTop: \'auto\', paddingTop: \'40px\' }}>');


fs.writeFileSync('app/components/Certificados.js', c, 'utf8');
