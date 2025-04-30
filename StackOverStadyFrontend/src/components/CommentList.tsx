import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Box, Typography, CircularProgress, Divider, Button } from '@mui/material';
import CommentItem from './CommentItem';
import AddCommentForm from './AddCommentForm';
import { useAuth } from '../AuthContext'; // Для проверки авторизации

// Интерфейс для DTO комментария (дублируем или импортируем)
interface CommentData {
    id: number; text: string; createdAt: string;
    user: { id: number; name: string; };
}

interface CommentListProps {
    targetId: number; // ID вопроса или ответа
    targetType: 'question' | 'answer';
}

const CommentList: React.FC<CommentListProps> = ({ targetId, targetType }) => {
    const [comments, setComments] = useState<CommentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false); // Показать/скрыть форму добавления
    const { user } = useAuth(); // Нужен для кнопки "Добавить комментарий"

    const apiUrl = targetType === 'question'
        ? `https://localhost:7295/api/questions/${targetId}/comments`
        : `https://localhost:7295/api/answers/${targetId}/comments`;

    // Загрузка комментариев
    const fetchComments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get<CommentData[]>(apiUrl);
            setComments(response.data);
        } catch (err) {
            console.error(`Ошибка загрузки комментариев для ${targetType} ${targetId}:`, err);
             setError("Не удалось загрузить комментарии.");
        } finally {
            setLoading(false);
        }
    }, [apiUrl, targetType, targetId]); // Зависимости useCallback

    useEffect(() => {
        fetchComments();
    }, [fetchComments]); // Вызываем при монтировании и изменении зависимостей

    // Добавление нового комментария в список
    const handleCommentAdded = (newComment: CommentData) => {
        setComments(prev => [...prev, newComment]);
        setShowForm(false); // Скрываем форму после добавления
    };

    return (
        <Box sx={{ mt: 1, backgroundColor: 'action.hover', borderRadius: 1 }}>
             <Divider /> {/* Линия перед комментариями */}
            {loading && <CircularProgress size={20} sx={{ display: 'block', mx: 'auto', my: 1 }} />}
            {error && <Typography variant="caption" color="error" sx={{ px: 1, py: 0.5 }}>{error}</Typography>}

            {!loading && !error && comments.map(comment => (
                <CommentItem key={comment.id} comment={comment} />
            ))}

             {!loading && !error && comments.length === 0 && !showForm && (
                 <Typography variant="caption" sx={{ display: 'block', px: 1, py: 0.5, color: 'text.disabled' }}>
                     Нет комментариев.
                 </Typography>
             )}

             {/* Форма добавления или кнопка "Добавить" */}
             {user && ( // Показываем форму/кнопку только авторизованным
                 showForm ? (
                     <AddCommentForm
                         targetId={targetId}
                         targetType={targetType}
                         onCommentAdded={handleCommentAdded}
                     />
                 ) : (
                     <Button
                         size="small"
                         onClick={() => setShowForm(true)}
                         sx={{ m: 0.5, textTransform: 'none', fontSize: '0.75rem' }}
                     >
                         Добавить комментарий
                     </Button>
                 )
             )}
        </Box>
    );
};

export default CommentList;