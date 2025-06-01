// src/pages/Profile.tsx
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Container, Typography, CircularProgress, Box, Avatar, Alert, Button,
  Paper, Tooltip, useTheme, Skeleton // Убрал Grid
} from '@mui/material';
import { useAuth } from '../AuthContext';
import StarIcon from '@mui/icons-material/Star';
import { useNavigate, useParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7295';

interface UserProfileDataFromApi {
    id: number;
    name: string;
    email?: string;
    pictureUrl: string;
    rating: number;
}

export interface AchievementInfo {
  name: string;
  description: string;
  iconName: string;
  code: string;
}

export interface UserAchievement {
  achievement: AchievementInfo;
  awardedAt: string;
}

const Profile = () => {
    const { userId: userIdFromParams } = useParams<{ userId?: string }>();
    const navigate = useNavigate();
    const { user: loggedInUser, loading: authLoading } = useAuth();
    const theme = useTheme();

    const [profileData, setProfileData] = useState<UserProfileDataFromApi | null>(null);
    const [achievements, setAchievements] = useState<UserAchievement[]>([]);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingAchievements, setLoadingAchievements] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const targetUserId = userIdFromParams ? parseInt(userIdFromParams, 10) : loggedInUser?.id;
    const isOwnProfile = loggedInUser !== null && targetUserId === loggedInUser.id;

    const fetchProfile = useCallback(async () => {
        if (!targetUserId && !authLoading) {
            setError("Не удалось определить пользователя для отображения профиля.");
            setLoadingProfile(false);
            if(!loggedInUser) navigate('/login');
            return;
        }
        if (!targetUserId && authLoading) return;

        setLoadingProfile(true);
        setError(null);
        setProfileData(null);

        const apiUrl = isOwnProfile && !userIdFromParams
            ? `${API_URL}/Auth/user`
            : `${API_URL}/api/Users/${targetUserId}`;
        
        const config = isOwnProfile && !userIdFromParams ? { withCredentials: true } : {};

        try {
            const response = await axios.get<UserProfileDataFromApi>(apiUrl, config);
            let finalProfileData = response.data;
            if (isOwnProfile && loggedInUser) {
                finalProfileData = {
                    ...loggedInUser, 
                    ...response.data, 
                    rating: response.data.rating ?? loggedInUser.rating ?? 0,
                    id: loggedInUser.id,
                    email: loggedInUser.email,
                };
            } else if (response.data && !response.data.id && targetUserId) {
                finalProfileData.id = targetUserId;
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

    const fetchAchievements = useCallback(async () => {
        if (!targetUserId) return;
        setLoadingAchievements(true);
        try {
            const endpoint = (isOwnProfile) 
                             ? `${API_URL}/api/Users/me/achievements` 
                             : `${API_URL}/api/Users/${targetUserId}/achievements`;
            const response = await axios.get<UserAchievement[]>(endpoint, { withCredentials: true });
            setAchievements(response.data);
        } catch (error) {
            console.error("Error fetching achievements:", error);
        } finally {
            setLoadingAchievements(false);
        }
    }, [targetUserId, isOwnProfile]);

    useEffect(() => {
        if (targetUserId) {
            fetchProfile();
            fetchAchievements();
        } else if (!authLoading && !loggedInUser && !userIdFromParams) {
             setError("Профиль не указан.");
             setLoadingProfile(false);
             setLoadingAchievements(false);
        }
    }, [targetUserId, fetchProfile, fetchAchievements, authLoading, loggedInUser, userIdFromParams]);

    if (authLoading || loadingProfile) {
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
                 <Alert severity="warning">Данные профиля не доступны. Возможно, такой пользователь не существует или у вас нет прав на просмотр.</Alert>
            </Container>
        );
    }
    
    return (
        <Container maxWidth="md" sx={{ mt: 0, mb: 4 }}>
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
                    {isOwnProfile && (
                        <Button variant="outlined" size="small" sx={{mb: 2}} disabled > Редактировать профиль </Button>
                    )}
                </Box>
            </Paper>
            
            <Box sx={{ mt: 4 }}>
                <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2 }}>
                    Достижения
                </Typography>
                {loadingAchievements ? (
                    // Используем Flexbox для скелетонов
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {[...Array(3)].map((_, index) => (
                            <Paper 
                                key={index}
                                sx={{ 
                                    p: 1.5, 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    textAlign: 'center', 
                                    width: {xs: 'calc(50% - 8px)', sm: 'calc(33.333% - 11px)', md: 'calc(25% - 12px)'}, // Адаптивная ширина для 2, 3, 4 колонок
                                    minHeight: 120,
                                    boxSizing: 'border-box'
                                }}
                            >
                                <Skeleton variant="rectangular" width={48} height={48} sx={{mb:1}} />
                                <Skeleton variant="text" width="80%" />
                            </Paper>
                        ))}
                    </Box>
                ) : achievements.length > 0 ? (
                    // Используем Flexbox для отображения ачивок
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {achievements.map(ua => (
                            <Tooltip 
                                key={ua.achievement.code}
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
                                        width: {xs: 'calc(50% - 8px)', sm: 'calc(33.333% - 11px)', md: 'calc(25% - 12px)'}, // Адаптивная ширина
                                        minHeight: 110,
                                        justifyContent: 'center',
                                        boxSizing: 'border-box'
                                    }}
                                >
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
                        ))}
                    </Box>
                ) : (
                    <Typography color="text.secondary" sx={{fontStyle: 'italic'}}>
                        У этого пользователя пока нет достижений.
                    </Typography>
                )}
            </Box>
        </Container>
    );
};

export default Profile;