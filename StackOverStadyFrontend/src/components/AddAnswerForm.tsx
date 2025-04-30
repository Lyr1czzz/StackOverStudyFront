import React, { useState } from 'react';
import axios from 'axios';
import { Box, TextField, Button, CircularProgress, Alert, Typography, Link } from '@mui/material';
import { useAuth } from '../AuthContext'; // Для проверки авторизации

interface AddAnswerFormProps {
    questionId: number;
    onAnswerAdded: (newAnswer: any) => void; // Callback для обновления списка ответов на странице
}

const AddAnswerForm: React.FC<AddAnswerFormProps> = ({ questionId, onAnswerAdded }) => {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth(); // Проверяем, вошел ли пользователь

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            setError("Нужно войти, чтобы оставить ответ.");
            return;
        }
        if (!content.trim() || content.trim().length < 10) {
             setError("Ответ должен содержать не менее 10 символов.");
             return;
         }

        setError(null);
        setIsSubmitting(true);

        const answerData = { content };

        try {
            const response = await axios.post(
                `https://localhost:7295/api/Questions/${questionId}/answers`,
                answerData,
                { withCredentials: true }
            );
            console.log("Ответ успешно добавлен:", response.data);
            onAnswerAdded(response.data); // Передаем новый ответ наверх
            setContent(''); // Очищаем форму
        } catch (err) {
            console.error("Ошибка добавления ответа:", err);
            let errorMessage = "Не удалось добавить ответ.";
            if (axios.isAxiosError(err)) {
                errorMessage = `Ошибка ${err.response?.status || ''}: ${err.response?.data?.message || err.message}`;
            }
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Не показываем форму, если пользователь не вошел
    if (!user) {
        return (
             <Typography variant="body1" sx={{ mt: 3, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
                Чтобы оставить ответ, пожалуйста, <Link component="button" onClick={() => useAuth().login()}>войдите</Link>.
            </Typography>
        );
    }


    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>Ваш ответ</Typography>
            <form onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    multiline
                    rows={6}
                    label="Напишите ваш ответ здесь..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    margin="normal"
                    disabled={isSubmitting}
                    helperText="Подробно опишите решение или дайте полезный совет (мин. 10 символов)."
                />
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting || !content.trim() || content.trim().length < 10}
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {isSubmitting ? 'Отправка...' : 'Опубликовать ответ'}
                </Button>
            </form>
        </Box>
    );
};

export default AddAnswerForm;