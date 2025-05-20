// src/pages/Profile.tsx
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container, Typography, CircularProgress, Box, Avatar, Alert, Button,
  Paper, Grid, Tooltip, useTheme, Divider, Skeleton
} from '@mui/material';
import { useAuth, AuthUser } from '../AuthContext'; // Импортируем AuthUser
import StarIcon from '@mui/icons-material/Star'; // Для рейтинга
// import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; // Пример иконки для ачивок

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7295';

// Интерфейс для данных профиля с бэкенда
interface UserProfileDataFromApi {
    id: number;
    name: string;
    email?: string; // Email может быть только у своего профиля с /Auth/user
    pictureUrl: string;
    rating: number; // Ожидаем рейтинг от /api/Users/{id}
    // Могут быть и другие поля, специфичные для /api/Users/{id}, например, дата регистрации
    // createdAt?: string; 
}

// Интерфейс для ачивки, как она приходит с бэкенда
export interface AchievementInfo {
  name: string;
  description: string;
  iconName: string; // Имя файла иконки или CSS класс
  code: string;
}

export interface UserAchievement {
  achievement: AchievementInfo;
  awardedAt: string; // Дата как строка
}

const Profile = () => {
    const { userId: userIdFromParams } = useParams<{ userId?: string }>();
    const navigate = useNavigate();
    const { user: loggedInUser, loading: authLoading } = useAuth(); // loggedInUser: AuthUser | null
    const theme = useTheme();

    const [profileData, setProfileData] = useState<UserProfileDataFromApi | null>(null);
    const [achievements, setAchievements] = useState<UserAchievement[]>([]);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingAchievements, setLoadingAchievements] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Определяем ID пользователя, чей профиль мы смотрим
    // Если userIdFromParams есть, то это чужой профиль (или свой, если ID совпадают)
    // Если userIdFromParams нет, то это профиль текущего залогиненного пользователя
    const targetUserId = userIdFromParams ? parseInt(userIdFromParams, 10) : loggedInUser?.id;
    
    // Определяем, является ли просматриваемый профиль профилем текущего залогиненного пользователя
    const isOwnProfile = loggedInUser !== null && targetUserId === loggedInUser.id;

    // Загрузка данных профиля
    const fetchProfile = useCallback(async () => {
        if (!targetUserId && !authLoading) { // Если ID не определен и загрузка AuthContext завершена
            setError("Не удалось определить пользователя для отображения профиля.");
            setLoadingProfile(false);
            if(!loggedInUser) navigate('/login'); // Если нет targetUserId и нет залогиненного пользователя, редирект на логин
            return;
        }
        if (!targetUserId && authLoading) return; // Ждем загрузки AuthContext если targetUserId не из params

        setLoadingProfile(true);
        setError(null);
        setProfileData(null);

        // Если это свой профиль и ID из URL не указан, используем /Auth/user
        // Иначе используем /api/Users/{targetUserId}
        const apiUrl = isOwnProfile && !userIdFromParams
            ? `${API_URL}/Auth/user`
            : `${API_URL}/api/Users/${targetUserId}`;
        
        const config = isOwnProfile && !userIdFromParams ? { withCredentials: true } : {};

        try {
            const response = await axios.get<UserProfileDataFromApi>(apiUrl, config);
            // Если данные пришли с /Auth/user, у них может не быть рейтинга или ID, если мы их не добавили в AuthUser
            // Но для /api/Users/{id} они должны быть.
            // Дополняем данными из loggedInUser, если это свой профиль и использовался /Auth/user
            let finalProfileData = response.data;
            if (isOwnProfile && loggedInUser) {
                finalProfileData = {
                    ...loggedInUser, // Берем все из loggedInUser (включая email, id)
                    ...response.data, // Перезаписываем тем, что пришло с /Auth/user (name, pictureUrl)
                                      // и добавляем рейтинг, если он пришел с /api/Users/{id}
                    rating: response.data.rating ?? loggedInUser.rating ?? 0, // Убеждаемся, что рейтинг есть
                };
            }
            setProfileData(finalProfileData);
        } catch (err) {
            console.error(`Ошибка загрузки профиля (${apiUrl}):`, err);
            let message = "Не удалось загрузить профиль.";
            if (axios.isAxiosError(err)) {
                const status = err.response?.status;
                if (status === 404) message = "Пользователь не найден.";
                else message = (err.response?.data as {message?: string})?.message || `Ошибка сервера (${status || 'N/A'}).`;
            }
            setError(message);
        } finally {
            setLoadingProfile(false);
        }
    }, [targetUserId, isOwnProfile, authLoading, loggedInUser, userIdFromParams, navigate]);

    // Загрузка ачивок
    const fetchAchievements = useCallback(async () => {
        if (!targetUserId) return; // Не грузим, если ID пользователя не определен

        setLoadingAchievements(true);
        try {
            const endpoint = (isOwnProfile) 
                             ? `${API_URL}/api/Users/me/achievements` 
                             : `${API_URL}/api/Users/${targetUserId}/achievements`;
            const response = await axios.get<UserAchievement[]>(endpoint, { withCredentials: true });
            setAchievements(response.data);
        } catch (error) {
            console.error("Error fetching achievements:", error);
            // Ошибку загрузки ачивок можно не показывать так критично
        } finally {
            setLoadingAchievements(false);
        }
    }, [targetUserId, isOwnProfile]);

    useEffect(() => {
        fetchProfile();
        fetchAchievements();
    }, [fetchProfile, fetchAchievements]); // Зависимости уже внутри useCallback

    if (authLoading || loadingProfile) { // Показываем общую загрузку, пока определяется пользователь
        return (
            <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 128px)', textAlign: 'center', py: 5 }}>
                <CircularProgress sx={{mb: 2}}/>
                <Typography>Загрузка профиля...</Typography>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
                <Alert severity="error" sx={{mb: 2}}>{error}</Alert>
                <Button onClick={() => navigate(-1)} sx={{ mr: 1 }}>Назад</Button>
                <Button variant="contained" onClick={() => navigate('/')}>На главную</Button>
            </Container>
        );
    }

    if (!profileData) {
        return (
             <Container maxWidth="sm" sx={{ mt: 4 }}>
                 <Alert severity="warning">Данные профиля не доступны.</Alert>
            </Container>
        );
    }
    
    return (
        <Container maxWidth="md" sx={{ mt: 0, mb: 4 }}> {/* mt:0 т.к. отступ сверху уже есть от App.tsx */}
            <Paper sx={{ p: {xs: 2, sm: 3, md: 4}, display: 'flex', flexDirection: {xs: 'column', sm: 'row'}, alignItems: {xs: 'center', sm: 'flex-start'}, gap: {xs: 3, sm: 4} }}>
                <Avatar
                    src={profileData.pictureUrl}
                    alt={`Аватар ${profileData.name}`}
                    sx={{ 
                        width: {xs: 100, sm: 120, md: 150}, 
                        height: {xs: 100, sm: 120, md: 150}, 
                        mb: {xs: 2, sm: 0},
                        boxShadow: theme.shadows[3]
                    }}
                    imgProps={{ referrerPolicy: "no-referrer" }}
                />
                <Box sx={{flexGrow: 1, textAlign: {xs: 'center', sm: 'left'}}}>
                    <Typography variant="h4" component="h1" gutterBottom sx={{wordBreak: 'break-word'}}>
                        {profileData.name}
                    </Typography>

                    {isOwnProfile && profileData.email && (
                         <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                            {profileData.email}
                        </Typography>
                    )}

                    {profileData.rating !== undefined && (
                        <Box sx={{display: 'flex', alignItems: 'center', justifyContent: {xs:'center', sm:'flex-start'}, color: 'text.secondary', mb: 2}}>
                            <StarIcon sx={{ color: 'warning.main', mr: 0.5, fontSize: '1.2rem' }} />
                            <Typography variant="body1">
                                Рейтинг: <strong>{profileData.rating}</strong>
                            </Typography>
                        </Box>
                    )}

                    {/* Если это свой профиль, можно добавить кнопку редактирования */}
                    {isOwnProfile && (
                        <Button 
                            variant="outlined" 
                            size="small" 
                            // onClick={() => navigate('/profile/edit')} // Пример
                            sx={{mb: 2}}
                            disabled // Пока нет функционала редактирования
                        >
                            Редактировать профиль
                        </Button>
                    )}
                </Box>
            </Paper>
            
            <Box sx={{ mt: 4 }}>
                <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2 }}>
                    Достижения
                </Typography>
                {loadingAchievements ? (
                    <Grid container spacing={2}>
                        {[...Array(3)].map((_, index) => ( // Скелетоны для ачивок
                            <Grid item xs={6} sm={4} md={3} key={index}>
                                <Paper sx={{ p: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: 120}}>
                                    <Skeleton variant="rectangular" width={48} height={48} sx={{mb:1}} />
                                    <Skeleton variant="text" width="80%" />
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                ) : achievements.length > 0 ? (
                    <Grid container spacing={2}>
                        {achievements.map(ua => (
                            <Grid item xs={6} sm={4} md={3} key={ua.achievement.code}>
                                <Tooltip 
                                    title={
                                        <Box>
                                            <Typography variant="subtitle2" gutterBottom>{ua.achievement.name}</Typography>
                                            <Typography variant="caption">{ua.achievement.description}</Typography>
                                            <Typography variant="caption" display="block" sx={{mt:0.5, color: 'grey.400'}}>
                                                Получено: {new Date(ua.awardedAt).toLocaleDateString('ru-RU')}
                                            </Typography>
                                        </Box>
                                    }
                                    arrow
                                    placement="top"
                                >
                                    <Paper 
                                        sx={{ 
                                            p: {xs: 1, sm: 1.5}, 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            alignItems: 'center', 
                                            textAlign: 'center',
                                            height: '100%', // Чтобы карточки были одинаковой высоты
                                            justifyContent: 'center',
                                            minHeight: 110, // Минимальная высота
                                        }}
                                    >
                                        {/* TODO: Заменить на реальную иконку по ua.achievement.iconName */}
                                        <Typography variant="h3" component="div" sx={{mb: 0.5, lineHeight: 1}}>
                                           {ua.achievement.iconName === "REGISTRATION" ? "🎉" : 
                                            ua.achievement.iconName === "FIRST_QUESTION" ? "❓" :
                                            ua.achievement.iconName === "FIRST_ANSWER" ? "💡" :
                                            ua.achievement.iconName === "FIRST_COMMENT" ? "💬" :
                                            ua.achievement.iconName === "FIRST_ACCEPTED_ANSWER" ? "🏆" : "🌟"}
                                        </Typography>
                                        <Typography variant="caption" sx={{fontWeight: 500, lineHeight: 1.2}}>
                                            {ua.achievement.name}
                                        </Typography>
                                    </Paper>
                                </Tooltip>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Typography color="text.secondary" sx={{fontStyle: 'italic'}}>
                        У этого пользователя пока нет достижений.
                    </Typography>
                )}
            </Box>

            {/* Здесь можно добавить секции для вопросов пользователя, ответов и т.д. */}
            {/* 
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" component="h2" gutterBottom>Вопросы пользователя</Typography>
              { // Логика загрузки и отображения вопросов }
            </Box>
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" component="h2" gutterBottom>Ответы пользователя</Typography>
              { // Логика загрузки и отображения ответов }
            </Box>
            */}

        </Container>
    );
};

export default Profile;