// src/components/AnswerCard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Paper, Box, Typography, Avatar, Link as MuiLink, Divider, IconButton, Tooltip, Button, Snackbar } from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';
// Языки для hljs должны быть зарегистрированы глобально или здесь, если они не используются в QuestionDetailPage

import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Для принятого ответа и кнопки
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

import CommentList from './CommentList'; // Предполагаем, что этот компонент существует
import { useAuth } from '../AuthContext';
import axios from 'axios';
import { AnswerDto, UserInfoDto } from '../pages/QuestionDetailPage'; // Импортируем интерфейсы из QuestionDetailPage

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7295/api';

interface AnswerCardProps {
  answer: AnswerDto;
  onVote: (answerId: number, newRating: number) => void; // Обработчик обновления рейтинга в родительском компоненте
  questionAuthorId: number; // ID автора вопроса для кнопки "Принять ответ"
  onAcceptAnswer: (answerId: number) => void; // Колбэк для обновления UI после принятия
}

const AnswerCard: React.FC<AnswerCardProps> = ({ answer, onVote, questionAuthorId, onAcceptAnswer }) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [voteProcessing, setVoteProcessing] = useState(false);
  const [acceptProcessing, setAcceptProcessing] = useState(false);

  const answerContentRef = useRef<HTMLDivElement>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false); // Локальный Snackbar для этой карточки
  const [snackbarMessage, setSnackbarMessage] = useState("");


  const sanitizedHtml = (html: string) => {
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'title', 'width', 'height'],
    });
  };

  useEffect(() => {
    if (!answerContentRef.current) return;
    const currentContentRef = answerContentRef.current;

    // 1. Подсветка синтаксиса
    const codeBlocks = currentContentRef.querySelectorAll('pre code, pre.ql-syntax code');
    codeBlocks.forEach((block) => {
        const B = block as HTMLElement;
        if (!B.dataset.highlighted) { // Используем data-атрибут для предотвращения повторной подсветки
            hljs.highlightElement(B);
            B.dataset.highlighted = 'true';
            if (B.parentElement && B.parentElement.tagName === 'PRE') {
                B.parentElement.classList.add('hljs-processed-parent');
            }
        }
    });

    // 2. Добавление кнопок "Копировать"
    const preElements = currentContentRef.querySelectorAll('pre:not(.code-block-wrapper-dynamic pre)');
    preElements.forEach(pre => {
      if (pre.querySelector('button.copy-code-button')) {
        return;
      }

      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.classList.add('code-block-wrapper-dynamic');

      const copyButton = document.createElement('button');
      copyButton.classList.add('copy-code-button');
      const svgIcon = `<svg fill="currentColor" width="16px" height="16px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;
      copyButton.innerHTML = svgIcon;
      copyButton.setAttribute('aria-label', 'Копировать код');
      copyButton.setAttribute('title', 'Копировать код');

      Object.assign(copyButton.style, {
        position: 'absolute', top: '6px', right: '6px', zIndex: '10',
        backgroundColor: 'rgba(220, 220, 220, 0.6)', border: '1px solid rgba(200,200,200,0.7)',
        borderRadius: '4px', padding: '3px 5px', cursor: 'pointer', lineHeight: '0',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444'
      });
      copyButton.onmouseover = () => { copyButton.style.backgroundColor = 'rgba(200, 200, 200, 0.9)'; copyButton.style.color = '#111'; };
      copyButton.onmouseout = () => { copyButton.style.backgroundColor = 'rgba(220, 220, 220, 0.6)'; copyButton.style.color = '#444';};

      copyButton.onclick = async () => {
        const codeToCopy = pre.textContent || '';
        try {
          await navigator.clipboard.writeText(codeToCopy);
          setSnackbarMessage("Код скопирован!"); // Используем локальный Snackbar
          setSnackbarOpen(true);
        } catch (err) {
          console.error('Failed to copy: ', err);
          setSnackbarMessage("Ошибка копирования!");
          setSnackbarOpen(true);
        }
      };

      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
      wrapper.appendChild(copyButton);
    });
  }, [answer.content]); // Перезапускаем при изменении контента ответа

  const handleVote = async (voteType: 'Up' | 'Down') => {
    if (authLoading || !user) {
      setSnackbarMessage("Нужна авторизация для голосования за ответ");
      setSnackbarOpen(true);
      // navigate('/login', { state: { from: location } }); // опционально
      return;
    }
    if (voteProcessing) return;

    setVoteProcessing(true);
    try {
      const response = await axios.post<{ action: string, newRating: number }>(
        `${API_URL}/answers/${answer.id}/vote`, // Эндпоинт из вашего VotesController
        { voteType },
        { withCredentials: true }
      );
      onVote(answer.id, response.data.newRating); // Вызываем колбэк для обновления UI в QuestionDetailPage
      setSnackbarMessage(response.data.action === "removed vote" ? "Голос за ответ отменен." : "Голос за ответ учтён!");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Ошибка голосования за ответ:", error);
      if (axios.isAxiosError(error)) {
        setSnackbarMessage(error.response?.data?.message || "Ошибка голосования за ответ");
      } else {
        setSnackbarMessage("Неизвестная ошибка голосования за ответ");
      }
      setSnackbarOpen(true);
    } finally {
      setVoteProcessing(false);
    }
  };

  const handleAccept = async () => {
    if (authLoading || !user || acceptProcessing || answer.isAccepted || user.id !== questionAuthorId) {
      if(!user && !authLoading) {
         setSnackbarMessage("Необходимо авторизоваться, чтобы принять ответ.");
         setSnackbarOpen(true);
      } else if (user && user.id !== questionAuthorId && !answer.isAccepted) {
         setSnackbarMessage("Только автор вопроса может принять ответ.");
         setSnackbarOpen(true);
      } else if (answer.isAccepted) {
        // Можно добавить логику отмены принятия, если бэкенд это поддерживает
        // setSnackbarMessage("Этот ответ уже принят.");
        // setSnackbarOpen(true);
      }
      return;
    }
    setAcceptProcessing(true);
    try {
      // Запрос на новый эндпоинт для принятия ответа
      await axios.post(`${API_URL}/answers/${answer.id}/accept`, {}, { withCredentials: true });
      onAcceptAnswer(answer.id); // Вызываем колбэк для обновления UI в QuestionDetailPage
      // Snackbar об успехе принятия будет показан из QuestionDetailPage
    } catch (error) {
      console.error("Ошибка принятия ответа:", error);
      if (axios.isAxiosError(error)) {
        const errData = error.response?.data as { message?: string };
        setSnackbarMessage(errData?.message || "Не удалось принять ответ.");
      } else {
        setSnackbarMessage("Произошла неизвестная ошибка при принятии ответа.");
      }
      setSnackbarOpen(true);
    } finally {
      setAcceptProcessing(false);
    }
  };


  const formattedDate = (dateString: string): string => {
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true, locale: ru });
    } catch (e) {
      console.warn("Invalid date for answer card:", dateString);
      return "недавно";
    }
  };

  const isCurrentUserAuthorOfQuestion = user?.id === questionAuthorId;

  return (
    <Paper
      elevation={0}
      sx={{
        p: {xs: 1.5, sm: 2},
        border: '1px solid',
        borderColor: answer.isAccepted ? 'success.main' : 'divider',
        borderRadius: 2,
        display: 'flex',
        flexDirection: {xs: 'column', sm: 'row'},
        position: 'relative',
        boxShadow: answer.isAccepted ? (theme) => `0 0 12px ${theme.palette.success.light}` : 'none',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        backgroundColor: answer.isAccepted ? (theme) => theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(232, 245, 233, 0.5)' : 'transparent',
      }}
    >
      {answer.isAccepted && (
        <Tooltip title="Принятый ответ">
          <CheckCircleIcon
            color="success"
            sx={{ position: 'absolute', top: {xs: 6, sm: 10}, right: {xs:6, sm:10}, fontSize: {xs: '1.5rem', sm:'1.75rem'} }}
          />
        </Tooltip>
      )}
      <Box sx={{ mr: {sm:2}, mb:{xs:1, sm:0}, textAlign: 'center', minWidth: {sm:'50px'}, display:'flex', flexDirection:{xs:'row', sm:'column'}, alignItems:'center', justifyContent:{xs:'flex-start', sm:'center'} }}>
        <Tooltip title="Полезный ответ">
          <IconButton onClick={() => handleVote('Up')} size="small" disabled={voteProcessing || authLoading || !user}>
            <ThumbUpAltOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography variant="body1" component="div" sx={{ my: {sm:0.5}, mx: {xs:1, sm:0}, fontWeight: 'medium', color: answer.isAccepted ? 'success.dark' : 'text.primary' }}>
          {answer.rating ?? 0}
        </Typography>
        <Tooltip title="Бесполезный ответ">
          <IconButton onClick={() => handleVote('Down')} size="small" disabled={voteProcessing || authLoading || !user}>
            <ThumbDownAltOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ flexGrow: 1, width: 'calc(100% - 50px - 16px)', overflow: 'hidden' }}>
        <Box
          ref={answerContentRef}
          className="answer-content"
          sx={{
            mb: 2,
            wordBreak: 'break-word',
            fontSize: '0.95rem',
            // Стили для контента ответа, аналогичные стилям для вопроса
            '& p': { marginBlockStart: '0.5em', marginBlockEnd: '0.5em', lineHeight: 1.6 },
            '& h1': { fontSize: '1.6em', mt: '1em', mb: '0.5em', lineHeight: 1.3, fontWeight: 600 },
            '& h2': { fontSize: '1.4em', mt: '1em', mb: '0.5em', lineHeight: 1.3, fontWeight: 600 },
            '& h3': { fontSize: '1.2em', mt: '1em', mb: '0.5em', lineHeight: 1.3, fontWeight: 600 },
            '& h4': { fontSize: '1.1em', mt: '1em', mb: '0.5em', lineHeight: 1.3, fontWeight: 600 },
            '& ul, & ol': { pl: '2em', my: '0.8em' },
            '& li': { mb: '0.3em', lineHeight: 1.6 },
            '& a': { color: 'primary.main', textDecoration: 'underline', '&:hover': {textDecoration: 'none'} },
            '& img': { maxWidth: '100%', height: 'auto', borderRadius: '4px', my: 1 },
            '& blockquote': {
                borderLeft: (theme) => `4px solid ${theme.palette.divider}`,
                pl: '1em', ml: 0, my: '1em', color: 'text.secondary', fontStyle: 'italic',
                '& p': { marginBlockStart: '0.25em', marginBlockEnd: '0.25em' }
            },
            '& pre, & .ql-syntax': {
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#2D2D2D' : '#F8F9FA',
              color: (theme) => theme.palette.mode === 'dark' ? '#F8F8F2' : '#212B36',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              padding: '10px 14px', my: '12px', borderRadius: '6px', overflowX: 'auto',
              fontFamily: '"Menlo", "Consolas", "Monaco", "Liberation Mono", "Lucida Console", monospace',
              fontSize: '13px', lineHeight: 1.5, whiteSpace: 'pre', tabSize: 4,
            },
            '& pre code, & .ql-syntax code': {
              fontFamily: 'inherit', fontSize: 'inherit', backgroundColor: 'transparent',
              color: 'inherit', padding: 0, margin: 0, borderRadius: 0,
              whiteSpace: 'inherit', display: 'block',
            },
            '& code:not(pre code):not(.ql-syntax code)': {
              fontFamily: '"Menlo", "Consolas", "Monaco", "Liberation Mono", "Lucida Console", monospace',
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(145, 158, 171, 0.16)' : 'rgba(222, 226, 230, 0.5)',
              padding: '2px 5px', margin: '0 2px', fontSize: '12px', borderRadius: '5px',
              wordBreak: 'break-all', color: (theme) => theme.palette.mode === 'dark' ? '#E0E0E0' : '#343A40'
            },
          }}
          dangerouslySetInnerHTML={{ __html: sanitizedHtml(answer.content) }}
        />

        <Divider sx={{ my: 1 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, flexWrap: 'wrap', gap: 1 }}>
          {isCurrentUserAuthorOfQuestion && !answer.isAccepted && (
            <Button
              size="small"
              variant="outlined"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={handleAccept}
              disabled={acceptProcessing || authLoading || !user}
            >
              Принять ответ
            </Button>
          )}
          {isCurrentUserAuthorOfQuestion && answer.isAccepted && (
            <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                disabled
                sx={{cursor: 'default', '&.Mui-disabled': { backgroundColor: 'success.main', color: 'success.contrastText', opacity: 0.7 } }}
            >
                Ответ принят
            </Button>
          )}
          {/* Заполнитель, чтобы авторская информация была справа, если кнопка принятия не рендерится для НЕ автора вопроса */}
          {!isCurrentUserAuthorOfQuestion && <Box sx={{ flexGrow: 1 }} />}


          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', ml: isCurrentUserAuthorOfQuestion ? 0 : 'auto' /* Прижать вправо, если не автор вопроса */ }}>
            <Typography variant="caption" sx={{ mr: 0.5 }}>
              Ответил(а) {formattedDate(answer.createdAt)}
            </Typography>
            <MuiLink component={RouterLink} to={`/profile/${answer.author.id}`} sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }} color="inherit">
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
            </MuiLink>
          </Box>
        </Box>
        <CommentList targetId={answer.id} targetType="answer" />
      </Box>
      {/* Локальный Snackbar для сообщений специфичных для этой карточки (например, ошибки копирования, голосования, принятия) */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Paper>
  );
};

export default AnswerCard;