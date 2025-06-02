// src/components/AddCommentForm.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { Box, TextField, Button, CircularProgress } from '@mui/material';
import { useAuth } from '../AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

interface CommentData {
    id: number; text: string; createdAt: string;
    user: { id: number; name: string; pictureUrl?: string; };
}
interface AddCommentFormProps {
    targetId: number;
    targetType: 'question' | 'answer';
    onCommentAdded: (newComment: CommentData) => void;
    onCancel?: () => void; // Опциональный колбэк для отмены
}

const AddCommentForm: React.FC<AddCommentFormProps> = ({ targetId, targetType, onCommentAdded, onCancel }) => {
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth(); // Убрал login, т.к. ссылка на вход будет в CommentList

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!user) {
            setError("Нужно войти, чтобы комментировать.");
            return;
        }
         if (!text.trim()) {
            setError("Комментарий не может быть пустым.");
            return;
        }
        if (text.trim().length > 500) { // Добавим проверку максимальной длины
            setError("Комментарий слишком длинный (максимум 500 символов).");
            return;
        }

        setError(null);
        setIsSubmitting(true);

        const apiUrl = targetType === 'question'
            ? `${API_URL}/api/questions/${targetId}/comments`
            : `${API_URL}/api/answers/${targetId}/comments`;

        try {
            const response = await axios.post<CommentData>(apiUrl, { text: text.trim() }, { withCredentials: true });
            onCommentAdded(response.data);
            setText(''); // Очищаем поле
        } catch (err) {
            console.error("Ошибка добавления комментария:", err);
            let errorMessage = "Не удалось добавить комментарий.";
            if (axios.isAxiosError(err) && err.response?.data) {
                if(err.response.data.message) errorMessage = err.response.data.message;
                else if (typeof err.response.data === 'string') errorMessage = err.response.data;
                else if (err.response.data.errors?.Text) errorMessage = err.response.data.errors.Text.join(' ');
            } else if (axios.isAxiosError(err) && err.response?.status === 401) {
                errorMessage = "Сессия истекла. Пожалуйста, войдите снова.";
            }
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Этот компонент теперь будет рендериться только если user существует (проверка в CommentList)
    // Поэтому убираем отсюда проверку !user и ссылку на вход

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%'}}>
            <TextField
                fullWidth
                variant="outlined" // Стандартный вариант для соответствия теме
                size="small"
                placeholder="Напишите комментарий..."
                value={text}
                onChange={(e) => {
                    setText(e.target.value);
                    if(error) setError(null); // Сбрасываем ошибку при вводе
                }}
                disabled={isSubmitting}
                multiline
                minRows={2} // Сделаем минимум 2 строки для удобства
                maxRows={5}
                inputProps={{ maxLength: 500 }}
                error={!!error}
                helperText={error || `${500 - text.length} символов осталось`} // Показываем остаток символов
                sx={{ 
                    mb: 1,
                    '& .MuiOutlinedInput-root': { 
                        fontSize: '0.875rem',
                        // backgroundColor: theme.palette.background.paper, // Если нужен фон чуть отличный от родителя
                    } 
                }}
            />
            <Box sx={{display: 'flex', justifyContent: 'flex-end', gap: 1}}>
                {onCancel && (
                    <Button
                        size="small"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        variant="text" // Менее навязчивая кнопка отмены
                        color="inherit"
                        sx={{color: 'text.secondary'}}
                    >
                        Отмена
                    </Button>
                )}
                <Button
                    type="submit"
                    size="small"
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting || !text.trim() || text.trim().length > 500}
                >
                    {isSubmitting ? <CircularProgress size={18} color="inherit"/> : 'Отправить'}
                </Button>
            </Box>
        </Box>
    );
};

export default AddCommentForm;