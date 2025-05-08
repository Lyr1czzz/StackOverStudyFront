import React, { useState } from 'react';
import { Paper, Box, Typography, Avatar, Link, Divider, IconButton, Tooltip, Button } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import DOMPurify from 'dompurify';

import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Для принятого ответа
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

import CommentList from './CommentList'; // Предполагаем, что этот компонент существует
import { useAuth } from '../AuthContext';
import axios from 'axios';

import { AnswerDto, UserInfoDto } from '../pages/QuestionDetailPage'; // Импортируем интерфейсы

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7295/api';

interface AnswerCardProps {
  answer: AnswerDto;
  onVote: (answerId: number, newRating: number) => void; // Обработчик обновления рейтинга в родительском компоненте
  questionAuthorId: number; // ID автора вопроса для кнопки "Принять ответ"
  // onAcceptAnswer?: (answerId: number) => Promise<void>; // Если логика принятия ответа здесь
}

const AnswerCard: React.FC<AnswerCardProps> = ({ answer, onVote, questionAuthorId }) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [voteProcessing, setVoteProcessing] = useState(false);
  // const [acceptProcessing, setAcceptProcessing] = useState(false); // Если принятие ответа здесь

  const sanitizedHtml = (html: string) => {
    return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  };

  const handleVote = async (voteType: 'Up' | 'Down') => {
    if (authLoading) return;
    if (!user) {
      alert("Необходимо авторизоваться, чтобы голосовать.");
      // Можно редиректить на логин, сохранив текущий путь
      // navigate('/login', { state: { from: location } });
      return;
    }
    if (voteProcessing) return;

    setVoteProcessing(true);
    try {
      // Важно: отправляйте токен, если ваш API этого требует!
      const response = await axios.post<{ newRating: number }>(
        `${API_URL}/answers/${answer.id}/vote`,
        { voteType },
        { withCredentials: true } // или headers: { 'Authorization': `Bearer ${token}` }
      );
      onVote(answer.id, response.data.newRating); // Вызываем колбэк для обновления UI
    } catch (error) {
      console.error("Ошибка голосования за ответ:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        alert("Ошибка авторизации. Пожалуйста, войдите снова.");
      } else {
        alert("Не удалось проголосовать за ответ.");
      }
    } finally {
      setVoteProcessing(false);
    }
  };

  // Пример функции принятия ответа (если логика здесь)
  // const handleAcceptAnswer = async () => {
  //   if (!user || user.id !== questionAuthorId || answer.isAccepted || acceptProcessing) return;
  //   setAcceptProcessing(true);
  //   try {
  //     await axios.post(`${API_URL}/answers/${answer.id}/accept`, {}, { withCredentials: true });
  //     // Здесь нужно будет обновить состояние isAccepted и, возможно, пересортировать ответы в QuestionDetailPage
  //     // onAnswerAccepted(answer.id); // Пример колбэка
  //     alert('Ответ принят (демо)');
  //   } catch (error) {
  //     console.error("Ошибка принятия ответа:", error);
  //     alert("Не удалось принять ответ.");
  //   } finally {
  //     setAcceptProcessing(false);
  //   }
  // };

  const formattedDate = (dateString: string) => {
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true, locale: ru });
    } catch (e) {
      return "недавно";
    }
  };

  const isCurrentUserAuthorOfQuestion = user?.id === questionAuthorId;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: answer.isAccepted ? 'success.main' : 'divider',
        borderRadius: 1,
        display: 'flex',
        flexDirection: {xs: 'column', sm: 'row'},
        position: 'relative', // Для CheckCircleIcon
      }}
    >
      {answer.isAccepted && (
        <Tooltip title="Принятый ответ">
          <CheckCircleIcon
            color="success"
            sx={{ position: 'absolute', top: 8, right: 8, fontSize: '1.75rem' }}
          />
        </Tooltip>
      )}
      <Box sx={{ mr: {sm:2}, mb:{xs:1, sm:0}, textAlign: 'center', minWidth: {sm:'50px'}, display:'flex', flexDirection:{xs:'row', sm:'column'}, alignItems:'center', justifyContent:{xs:'flex-start', sm:'flex-start'} }}>
        <Tooltip title="Полезный ответ">
          <IconButton onClick={() => handleVote('Up')} size="small" disabled={voteProcessing || authLoading}>
            <ThumbUpAltOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography variant="body1" component="div" sx={{ my: {sm:0.5}, mx: {xs:1, sm:0}, fontWeight: 'medium' }}>
          {answer.rating ?? 0}
        </Typography>
        <Tooltip title="Бесполезный ответ">
          <IconButton onClick={() => handleVote('Down')} size="small" disabled={voteProcessing || authLoading}>
            <ThumbDownAltOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ flexGrow: 1, width: '100%' }}>
        <Box
          className="answer-content"
          sx={{
            mb: 2,
            wordBreak: 'break-word',
            fontSize: '0.95rem',
            '& p': { marginBlockStart: '0.5em', marginBlockEnd: '0.5em' },
            '& h1, & h2, & h3, & h4, & h5, & h6': { marginTop: '1em', marginBottom: '0.5em', lineHeight: 1.2 },
            '& ul, & ol': { paddingLeft: '2em', marginBlockStart: '0.5em', marginBlockEnd: '0.5em' },
            '& li': { marginBottom: '0.25em' },
            '& a': { color: 'primary.main', textDecoration: 'underline' },
            '& img': { maxWidth: '100%', height: 'auto', borderRadius: '4px', my: 1 },
            '& pre': {
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'grey[800]' : 'grey[100]',
              padding: '1em',
              borderRadius: '4px',
              overflowX: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              my: 1,
            },
            '& code:not(pre > code)': {
              fontFamily: 'monospace',
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(27,31,35,.07)',
              padding: '.2em .4em',
              margin: 0,
              fontSize: '90%',
              borderRadius: '3px'
            },
            '& blockquote': {
                borderLeft: (theme) => `4px solid ${theme.palette.divider}`,
                paddingLeft: '1em',
                marginLeft: 0,
                color: 'text.secondary',
                fontStyle: 'italic'
            }
          }}
          dangerouslySetInnerHTML={{ __html: sanitizedHtml(answer.content) }}
        />

        <Divider sx={{ my: 1 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, flexWrap: 'wrap' }}>
          {/* Кнопка "Принять ответ", если текущий пользователь - автор вопроса и ответ еще не принят */}
          {isCurrentUserAuthorOfQuestion && !answer.isAccepted && (
            <Button
              size="small"
              variant="outlined"
              color="success"
              // onClick={handleAcceptAnswer} // Раскомментируйте, если реализуете здесь
              // disabled={acceptProcessing || authLoading}
              onClick={() => alert('Логика принятия ответа еще не реализована на клиенте')}
            >
              Принять ответ
            </Button>
          )}
          <Box sx={{ flexGrow: isCurrentUserAuthorOfQuestion && !answer.isAccepted ? 0 : 1 }} /> {/* Заполнитель, чтобы автор был справа */}


          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
            <Typography variant="caption" sx={{ mr: 0.5 }}>
              Ответил(а) {formattedDate(answer.createdAt)}
            </Typography>
            <Link component={RouterLink} to={`/profile/${answer.author.id}`} sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }} color="inherit">
              <Tooltip title={answer.author.name} placement="top">
                <Avatar
                  src={answer.author.pictureUrl || undefined}
                  alt={answer.author.name}
                  sx={{ width: 24, height: 24, mr: 0.5 }}
                >
                  {!answer.author.pictureUrl && <AccountCircleIcon fontSize="small" />}
                </Avatar>
              </Tooltip>
              <Typography variant="caption" sx={{ '&:hover': { textDecoration: 'underline' } }}>
                {answer.author.name}
              </Typography>
            </Link>
          </Box>
        </Box>
        <CommentList targetId={answer.id} targetType="answer" />
      </Box>
    </Paper>
  );
};

export default AnswerCard;