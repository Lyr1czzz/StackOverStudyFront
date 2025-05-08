// src/components/AddAnswerForm.tsx
import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  Typography,
  Link as MuiLink,
  FormControl,
  FormHelperText,
  FormLabel,
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import RichTextEditor from './RichTextEditor';
import { AnswerDto } from '../pages/QuestionDetailPage'; // Убедитесь, что этот путь и интерфейс корректны

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7295/api';

interface AddAnswerFormProps {
    questionId: number;
    onAnswerAdded: (newAnswer: AnswerDto) => void;
}

const AddAnswerForm: React.FC<AddAnswerFormProps> = ({ questionId, onAnswerAdded }) => {
    const [content, setContent] = useState('');
    const [contentError, setContentError] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const { user } = useAuth();
    const location = useLocation();

    const handleContentChange = (value: string) => {
      setContent(value);
      const textOnly = value.replace(/<[^>]*>?/gm, '');
      if (textOnly.trim().length >= 10 && contentError) {
        setContentError(null);
      }
    };

    const validateForm = (): boolean => {
        setContentError(null);
        setSubmitError(null);
        const textOnlyContent = content.replace(/<[^>]*>?/gm, '');
        if (!textOnlyContent.trim() || textOnlyContent.trim().length < 10) {
             setContentError("Ответ должен содержать не менее 10 видимых символов.");
             return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            setSubmitError("Нужно войти, чтобы оставить ответ.");
            return;
        }
        if (!validateForm()) {
            setSubmitError("Пожалуйста, исправьте ошибки в форме.");
            return;
        }

        setIsSubmitting(true);
        const answerData = { content };

        try {
            const response = await axios.post<AnswerDto>(
                `${API_URL}/Questions/${questionId}/answers`,
                answerData,
                { withCredentials: true }
            );
            onAnswerAdded(response.data);
            setContent('');
        } catch (err) {
            console.error("Ошибка добавления ответа:", err);
            let errorMessage = "Не удалось добавить ответ.";
             if (axios.isAxiosError(err)) {
                if (err.response?.status === 401) {
                    errorMessage = "Сессия истекла или вы не авторизованы. Пожалуйста, войдите снова."
                } else if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response?.data?.errors) {
                     const messages = Object.values(err.response.data.errors).flat().join(' ');
                     errorMessage = `Ошибка валидации: ${messages || 'Проверьте введенные данные.'}`;
                } else {
                    errorMessage = `Ошибка ${err.response?.status || ''}: ${err.message}`;
                }
            }
            setSubmitError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) {
        return (
             <Alert severity="info" sx={{mt: 3}}>
                Чтобы оставить ответ, пожалуйста, {' '}
                <MuiLink component={RouterLink} to="/login" state={{ from: location.pathname }} fontWeight="bold">
                    войдите
                </MuiLink>
                .
            </Alert>
        );
    }

    return (
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
             <FormControl fullWidth margin="normal" error={!!contentError} disabled={isSubmitting}>
                {/* Заголовок "Ваш ответ" обычно предоставляется родительским компонентом QuestionDetailPage */}
                {/* Если он нужен здесь, можно раскомментировать FormLabel */}
                {/* <FormLabel component="legend" sx={{ mb: 1, fontSize: '1rem', color: !!contentError ? 'error.main' : undefined }}>Ваш ответ</FormLabel> */}
                <RichTextEditor
                    value={content}
                    onChange={handleContentChange}
                    placeholder="Напишите ваш развернутый ответ здесь..."
                    // className="answer-editor-quill" // Для кастомной высоты
                />
                <FormHelperText error={!!contentError}>
                    {contentError || "Минимум 10 видимых символов."}
                </FormHelperText>
            </FormControl>

            {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}
            <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting || !!contentError || content.replace(/<[^>]*>?/gm, '').trim().length < 10}
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ mt: 1 }}
            >
                {isSubmitting ? 'Отправка...' : 'Опубликовать ответ'}
            </Button>
        </Box>
    );
};

export default AddAnswerForm;