import React, { useState, useEffect } from 'react'; // Добавили React
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Box, TextField, Button, Typography, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../AuthContext'; // Проверьте путь

const AskQuestionPage = () => {
    // Состояния формы
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState<string[]>([]); // Храним как массив строк
    const [tagInput, setTagInput] = useState(''); // Отдельное состояние для поля ввода тегов

    // Состояния отправки и ошибок
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Контекст аутентификации и навигация
    const navigate = useNavigate();
    const { user, loading, login } = useAuth(); // Получаем статус загрузки и пользователя

    // Очищаем ошибку, если пользователь вошел/вышел
    useEffect(() => {
        setSubmitError(null);
    }, [user]);

    // Обработчик изменения поля тегов
    const handleTagInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTagInput(event.target.value);
        // Преобразуем строку в массив тегов "на лету" для валидации кнопки или др. логики
        const currentTags = event.target.value
                           .split(',')
                           .map(tag => tag.trim())
                           .filter(tag => tag); // Убираем пустые
        setTags(currentTags);
    };


    // Обработчик отправки формы
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitError(null); // Сброс ошибки

        // 1. Проверка статуса аутентификации
        if (loading) {
            setSubmitError("Подождите, идет проверка аутентификации...");
            return;
        }
        if (!user) { // Достаточно проверить user, т.к. он null если нет ID или ошибка
            console.error('AskQuestionPage: Попытка отправки без авторизации.');
            setSubmitError('Вы должны быть авторизованы, чтобы задать вопрос.');
            return;
        }

        // 2. Подготовка данных (убираем authorId!)
        const questionData = {
            title,
            content,
            tags, // Отправляем массив строк
        };

        setIsSubmitting(true); // Начинаем отправку

        try {
            // 3. Отправка запроса (проверьте URL!)
            const response = await axios.post<{ id: number }>( // Ожидаем объект с ID вопроса в ответе
                'https://localhost:7295/api/Questions', // URL с большой 'Q'
                questionData,
                { withCredentials: true } // Отправляем куки
            );

            console.log('AskQuestionPage: Вопрос успешно создан:', response.data);

            // 4. Переход на страницу созданного вопроса (или на главную)
            // navigate(`/question/${response.data.id}`); // Если есть страница вопроса
             navigate('/'); // Или просто на главную

        } catch (error) {
            console.error('AskQuestionPage: Ошибка создания вопроса:', error);
            let errorMessage = 'Не удалось создать вопрос. Попробуйте еще раз.';
            if (axios.isAxiosError(error)) {
                // Формируем сообщение об ошибке
                errorMessage = `Ошибка ${error.response?.status || ''}: ${error.response?.data?.message || error.response?.data?.title || error.message}`;
                 // Проверяем на ошибки валидации от ASP.NET Core
                 if (error.response?.status === 400 && error.response?.data?.errors) {
                     const validationErrors = Object.values(error.response.data.errors).flat().join(' ');
                     errorMessage = `Ошибка валидации: ${validationErrors}`;
                 }
            }
            setSubmitError(errorMessage); // Показываем ошибку пользователю
        } finally {
            setIsSubmitting(false); // Завершаем отправку
        }
    };

    // --- Рендеринг компонента ---

    // Если идет первоначальная проверка пользователя
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Проверка пользователя...</Typography>
            </Box>
        );
     }

    // Если пользователь не авторизован (после проверки)
     if (!user) {
         return (
             <Box sx={{ padding: 4, maxWidth: '800px', margin: 'auto', textAlign: 'center' }}>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                     Чтобы задать вопрос, необходимо авторизоваться.
                 </Alert>
                 <Button variant="contained" onClick={login}>
                     Войти через Google
                 </Button>
             </Box>
         );
     }

    // Пользователь авторизован - показываем форму
    return (
        <Box sx={{ padding: { xs: 2, sm: 4 }, maxWidth: '800px', margin: 'auto' }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Задать новый вопрос
            </Typography>
            <form onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    label="Заголовок вопроса"
                    variant="outlined"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    margin="normal"
                    disabled={isSubmitting}
                    inputProps={{ maxLength: 200 }} // Соответствует DTO
                    helperText="Кратко сформулируйте вашу проблему (5-200 симв.)"
                />
                <TextField
                    fullWidth
                    label="Подробное описание проблемы"
                    variant="outlined"
                    multiline
                    rows={8} // Больше места для описания
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    margin="normal"
                    disabled={isSubmitting}
                    helperText="Опишите, что вы пытаетесь сделать, что ожидаете и что происходит на самом деле. Добавьте релевантные фрагменты кода, если нужно (мин. 10 симв.)"
                />
                <TextField
                    fullWidth
                    label="Теги"
                    variant="outlined"
                    value={tagInput} // Используем отдельное состояние для ввода
                    onChange={handleTagInputChange} // Используем обработчик
                    margin="normal"
                    disabled={isSubmitting}
                    helperText="Добавьте до 5 тегов, описывающих ваш вопрос, разделяя их запятыми (например: react, typescript, api)"
                />

                {/* Отображение ошибки отправки */}
                {submitError && (
                    <Alert severity="error" sx={{ mt: 2 }}>{submitError}</Alert>
                )}

                {/* Кнопка отправки */}
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    sx={{ marginTop: 2 }}
                    disabled={isSubmitting || !title || title.length < 5 || !content || content.length < 10 } // Базовая валидация на клиенте
                >
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Опубликовать вопрос'}
                </Button>
            </form>
        </Box>
    );
};

export default AskQuestionPage;