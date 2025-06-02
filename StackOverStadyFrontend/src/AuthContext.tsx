// src/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Интерфейс для пользователя в контексте
export interface AuthUser { // <--- ДОБАВЬ export ЗДЕСЬ
    id: number;
    name: string;
    email: string;
    pictureUrl?: string;
    role: string;
    rating: number;
}

// Тип контекста
interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    login: () => void;
    logout: () => Promise<void>;
    refetchUser: () => Promise<void>;
}

// Создание контекста
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Хук для удобного использования контекста
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth должен использоваться внутри AuthProvider');
    }
    return context;
};

// Компонент-провайдер
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        // console.log('[AuthContext] Запрос данных пользователя...');
        try {
            const response = await axios.get<AuthUser>(`${API_BASE_URL}/Auth/user`, {
                withCredentials: true
            });
            if (response.data && response.data.id) {
                // Убедимся, что роль есть, или установим дефолтную
                const userData = { ...response.data, role: response.data.role || 'User' };
                setUser(userData);
                console.log('[AuthContext] Пользователь успешно получен:', userData);
            } else {
                // console.warn('[AuthContext] Получены данные пользователя без ID или данных. Сброс пользователя.');
                setUser(null);
            }
        } catch (error) {
            // if (axios.isAxiosError(error) && error.response?.status !== 401) {
            //     console.error(`[AuthContext] Ошибка при запросе пользователя:`, error.message);
            // }
            setUser(null);
        } finally {
            setLoading(false);
            // console.log('[AuthContext] Попытка запроса пользователя завершена.');
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const login = () => {
        console.log('[AuthContext] Перенаправление на Google Login...');
        setUser(null);
        setLoading(true);
        window.location.href = `${API_BASE_URL}/Auth/google-login`;
    };

    const logout = async () => {
        // console.log('[AuthContext] Попытка выхода...');
        try {
            await axios.post(`${API_BASE_URL}/Auth/logout`, {}, { withCredentials: true });
            // console.log('[AuthContext] Запрос на выход успешно отправлен.');
        } catch (error) {
            // if (axios.isAxiosError(error)) {
            //     console.error(`[AuthContext] Ошибка при запросе на выход (${error.response?.status}):`, error.message);
            // } else {
            //     console.error('[AuthContext] Ошибка при запросе на выход:', error);
            // }
        } finally {
            setUser(null);
            setLoading(false);
            // console.log('[AuthContext] Пользователь сброшен на клиенте.');
        }
    };

    const refetchUser = async () => {
        // console.log('[AuthContext] Принудительное обновление данных пользователя...');
        setLoading(true);
        await fetchUser();
    };

    const value = { user, loading, login, logout, refetchUser };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};