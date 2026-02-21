'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import UserAvatar, { AVATAR_OPTIONS } from '@/components/UserAvatar';
import styles from './page.module.css';

export default function PerfilPage() {
    const { user, login } = useAuth();
    const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar_id || 'gallo');
    const [customImage, setCustomImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(user?.avatar_url || null);
    const [saving, setSaving] = useState(false);

    if (!user) return <div className="section-padding text-center">Cargando...</div>;

    const handleAvatarSelect = (id) => {
        setSelectedAvatar(id);
        if (id !== 'custom') {
            setCustomImage(null);
            setPreviewUrl(null);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("La imagen es muy pesada (máx 5MB).");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomImage(reader.result);
                setPreviewUrl(reader.result);
                setSelectedAvatar('custom');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const body = {
                dni: user.dni,
                avatar_id: selectedAvatar,
                image: customImage // Solo si es custom y cambió
            };

            const res = await fetch('/api/v2/account/avatar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const result = await res.json();
            if (result.status === 'success') {
                // Actualizar contexto
                const updatedUser = {
                    ...user,
                    avatar_id: result.data.avatar_id,
                    avatar_url: result.data.avatar_url
                };
                login(updatedUser);
                alert("¡Perfil actualizado con éxito! 🐔✨");
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error(error);
            alert("Error al guardar: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="section-padding container">
            <h1 className="section-title text-center text-yellow">Mi Perfil</h1>
            <p className="text-center" style={{ marginBottom: '2rem' }}>Elige tu avatar para identificarte en la comunidad de Rooster.</p>

            <div className={styles.avatarSelectionContainer}>
                {/* Visualización Actual */}
                <div className={styles.currentAvatar}>
                    <UserAvatar
                        avatarId={selectedAvatar}
                        avatarUrl={previewUrl || user.avatar_url}
                        size={150}
                        className={styles.bigAvatar}
                    />
                    <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>Así te verán los demás</p>
                </div>

                {/* Grilla de Opciones */}
                <div className={styles.optionsGrid}>
                    {AVATAR_OPTIONS.map((opt) => (
                        <div
                            key={opt.id}
                            className={`${styles.optionItem} ${selectedAvatar === opt.id ? styles.selected : ''}`}
                            onClick={() => handleAvatarSelect(opt.id)}
                        >
                            <UserAvatar avatarId={opt.id} size={60} />
                            <span>{opt.label}</span>
                        </div>
                    ))}

                    {/* Opción Custom */}
                    <div
                        className={`${styles.optionItem} ${selectedAvatar === 'custom' ? styles.selected : ''}`}
                        onClick={() => document.getElementById('customUpload').click()}
                    >
                        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                            📸
                        </div>
                        <span>Subir Foto</span>
                        <input
                            id="customUpload"
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleImageChange}
                        />
                    </div>
                </div>

                <button
                    className="btn btn-primary"
                    style={{ marginTop: '2rem', padding: '12px 30px', fontSize: '1.2rem' }}
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </div>
    );
}
