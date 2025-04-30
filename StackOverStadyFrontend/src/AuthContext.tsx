import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Интерфейс для пользователя в контексте
interface AuthUser {
    id: number;
    name: string;
    email: string;
    pictureUrl: string;
    // Добавьте другие поля, если они возвращаются и нужны
}

// Тип контекста
interface AuthContextType {
    user: AuthUser | null;
    loading: boolean; // Флаг первоначальной загрузки/проверки пользователя
    login: () => void;
    logout: () => Promise<void>; // Функция выхода асинхронная
    refetchUser: () => Promise<void>; // Функция для принудительного обновления данных
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
    const [loading, setLoading] = useState(true); // Начинаем с true, т.к. нужно проверить пользователя

    // Функция для запроса данных пользователя
    const fetchUser = useCallback(async () => {
        console.log('[AuthContext] Запрос данных пользователя...');
        // Не ставим setLoading(true), так как начальное состояние уже true
        try {
            // Запрос к бэкенду (защищенному эндпоинту)
            const response = await axios.get<AuthUser>('https://localhost:7295/Auth/user', {
                withCredentials: true // Отправляем куки
            });

            // Проверяем, что данные пришли и содержат ID
            if (response.data && response.data.id) {
                setUser(response.data);
                console.log('[AuthContext] Пользователь успешно получен:', response.data);
            } else {
                console.warn('[AuthContext] Получены данные пользователя без ID. Сброс пользователя.');
                setUser(null);
            }
        } catch (error) {
            // Ошибки (401 Unauthorized, 404 Not Found, 500 Server Error и т.д.)
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                console.error(`[AuthContext] Ошибка при запросе пользователя (Статус: ${status || 'N/A'}):`, error.message);
                // Если 401, возможно, токен невалиден или отсутствует
            } else {
                console.error('[AuthContext] Неизвестная ошибка при запросе пользователя:', error);
            }
            setUser(null); // Сбрасываем пользователя при любой ошибке
        } finally {
            setLoading(false); // Завершаем первоначальную загрузку
            console.log('[AuthContext] Попытка запроса пользователя завершена. Загрузка:', false);
        }
    }, []); // useCallback с пустыми зависимостями

    // Выполняем запрос пользователя при первом монтировании провайдера
    useEffect(() => {
        fetchUser();
    }, [fetchUser]); // Зависимость от fetchUser (из useCallback)

    // Функция для инициирования входа через Google
    const login = () => {
        console.log('[AuthContext] Перенаправление на Google Login...');
        // Очищаем состояние перед редиректом (на всякий случай)
        setUser(null);
        setLoading(true); // Показываем загрузку на время редиректа
        window.location.href = 'https://localhost:7295/Auth/google-login';
    };

    // Асинхронная функция выхода
    const logout = async () => {
        console.log('[AuthContext] Попытка выхода...');
        // Можно установить loading=true для индикации
        try {
            // Отправляем запрос на бэкенд для удаления кук на сервере
            await axios.post('https://localhost:7295/Auth/logout', {}, { withCredentials: true });
            console.log('[AuthContext] Запрос на выход успешно отправлен.');
        } catch (error) {
            // Логируем ошибку, но всё равно выходим на клиенте
            if (axios.isAxiosError(error)) {
                console.error(`[AuthContext] Ошибка при запросе на выход (${error.response?.status}):`, error.message);
            } else {
                console.error('[AuthContext] Ошибка при запросе на выход:', error);
            }
        } finally {
            // Гарантированно сбрасываем пользователя и состояние загрузки
            setUser(null);
            setLoading(false); // Считаем процесс аутентификации завершенным (пользователя нет)
            console.log('[AuthContext] Пользователь сброшен на клиенте. Загрузка:', false);
            // Можно добавить редирект: navigate('/');
        }
    };

    // Функция для принудительного обновления данных пользователя
    const refetchUser = async () => {
        console.log('[AuthContext] Принудительное обновление данных пользователя...');
        setLoading(true); // Показываем загрузку
        await fetchUser(); // Вызываем основную функцию запроса
    };

    // Передаем состояние и функции в контекст
    const value = { user, loading, login, logout, refetchUser };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};