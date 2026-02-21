import Image from 'next/image';

// Mapeamos los IDs de avatar a rutas de imagen
const AVATAR_IMAGES = {
    gallo: '/avatars/gallo.png',
    gallina: '/avatars/gallina.png',
    hombre: '/avatars/hombre.png',
    mujer: '/avatars/mujer.png',
    nino: '/avatars/nino.png',
    nina: '/avatars/nina.png'
};

export default function UserAvatar({ avatarId, avatarUrl, size = 40, className = '' }) {
    const style = {
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#333',
        color: '#fff',
        border: '2px solid #555'
    };

    // Si es avatar personalizado (custom)
    if (avatarId === 'custom' && avatarUrl) {
        return (
            <div className={className} style={style}>
                <Image
                    src={avatarUrl}
                    alt="Avatar"
                    width={size}
                    height={size}
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
            </div>
        );
    }

    // Si es uno de los avatares predefinidos
    const avatarImage = AVATAR_IMAGES[avatarId] || AVATAR_IMAGES['gallo']; // Default fallback

    return (
        <div className={className} style={style}>
            <Image
                src={avatarImage}
                alt={`Avatar ${avatarId}`}
                width={size}
                height={size}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
        </div>
    );
}

// Exportamos también la lista de IDs para el selector
export const AVATAR_OPTIONS = [
    { id: 'gallo', label: 'Gallo' },
    { id: 'gallina', label: 'Gallina' },
    { id: 'hombre', label: 'Hombre' },
    { id: 'mujer', label: 'Mujer' },
    { id: 'nino', label: 'Niño' },
    { id: 'nina', label: 'Niña' }
];
