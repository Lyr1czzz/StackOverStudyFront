import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Paper, Box, Typography, Chip, Avatar, Link, Grid, Tooltip } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale'; // Для русского языка

// Интерфейс для данных, которые принимает карточка (из QuestionDto бэкенда)
interface QuestionCardProps {
    question: {
        id: number;
        title: string;
        createdAt: string; // Дата приходит как строка
        author: {
            id: number;
            name: string;
            pictureUrl: string;
        };
        tags: { id: number; name: string }[];
        answerCount: number;
        rating: number;
    };
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
    // Форматирование даты
    const timeAgo = formatDistanceToNow(new Date(question.createdAt), { addSuffix: true, locale: ru });

    return (
        <Paper elevation={2} sx={{ p: 2, mb: 2, display: 'flex' }}>
            {/* Левая часть: Статистика */}
            <Box sx={{
                mr: 2,
                textAlign: 'center',
                minWidth: '70px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center', // Центрируем контент
                gap: 0.5 // Промежуток между элементами
            }}>
                 <Typography variant="body2" color="text.secondary">
                     {question.rating ?? 0}
                 </Typography>
                 <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                     голосов
                 </Typography>
                 <Typography variant="body2" fontWeight="bold" color={question.answerCount > 0 ? 'success.main' : 'text.secondary'} sx={{ mt: 1 }}>
                    {question.answerCount}
                 </Typography>
                 <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                     ответов
                 </Typography>
                {/* Можно добавить просмотры, если есть */}
            </Box>

            {/* Правая часть: Контент */}
            <Box sx={{ flexGrow: 1 }}>
                {/* Заголовок вопроса (ссылка) */}
                <Typography variant="h6" sx={{ mb: 1 }}>
                    <Link component={RouterLink} to={`/questions/${question.id}`} underline="hover">
                        {question.title}
                    </Link>
                </Typography>

                {/* Теги */}
                <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {question.tags.map(tag => (
                        <Chip key={tag.id} label={tag.name} size="small" variant="outlined" />
                        // Можно сделать теги ссылками на поиск по тегу:
                        // <Chip key={tag.id} label={tag.name} size="small" component={RouterLink} to={`/tags/${tag.name}`} clickable />
                    ))}
                </Box>

                {/* Информация об авторе и времени */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 1 }}>
                    <Tooltip title={question.author.name} placement="top">
                         <Avatar
                            src={question.author.pictureUrl}
                            alt={question.author.name}
                            sx={{ width: 24, height: 24, mr: 1 }}
                            component={RouterLink} // Делаем аватар ссылкой
                            to={`/profile/${question.author.id}`}
                            imgProps={{ referrerPolicy: "no-referrer" }}
                        />
                     </Tooltip>
                    <Typography variant="caption" color="text.secondary">
                        <Link component={RouterLink} to={`/profile/${question.author.id}`} underline="hover" color="inherit">
                            {question.author.name}
                        </Link>
                        {' • '} {timeAgo}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
};

export default QuestionCard;