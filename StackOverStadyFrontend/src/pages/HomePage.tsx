import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import QuestionCard from '../components/QuestionCard'; // Импортируем карточку

// Интерфейс для QuestionDto (дублируем или импортируем из общего места)
interface QuestionSummary {
    id: number;
    title: string;
    createdAt: string;
    author: {
        id: number;
        name: string;
        pictureUrl: string;
    };
    tags: { id: number; name: string }[];
    answerCount: number;
    rating: number;
}

const HomePage = () => {
    const [questions, setQuestions] = useState<QuestionSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchQuestions = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get<QuestionSummary[]>('https://localhost:7295/api/Questions');
                setQuestions(response.data);
            } catch (err) {
                console.error("Ошибка загрузки вопросов:", err);
                 setError("Не удалось загрузить список вопросов. Попробуйте обновить страницу.");
                 if (axios.isAxiosError(err) && err.response?.status === 500) {
                     setError(`Ошибка сервера (${err.response.status}). Не удалось загрузить вопросы.`);
                 }
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, []); // Загружаем один раз при монтировании

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Все вопросы
                </Typography>
                <Button variant="contained" component={RouterLink} to="/ask">
                    Задать вопрос
                </Button>
            </Box>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            )}

            {!loading && !error && questions.length === 0 && (
                <Typography sx={{ textAlign: 'center', p: 3 }}>
                    Пока нет ни одного вопроса. Станьте первым!
                </Typography>
            )}

            {!loading && !error && questions.length > 0 && (
                <Box>
                    {questions.map(question => (
                        <QuestionCard key={question.id} question={question} />
                    ))}
                    {/* Здесь можно добавить пагинацию */}
                </Box>
            )}
        </Box>
    );
};

export default HomePage;