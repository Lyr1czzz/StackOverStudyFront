import React, { useState } from 'react';
import axios from 'axios';
import { Box, TextField, Button, CircularProgress, Link, Typography } from '@mui/material';
import { useAuth } from '../AuthContext';

interface AddCommentFormProps {
    targetId: number; // ID вопроса ИЛИ ответа
    targetType: 'question' | 'answer';
    onCommentAdded: (newComment: any) => void; // Callback для добавления в список
}

const AddCommentForm: React.FC<AddCommentFormProps> = ({ targetId, targetType, onCommentAdded }) => {
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const handleSubmit = async () => {
        if (!user) {
            setError("Нужно войти, чтобы комментировать.");
            return;
        }
         if (!text.trim()) {
            return; // Не отправляем пустой коммент
        }

        setError(null);
        setIsSubmitting(true);

        const apiUrl = targetType === 'question'
            ? `https://localhost:7295/api/questions/${targetId}/comments`
            : `https://localhost:7295/api/answers/${targetId}/comments`;

        try {
            const response = await axios.post(apiUrl, { text }, { withCredentials: true });
            onCommentAdded(response.data);
            setText(''); // Очищаем поле
        } catch (err) {
            console.error("Ошибка добавления комментария:", err);
             setError("Не удалось добавить комментарий.");
             if (axios.isAxiosError(err) && err.response?.data?.message) {
                setError(err.response.data.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Если не авторизован, ничего не показываем или показываем ссылку на вход
    if (!user) {
         return (
             <Typography variant="caption" sx={{ display: 'block', mt: 1, px: 1 }}>
                 <Link component="button" onClick={() => useAuth().login()} sx={{ fontSize: 'inherit' }}>Войдите</Link>, чтобы добавить комментарий.
             </Typography>
         );
     }

    return (
        <Box sx={{ mt: 1, px: 1 }}>
            <TextField
                fullWidth
                variant="standard" // Компактный вид
                size="small"
                placeholder="Добавить комментарий..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isSubmitting}
                multiline // Позволяет переносить строку, но не растягивается сильно
                maxRows={3}
                inputProps={{ maxLength: 500 }}
                error={!!error}
                helperText={error}
            />
            <Button
                size="small"
                onClick={handleSubmit}
                disabled={isSubmitting || !text.trim()}
                sx={{ mt: 0.5, textTransform: 'none' }}
            >
                {isSubmitting ? <CircularProgress size={16} /> : 'Добавить'}
            </Button>
        </Box>
    );
};

export default AddCommentForm;