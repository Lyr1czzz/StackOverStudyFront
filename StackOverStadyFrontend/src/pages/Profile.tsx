import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom'; // Импортируем useParams и useNavigate
import { Container, Typography, CircularProgress, Box, Avatar, Alert, Button } from '@mui/material';
import { useAuth } from '../AuthContext'; // Импортируем useAuth для проверки, смотрим ли мы свой профиль

// Интерфейс для данных профиля (может приходить от обоих эндпоинтов)
// Добавляем опциональный email, так как он будет только у текущего пользователя
interface UserProfileData {
    id?: number; // ID может быть полезен
    name: string;
    email?: string; // Email показываем только для своего профиля
    pictureUrl: string;
    rating?: number; // Рейтинг из нового эндпоинта
}

const Profile = () => {
    // Получаем userId из URL, если он есть. Типизируем useParams
    const { userId } = useParams<{ userId?: string }>();
    const navigate = useNavigate(); // Для возможной переадресации
    const { user: loggedInUser } = useAuth(); // Получаем данные текущего залогиненного пользователя из контекста

    const [profileData, setProfileData] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Определяем, смотрим ли мы профиль залогиненного пользователя
    // Это true, если userId в URL не указан ИЛИ если userId совпадает с ID залогиненного пользователя
    // ВНИМАНИЕ: ID залогиненного пользователя нужно добавить в AuthContext!
    // Пока что упростим: isOwnProfile = !userId; (считаем свой профиль, только если нет ID в URL)
    // Более точная проверка потребует ID в loggedInUser
    const isOwnProfile = !userId; // <<< Упрощенная проверка

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setError(null);
            setProfileData(null); // Сбрасываем данные перед загрузкой

            // Определяем URL для запроса
            const apiUrl = userId
                ? `https://localhost:7295/api/Users/${userId}` // Новый эндпоинт для чужого профиля
                : 'https://localhost:7295/Auth/user';         // Старый эндпоинт для своего профиля

            // Определяем, нужны ли credentials (только для /Auth/user)
            const config = isOwnProfile ? { withCredentials: true } : {};

            try {
                console.log(`Fetching profile from: ${apiUrl}`);
                const response = await axios.get<UserProfileData>(apiUrl, config);
                setProfileData(response.data);
                console.log("Profile data loaded:", response.data);

            } catch (err: any) {
                console.error(`Ошибка загрузки профиля (${apiUrl}):`, err);
                 if (axios.isAxiosError(err)) {
                     const status = err.response?.status;
                     let message = err.message;
                     if (status === 404) {
                         message = "Пользователь не найден.";
                     } else {
                        message = err.response?.data?.message || err.response?.data || `Ошибка сервера (${status || 'N/A'})`;
                     }
                     setError(`Не удалось загрузить профиль: ${message}`);
                 } else {
                     setError('Произошла неизвестная ошибка при загрузке профиля.');
                 }
                 setProfileData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
        // Перезапускаем эффект, если изменился userId в URL
    }, [userId, isOwnProfile]); // Добавляем isOwnProfile в зависимости

    // --- Рендеринг ---

    if (loading) {
        return (
            <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="sm" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
                 {/* Можно добавить кнопку "Назад" или "На главную" */}
                 <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>На главную</Button>
            </Container>
        );
    }

    if (!profileData) {
        // Это состояние не должно возникать при нормальной работе, но на всякий случай
        return (
             <Container maxWidth="sm" sx={{ mt: 4 }}>
                 <Alert severity="warning">Данные профиля не загружены.</Alert>
            </Container>
        );
    }

    // Отображаем профиль
    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Box textAlign="center" display="flex" flexDirection="column" alignItems="center">
                <Avatar
                    src={profileData.pictureUrl}
                    alt={`Аватар ${profileData.name}`}
                    sx={{ width: 150, height: 150, mb: 3 }}
                    imgProps={{ referrerPolicy: "no-referrer" }}
                />
                <Typography variant="h4" gutterBottom>
                    {profileData.name}
                </Typography>

                {/* Показываем email ТОЛЬКО если это профиль текущего пользователя */}
                {isOwnProfile && profileData.email && (
                     <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                        {profileData.email}
                    </Typography>
                )}

                {/* Показываем рейтинг, если он есть в данных */}
                {profileData.rating !== undefined && (
                    <Typography variant="body1" color="text.secondary">
                        Рейтинг: {profileData.rating}
                    </Typography>
                )}

                {/* Здесь можно добавить отображение вопросов/ответов пользователя и т.д. */}

            </Box>
        </Container>
    );
};

export default Profile;