import { useState, useEffect } from 'react';

export interface User {
    name: string;
    usuario: string;
    role: string;
    rol: string;
    id: number;
}

interface UserProgressData {
    usuario: {
        id: number;
        nombre: string;
        rol: string;
    };
    progreso: any[];
    letrasCompletadas: any[];
    totalLetras: number;
    porcentajeCompletado: string;
    fechaUltimaActualizacion: string;
}

export const useAuthLogic = () => {
    const [user, setUser] = useState<User | null>(null);
    const [userProgress, setUserProgress] = useState<UserProgressData | null>(null);

    // Cargar datos del usuario desde localStorage al inicializar
    useEffect(() => {
        const userData = localStorage.getItem('user');
        const userProgressData = localStorage.getItem('userProgress');

        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                // Normalizar datos del usuario para compatibilidad
                const normalizedUser: User = {
                    name: parsedUser.usuario || parsedUser.name || 'Usuario',
                    usuario: parsedUser.usuario || parsedUser.name || 'Usuario',
                    role: parsedUser.rol || parsedUser.role || 'Invitado',
                    rol: parsedUser.rol || parsedUser.role || 'Invitado',
                    id: parsedUser.id || 0
                };
                setUser(normalizedUser);
            } catch (error) {
                console.error('Error al parsear datos del usuario:', error);
                // Limpiar localStorage si los datos están corruptos
                localStorage.removeItem('user');
            }
        }

        if (userProgressData) {
            try {
                const parsedProgress = JSON.parse(userProgressData);
                setUserProgress(parsedProgress);
            } catch (error) {
                console.error('Error al parsear progreso del usuario:', error);
                localStorage.removeItem('userProgress');
            }
        }
    }, []);

    const login = (userData: User) => {
        // Normalizar datos del usuario
        const normalizedUser: User = {
            name: userData.usuario || userData.name || 'Usuario',
            usuario: userData.usuario || userData.name || 'Usuario',
            role: userData.rol || userData.role || 'Invitado',
            rol: userData.rol || userData.role || 'Invitado',
            id: userData.id || 0
        };

        setUser(normalizedUser);

        // Guardar en localStorage
        localStorage.setItem('user', JSON.stringify(normalizedUser));
    };

    const logout = () => {
        setUser(null);
        setUserProgress(null);

        // Limpiar localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('userProgress');
        localStorage.removeItem('progresoLetras');
    };

    const updateUserProgress = (progressData: UserProgressData) => {
        setUserProgress(progressData);
        localStorage.setItem('userProgress', JSON.stringify(progressData));
    };

    const isAuthenticated = !!user;

    return {
        user,
        userProgress,
        isAuthenticated,
        login,
        logout,
        updateUserProgress,
    };
};