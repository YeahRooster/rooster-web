import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixCategories() { 
    // We will update the submissions for this specific challenge to 'menores', EXCEPT for Samuel and Valentino.
    // Let's get all submissions
    const { data: submissions, error: subErr } = await supabaseAdmin.from('challenge_submissions').select('*');
    if (subErr) {
        console.error(subErr);
        return;
    }
    
    const adults = ['49271493', '53804618']; // Samuel and Valentino
    
    for (const sub of submissions) {
        if (!adults.includes(sub.alumno_dni) && sub.categoria === 'adultos') {
            console.log(`Fixing ${sub.alumno_nombre} (DNI ${sub.alumno_dni}) to menores...`);
            await supabaseAdmin.from('challenge_submissions').update({ categoria: 'menores' }).eq('id', sub.id);
        }
    }
    console.log("Done.");
} 
fixCategories();
