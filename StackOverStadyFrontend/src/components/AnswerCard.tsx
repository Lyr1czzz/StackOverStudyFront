import React, { useState } from 'react';
import { Paper, Box, Typography, Avatar, Link, Divider, IconButton, Tooltip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import CommentList from './CommentList';
import { useAuth } from '../AuthContext'; // Для проверки
import axios from 'axios'; // Для запросов

// Интерфейс для данных AnswerDto
interface AnswerCardProps {
    answer: {
        id: number; content: string; createdAt: string;
        author: { id: number; name: string; pictureUrl: string; };
        rating: number; isAccepted: boolean;
    };
    onVote?: (answerId: number, newRating: number) => void;
}

const AnswerCard: React.FC<AnswerCardProps> = ({ answer, onVote }) => {
    const timeAgo = formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true, locale: ru });
    const { user } = useAuth();
    const [voteProcessing, setVoteProcessing] = useState(false);

    const handleVote = async (voteType: 'Up' | 'Down') => {
        if (!user) {
             alert("Нужно войти, чтобы голосовать.");
             return;
         }
         if (voteProcessing) return;

        setVoteProcessing(true);
        console.log(`Голосование за ответ ${answer.id}: ${voteType}`);

        try {
             const response = await axios.post<{ action: string, newRating: number }>( // Уточним тип ответа API
                 `https://localhost:7295/api/answers/${answer.id}/vote`,
                 { voteType },
                 { withCredentials: true }
             );
             console.log('Голос за ответ учтен, новый рейтинг:', response.data.newRating);

             // Теперь onVote будет доступен
             if (onVote) {
                 onVote(answer.id, response.data.newRating);
             }

         } catch (error) {
             console.error("Ошибка голосования за ответ:", error);
             let errorMsg = "Не удалось проголосовать за ответ.";
              if (axios.isAxiosError(error) && error.response?.data?.message) {
                errorMsg = error.response.data.message; // Показываем ошибку с бэка, если есть
              } else if (axios.isAxiosError(error)) {
                errorMsg = `Ошибка ${error.response?.status || ''}: ${error.message}`;
              }
             alert(errorMsg);
         } finally {
             setVoteProcessing(false);
         }
    };

    return (
        <Paper elevation={0} sx={{ p: 2, mb: 1, border: '1px solid', borderColor: 'divider', display: 'flex' }}>
        {/* Левая часть: Голосование */}
        <Box sx={{ mr: 2, textAlign: 'center', minWidth: '50px', pt: 1 }}>
             <Tooltip title="Полезный ответ">
                <IconButton onClick={() => handleVote('Up')} size="small" disabled={voteProcessing}>
                   <ThumbUpAltOutlinedIcon fontSize="small" />
               </IconButton>
             </Tooltip>
            <Typography variant="h6" component="div" sx={{ my: 0.5 }}>
                {answer.rating ?? 0}
            </Typography>
            <Tooltip title="Бесполезный ответ">
                <IconButton onClick={() => handleVote('Down')} size="small" disabled={voteProcessing}>
                   <ThumbDownAltOutlinedIcon fontSize="small" />
               </IconButton>
            </Tooltip>
                 {answer.isAccepted && ( 
                    <img src="/logo.png" alt="Logo" style={{ height: 32, marginRight: '8px' }} />
                  )}
             </Box>

            {/* Правая часть: Контент и автор */}
             <Box sx={{ flexGrow: 1 }}>
                {/* Текст ответа */}
                
                {/* TODO: Использовать Markdown рендерер для отображения форматирования */}
                <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                    {answer.content}
                </Typography>

                <Divider sx={{ my: 1 }} />

                {/* Информация об авторе */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                        Ответил {timeAgo}
                    </Typography>
                    <Tooltip title={answer.author.name} placement="top">
                         <Avatar
                            src={answer.author.pictureUrl}
                            alt={answer.author.name}
                            sx={{ width: 24, height: 24, mr: 1 }}
                            component={RouterLink}
                            to={`/profile/${answer.author.id}`}
                            imgProps={{ referrerPolicy: "no-referrer" }}
                        />
                     </Tooltip>
                    <Typography variant="caption">
                        <Link component={RouterLink} to={`/profile/${answer.author.id}`} underline="hover">
                            {answer.author.name}
                        </Link>
                    </Typography>
                </Box>
                {/* Здесь можно добавить комментарии к ответу */}
                {/* Комментарии к ответу */}
                <CommentList targetId={answer.id} targetType="answer" />
            </Box>
        </Paper>
    );
};

export default AnswerCard;