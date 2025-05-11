// src/components/CommentList.tsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Box, Typography, CircularProgress, Divider, Button, useTheme, Link as MuiLink, Alert } from '@mui/material';
import CommentItem from './CommentItem';
import AddCommentForm from './AddCommentForm';
import { useAuth } from '../AuthContext';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'; // Иконка для кнопки "Добавить"

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7295/api';

interface CommentData {
    id: number; text: string; createdAt: string;
    user: { id: number; name: string; pictureUrl?: string; };
}

interface CommentListProps {
    targetId: number;
    targetType: 'question' | 'answer';
}

const CommentList: React.FC<CommentListProps> = ({ targetId, targetType }) => {
    const [comments, setComments] = useState<CommentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false); // Для отображения формы добавления
    const { user } = useAuth();
    const theme = useTheme();
    const location = useLocation();

    const apiUrl = targetType === 'question'
        ? `${API_URL}/questions/${targetId}/comments`
        : `${API_URL}/answers/${targetId}/comments`;

    const fetchComments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get<CommentData[]>(apiUrl, { withCredentials: true });
            setComments(response.data.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
        } catch (err) {
            console.error(`Ошибка загрузки комментариев для ${targetType} ${targetId}:`, err);
            setError("Не удалось загрузить комментарии.");
        } finally {
            setLoading(false);
        }
    }, [apiUrl, targetType, targetId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleCommentAdded = (newComment: CommentData) => {
        setComments(prev => [...prev, newComment].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
        setShowAddForm(false); // Скрываем форму после успешного добавления
    };

    const handleCancelAddForm = () => {
        setShowAddForm(false);
    };

    return (
        <Box sx={{ 
            mt: 2, 
            // backgroundColor: theme.palette.action.hover, // Можно оставить, если нравится легкий фон
            // borderRadius: theme.shape.borderRadius / 1.5, // Скругление из темы
            // border: `1px solid ${theme.palette.divider}`, // Рамка из темы
            // overflow: 'hidden' // Не всегда нужно, если нет фона, который может обрезаться
        }}>
            {/* Заголовок секции комментариев, если они есть или можно добавить */}
            {(comments.length > 0 || user) && (
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.5, fontWeight: 500 }}>
                    Комментарии ({comments.length})
                </Typography>
            )}
            
            {/* Разделитель перед списком или формой, если есть что-то выше */}
            {(comments.length > 0 || user) && <Divider sx={{mb: comments.length > 0 ? 0 : 1}} />} 

            {loading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />}
            {error && <Alert severity="error" sx={{my:1, fontSize: '0.8rem'}}>{error}</Alert>}

            {!loading && !error && comments.length > 0 && (
                <Box sx={{ maxHeight: '300px', overflowY: 'auto', // Ограничение высоты и скролл для списка
                     '&::-webkit-scrollbar': { width: '5px' },
                     '&::-webkit-scrollbar-thumb': { backgroundColor: theme.palette.action.disabled, borderRadius: '3px' }
                }}>
                    {comments.map(comment => (
                        <CommentItem key={comment.id} comment={comment} />
                    ))}
                </Box>
            )}

            {!loading && !error && comments.length === 0 && !showAddForm && !user && (
                 <Typography variant="caption" sx={{ display: 'block', py: 1, color: 'text.disabled', textAlign: 'center' }}>
                     Комментариев пока нет.
                 </Typography>
             )}
            
            {/* Секция добавления комментария */}
            {user && ( // Показываем, только если пользователь авторизован
                showAddForm ? (
                    <Box sx={{pt: comments.length > 0 ? 1.5 : 0.5, mt: comments.length > 0 ? 1 : 0, ...(comments.length > 0 && {borderTop: 1, borderColor: 'divider'})}}>
                        <AddCommentForm
                            targetId={targetId}
                            targetType={targetType}
                            onCommentAdded={handleCommentAdded}
                            onCancel={handleCancelAddForm}
                        />
                    </Box>
                ) : (
                    <Box sx={{ pt: 1, ...(comments.length > 0 && {borderTop: 1, borderColor: 'divider'}) }}>
                        <Button
                            size="small"
                            onClick={() => setShowAddForm(true)}
                            startIcon={<AddCircleOutlineIcon fontSize="small"/>}
                            sx={{ 
                                color: 'text.secondary',
                                fontWeight: 400,
                                fontSize: '0.8rem',
                                '&:hover': { bgcolor: theme.palette.action.hover }
                            }}
                            variant="text"
                        >
                            Добавить комментарий
                        </Button>
                    </Box>
                )
            )}
            {!user && ( // Если пользователь не авторизован, предлагаем войти
                 <Typography variant="caption" sx={{ display: 'block', py: 1, color: 'text.disabled', textAlign: 'left', ...(comments.length > 0 && {borderTop: 1, borderColor: 'divider', mt: 1}) }}>
                     <MuiLink component={RouterLink} to="/login" state={{ from: location }} sx={{fontWeight: 'medium'}}>Войдите</MuiLink>, чтобы оставить комментарий.
                 </Typography>
            )}
        </Box>
    );
};

export default CommentList;