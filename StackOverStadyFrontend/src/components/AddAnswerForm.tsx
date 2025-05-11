// src/components/AddAnswerForm.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { Box, Button, CircularProgress, Alert, Typography, useTheme } from '@mui/material';
import RichTextEditor from './RichTextEditor'; // Предполагается, что RichTextEditor есть
import { AnswerDto } from '../pages/QuestionDetailPage'; // Импорт интерфейса

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7295/api';

interface AddAnswerFormProps {
  questionId: number;
  onAnswerAdded: (newAnswer: AnswerDto) => void;
}

const AddAnswerForm: React.FC<AddAnswerFormProps> = ({ questionId, onAnswerAdded }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!content.trim() || content.length < 20) { // Минимальная длина ответа
      setError('Ответ должен содержать не менее 20 символов и не может состоять только из пробелов.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await axios.post<AnswerDto>(
        `${API_URL}/questions/${questionId}/answers`,
        { content },
        { withCredentials: true }
      );
      onAnswerAdded(response.data);
      setContent(''); // Очищаем редактор
    } catch (err) {
      console.error("Ошибка добавления ответа:", err);
      let errorMessage = "Не удалось добавить ответ.";
       if (axios.isAxiosError(err) && err.response?.data) {
            if(typeof err.response.data === 'string') {
                errorMessage = err.response.data;
            } else if (err.response.data.errors && err.response.data.errors.Content) {
                errorMessage = err.response.data.errors.Content.join(' ');
            } else if (err.response.data.message) {
                 errorMessage = err.response.data.message;
            }
        }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* Стили для контейнера редактора, чтобы рамка была как у других Paper */}
      <Box sx={{
        border: 1,
        borderColor: 'divider',
        overflow: 'hidden', // Чтобы тулбар редактора не вылезал за рамки
        mb: 2,
        '.ql-toolbar': { // Стили для тулбара Quill
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.action.hover,
        },
        '.ql-container': { // Стили для контейнера текста Quill
            minHeight: '150px', // Минимальная высота редактора
            fontSize: '1rem',
            fontFamily: theme.typography.fontFamily,
            backgroundColor: theme.palette.background.paper, // Фон текстового поля
             '& .ql-editor.ql-blank::before': { // Стили для плейсхолдера
                color: theme.palette.text.disabled,
                fontStyle: 'normal',
            }
        }
      }}>
        <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Напишите ваш развернутый ответ здесь..."
        />
      </Box>
      
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={isSubmitting || !content.trim() || content.length < 20}
        startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
      >
        {isSubmitting ? 'Отправка...' : 'Опубликовать ответ'}
      </Button>
    </Box>
  );
};

export default AddAnswerForm;