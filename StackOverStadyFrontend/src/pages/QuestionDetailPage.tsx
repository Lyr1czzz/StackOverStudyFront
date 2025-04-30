import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { Box, Typography, CircularProgress, Alert, Paper, Chip, Avatar, Link, Divider, List, ListItem, IconButton } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import AnswerCard from '../components/AnswerCard'; // Компонент для ответа
import AddAnswerForm from '../components/AddAnswerForm'; // Форма добавления ответа
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import CommentList from '../components/CommentList';
import { Tooltip } from '@mui/material'; // Добавим IconButton, Tooltip
import { useAuth } from '../AuthContext'; // Нужен для проверки авторизации перед 

// Интерфейсы для DTO (дублируем или импортируем)
interface UserInfo { id: number; name: string; pictureUrl: string; }
interface Tag { id: number; name: string; }
interface Answer {
    id: number; content: string; createdAt: string;
    author: UserInfo; rating: number; isAccepted: boolean;
}
interface QuestionDetails {
    id: number; title: string; content: string; createdAt: string;
    author: UserInfo; tags: Tag[]; rating: number; answers: Answer[];
}

const QuestionDetailPage = () => {
    const { questionId } = useParams<{ questionId: string }>(); // Получаем ID из URL
    const [question, setQuestion] = useState<QuestionDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [votingState, setVotingState] = useState<'idle' | 'voting'>('idle'); // Состояние голосования
    const { user } = useAuth(); // Получаем пользователя для проверки



    // useCallback для функции загрузки, чтобы не пересоздавать ее
    const fetchQuestion = useCallback(async () => {
        setLoading(true);
        setError(null);
         console.log(`Загрузка вопроса с ID: ${questionId}`);
        try {
            const response = await axios.get<QuestionDetails>(`https://localhost:7295/api/Questions/${questionId}`);
            // Сортируем ответы сразу после получения
             response.data.answers = response.data.answers.sort((a, b) => {
                 if (a.isAccepted && !b.isAccepted) return -1; // Принятый ответ всегда первый
                 if (!a.isAccepted && b.isAccepted) return 1;
                 return b.rating - a.rating; // Затем по рейтингу (убывание)
             });
            setQuestion(response.data);
             console.log("Вопрос загружен:", response.data);
        } catch (err) {
            console.error("Ошибка загрузки вопроса:", err);
            if (axios.isAxiosError(err)) {
                 if (err.response?.status === 404) {
                    setError("Вопрос не найден.");
                } else {
                    setError(`Не удалось загрузить вопрос (Ошибка ${err.response?.status || 'N/A'}).`);
                }
            } else {
                 setError("Произошла неизвестная ошибка.");
            }
        } finally {
            setLoading(false);
        }
    }, [questionId]); // Зависимость от questionId

    useEffect(() => {
        if (questionId) {
            fetchQuestion();
        } else {
             setError("ID вопроса не указан."); // На случай, если роутинг не сработал
             setLoading(false);
        }
    }, [questionId, fetchQuestion]); // Зависимость от questionId и fetchQuestion

    // Функция для добавления нового ответа в список без перезагрузки страницы
    const handleAnswerAdded = (newAnswer: Answer) => {
        setQuestion(prevQuestion => {
            if (!prevQuestion) return null;
            // Добавляем новый ответ и пересортировываем
             const updatedAnswers = [...prevQuestion.answers, newAnswer].sort((a, b) => {
                  if (a.isAccepted && !b.isAccepted) return -1;
                  if (!a.isAccepted && b.isAccepted) return 1;
                 return b.rating - a.rating;
             });
            return { ...prevQuestion, answers: updatedAnswers };
        });
    };

    const handleQuestionVote = async (voteType: 'Up' | 'Down') => {
        if (!user) {
            alert("Нужно войти, чтобы голосовать."); // Или показать Snackbar/Modal
            return;
        }
        if (!question || votingState === 'voting') return; // Не голосуем, если нет вопроса или уже идет процесс

        setVotingState('voting');
        console.log(`Голосование за вопрос ${questionId}: ${voteType}`);

        try {
            const response = await axios.post(
                `https://localhost:7295/api/questions/${questionId}/vote`,
                { voteType }, // Отправляем Up или Down
                { withCredentials: true }
            );
            // Обновляем рейтинг вопроса в состоянии
            setQuestion(prev => prev ? { ...prev, rating: response.data.newRating } : null);
            console.log('Голос за вопрос учтен, новый рейтинг:', response.data.newRating);

        } catch (error) {
            console.error("Ошибка голосования за вопрос:", error);
            alert("Не удалось проголосовать за вопрос."); // Уведомление об ошибке
        } finally {
            setVotingState('idle');
        }
    };


    const handleAnswerVote = (answerId: number, newRating: number) => {
        setQuestion(prevQuestion => {
            if (!prevQuestion) return null;
            // Находим ответ и обновляем его рейтинг
            const updatedAnswers = prevQuestion.answers.map(ans =>
                ans.id === answerId ? { ...ans, rating: newRating } : ans
            );
            // Пересортировываем на всякий случай
             updatedAnswers.sort((a, b) => {
                 if (a.isAccepted && !b.isAccepted) return -1;
                 if (!a.isAccepted && b.isAccepted) return 1;
                return b.rating - a.rating;
            });
            return { ...prevQuestion, answers: updatedAnswers };
        });
    };


    // --- Рендеринг ---

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    if (!question) {
        return <Alert severity="warning">Данные вопроса не найдены.</Alert>; // На всякий случай
    }

    const timeAgo = formatDistanceToNow(new Date(question.createdAt), { addSuffix: true, locale: ru });

    return (
        <Box>
            {/* Заголовок вопроса */}
            <Typography variant="h4" component="h1" gutterBottom>
                {question.title}
            </Typography>

            {/* Информация о вопросе (дата, автор) */}
             <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'text.secondary', flexWrap: 'wrap' }}>
                 <Typography variant="caption" sx={{ mr: 2 }}>
                     Задан: {timeAgo}
                 </Typography>
                 {/* Можно добавить дату изменения */}
                 <Typography variant="caption">
                    Автор:
                     <Link component={RouterLink} to={`/profile/${question.author.id}`} sx={{ ml: 0.5 }}>
                          <Avatar src={question.author.pictureUrl} sx={{ width: 20, height: 20, display: 'inline-block', verticalAlign: 'middle', mr: 0.5 }} imgProps={{ referrerPolicy: "no-referrer" }} />
                          {question.author.name}
                     </Link>
                 </Typography>
            </Box>
             <Divider sx={{ mb: 2 }} />

            {/* Основной контент вопроса и голосование */}
            <Box sx={{ display: 'flex' }}>
                 {/* Голосование за вопрос */}
                 <Box sx={{ mr: 3, textAlign: 'center', minWidth: '50px', pt: 1 }}>
                      <Tooltip title="Полезный вопрос">
                         {/* Добавляем disabled во время голосования */}
                         <IconButton onClick={() => handleQuestionVote('Up')} size="small" disabled={votingState === 'voting'}>
                             <ThumbUpAltOutlinedIcon />
                         </IconButton>
                      </Tooltip>
                     <Typography variant="h5" component="div" sx={{ my: 0.5 }}>
                         {question.rating ?? 0}
                     </Typography>
                      <Tooltip title="Неполезный вопрос">
                         <IconButton onClick={() => handleQuestionVote('Down')} size="small" disabled={votingState === 'voting'}>
                             <ThumbDownAltOutlinedIcon />
                         </IconButton>
                       </Tooltip>
                 </Box>

                 {/* Тело вопроса и теги */}
                 <Box sx={{ flexGrow: 1 }}>
                      {/* TODO: Рендерить Markdown */}
                     <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
                         {question.content}
                     </Typography>

                     {/* Теги */}
                    <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {question.tags.map(tag => (
                            <Chip key={tag.id} label={tag.name} size="small" />
                        ))}
                    </Box>
                     {/* Здесь можно добавить комментарии к вопросу */}
                     {/* <<< Комментарии к вопросу >>> */}
                    <CommentList targetId={question.id} targetType="question" />
                 </Box>
            </Box>


             <Divider sx={{ my: 3 }} />

            {/* Секция ответов */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="h5" gutterBottom>
                    {question.answers.length} {getAnswerCountText(question.answers.length)}
                </Typography>

                {question.answers.length > 0 ? (
                    <List disablePadding>
                        {question.answers.map(answer => (
                            <ListItem key={answer.id} disablePadding sx={{ display: 'block', mb: 1 }}>
                                {/* <<< Передаем обработчик onVote >>> */}
                                <AnswerCard answer={answer} onVote={handleAnswerVote} />
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Typography sx={{ mt: 2 }}>
                        На этот вопрос пока нет ответов.
                    </Typography>
                )}
            </Box>

            {/* Форма добавления ответа */}
            <AddAnswerForm questionId={Number(questionId)} onAnswerAdded={handleAnswerAdded} />

        </Box>
    );
};

// Вспомогательная функция для склонения слова "ответ"
function getAnswerCountText(count: number): string {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'ответов';
    if (lastDigit === 1) return 'ответ';
    if (lastDigit >= 2 && lastDigit <= 4) return 'ответа';
    return 'ответов';
}

export default QuestionDetailPage;