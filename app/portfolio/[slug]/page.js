import { supabaseAdmin } from '@/config/supabaseAdmin';
import styles from './page.module.css';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Head from 'next/head';

export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    const { slug } = resolvedParams;
    const { data: alumno } = await supabaseAdmin.from('alumnos').select('nombre').eq('slug', slug).single();
    
    if (!alumno) {
        return { title: 'Portafolio no encontrado | Rooster' };
    }
    
    return {
        title: `Portafolio de ${alumno.nombre} | Rooster`,
        description: `Mira las obras y medallas de ${alumno.nombre} en Rooster.`,
    };
}

export default async function PortfolioPage({ params }) {
    const resolvedParams = await params;
    const { slug } = resolvedParams;
    
    // Fetch alumno
    const { data: alumno, error: alumnoError } = await supabaseAdmin
        .from('alumnos')
        .select('*')
        .eq('slug', slug)
        .single();
        
    if (alumnoError || !alumno) {
        notFound();
    }
    
    // Fetch submissions
    const { data: submissions, error: subError } = await supabaseAdmin
        .from('challenge_submissions')
        .select(`
            *,
            challenges(id, titulo)
        `)
        .eq('alumno_dni', alumno.dni)
        .order('created_at', { ascending: false });
        
    // Fetch obras de la galería (social_posts)
    const { data: galleryPosts, error: galError } = await supabaseAdmin
        .from('social_posts')
        .select('*')
        .eq('alumno_dni', alumno.dni)
        .eq('status', 'active')
        .order('fecha_creacion', { ascending: false });

    if (subError) console.error("Error fetching submissions:", subError);
    if (galError) console.error("Error fetching gallery:", galError);

    // Consolidar obras de desafíos y galería
    const allWorks = [];
    
    if (submissions) {
        submissions.forEach(sub => {
            allWorks.push({
                id: `chal_${sub.id}`,
                image_url: sub.imagen_url, // changed
                titulo: sub.challenges?.titulo || 'Desafío', // changed
                descripcion: sub.bio, // changed
                badge: `Desafío: ${sub.challenges?.titulo}`,
                created_at: sub.created_at
            });
        });
    }
    
    if (galleryPosts) {
        galleryPosts.forEach(post => {
            allWorks.push({
                id: `gal_${post.id}`,
                image_url: post.imagen_url, // changed
                titulo: post.titulo || 'Obra de Galería',
                descripcion: post.descripcion,
                badge: 'Galería',
                created_at: post.fecha_creacion || post.created_at // changed
            });
        });
    }
    
    // Sort by newest
    allWorks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Fetch Medals directly from challenges table
    const { data: wonChallengesList } = await supabaseAdmin
        .from('challenges')
        .select('*')
        .or(`ganador_dni.eq.${alumno.dni},ganador_menores_dni.eq.${alumno.dni}`);

    const wonChallenges = wonChallengesList || [];
    
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{alumno.nombre}</h1>
                <p className={styles.subtitle}>Portafolio Artístico</p>
            </div>
            
            {wonChallenges.length > 0 && (
                <div>
                    <h2 className={styles.sectionTitle}>🏆 Medallas Obtenidas</h2>
                    <div className={styles.medalsGrid}>
                        {wonChallenges.map(challenge => (
                            <div key={challenge.id} className={styles.medalCard}>
                                <div className={styles.medalIcon}>🥇</div>
                                <div className={styles.medalTitle}>
                                    {challenge.titulo}
                                </div>
                                <div className={styles.medalDate}>
                                    {new Date(challenge.fecha_inicio).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div>
                <h2 className={styles.sectionTitle}>🎨 Obras de Arte</h2>
                {allWorks.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>Todavía no hay obras en este portafolio.</p>
                    </div>
                ) : (
                    <div className={styles.galleryGrid}>
                        {allWorks.map(work => (
                            <div key={work.id} className={styles.galleryItem}>
                                <div className={styles.imageContainer}>
                                    <img 
                                        src={work.image_url} 
                                        alt={work.titulo}
                                        className={styles.image}
                                    />
                                </div>
                                <div className={styles.itemInfo}>
                                    <span className={styles.badge}>
                                        {work.badge}
                                    </span>
                                    <div className={styles.itemTitle}>{work.titulo}</div>
                                    {work.descripcion && (
                                        <div className={styles.itemDesc}>{work.descripcion}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
