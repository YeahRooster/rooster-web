'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('rooster_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('rooster_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('rooster_user');
        window.location.href = '/';
    };

    const refreshUser = async () => {
        if (!user || !user.dni || user.role !== 'student') return;
        try {
            const res = await fetch(`/api/v2/student/sync?dni=${user.dni}`);
            const data = await res.json();
            if (data.status === 'success') {
                const updatedUser = { ...data.user, role: 'student' };
                setUser(updatedUser);
                localStorage.setItem('rooster_user', JSON.stringify(updatedUser));
            }
        } catch (e) {
            console.error("Error refreshing user", e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
