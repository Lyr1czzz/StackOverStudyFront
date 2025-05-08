// src/pages/QuestionDetailPage.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Avatar,
  Link as MuiLink,
  Divider,
  List,
  ListItem,
  IconButton,
  Tooltip,
  Container,
  Snackbar,
} from '@mui/material';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';

import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
// import ContentCopyIcon from '@mui/icons-material/ContentCopy'; // Используем SVG напрямую для кнопки

import AddAnswerForm from '../components/AddAnswerForm';
import CommentList from '../components/CommentList';
import { useAuth } from '../AuthContext';
import AnswerCard from '../components/AnswerCard';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7295/api';

export interface AnswerDto { // <--- Убедитесь, что этот интерфейс экспортируется
    id: number;
    content: string;
    createdAt: string;
    author: UserInfoDto;
    rating: number;
    isAccepted: boolean;
  }

export interface UserInfoDto {
  id: number;
  name: string;
  pictureUrl?: string;
}

export interface TagDto {
  id: number;
  name: string;
}

export interface QuestionDetailData {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author: UserInfoDto;
  tags: TagDto[];
  rating: number;
  answers: AnswerDto[];
}

const QuestionDetailPage = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [question, setQuestion] = useState<QuestionDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingState, setVotingState] = useState<'idle' | 'voting'>('idle');

  const contentRef = useRef<HTMLDivElement>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const sanitizedHtml = (html: string) => {
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true }
    });
  };

  const fetchQuestion = useCallback(async () => {
    if (!questionId) {
      setError("ID вопроса не предоставлен.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setQuestion(null); // Сбрасываем предыдущие данные вопроса при новой загрузке
    try {
      const response = await axios.get<QuestionDetailData>(`${API_URL}/Questions/${questionId}`);
      response.data.answers.sort((a, b) => (a.isAccepted && !b.isAccepted) ? -1 : ((!a.isAccepted && b.isAccepted) ? 1 : b.rating - a.rating));
      setQuestion(response.data);
    } catch (err) {
      console.error("Ошибка загрузки вопроса:", err);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          setError("Вопрос не найден (404).");
        } else {
          setError(`Не удалось загрузить вопрос. Ошибка ${err.response?.status || 'сети'}.`);
        }
      } else {
        setError("Произошла неизвестная ошибка при загрузке вопроса.");
      }
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  useEffect(() => {
    if (loading || !question || !contentRef.current) {
      return; // Выходим, если загрузка, нет данных или ref еще не привязан
    }

    // 1. Подсветка синтаксиса
    const codeBlocks = contentRef.current.querySelectorAll('pre code, pre.ql-syntax code');
    codeBlocks.forEach((block) => {
      if (!block.classList.contains('hljs') && !(block.parentElement?.classList.contains('hljs'))) {
          hljs.highlightElement(block as HTMLElement);
          if (block.parentElement && block.parentElement.tagName === 'PRE') {
            // Добавляем класс к родителю, чтобы знать, что он обработан
            block.parentElement.classList.add('hljs-processed-parent');
          }
      }
    });

    // 2. Добавление кнопок "Копировать"
    const preElements = contentRef.current.querySelectorAll('pre');
    preElements.forEach(pre => {
      if (pre.parentElement?.classList.contains('code-block-wrapper-dynamic')) {
        return;
      }
      if (pre.querySelector('button.copy-code-button')) { // Дополнительная проверка, если кнопка уже там
        return;
      }

      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.classList.add('code-block-wrapper-dynamic');

      const copyButton = document.createElement('button');
      copyButton.classList.add('copy-code-button'); // Класс для идентификации
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
          setSnackbarMessage("Код скопирован!");
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
  }, [loading, question]); // Зависимости


  const handleAnswerAdded = (newAnswer: AnswerDto) => {
    setQuestion(prevQuestion => {
        if (!prevQuestion) return null; // Эта проверка здесь на всякий случай
        const updatedAnswers = [...prevQuestion.answers, newAnswer]
            .sort((a, b) => (a.isAccepted && !b.isAccepted) ? -1 : ((!a.isAccepted && b.isAccepted) ? 1 : b.rating - a.rating));
        return { ...prevQuestion, answers: updatedAnswers };
    });
  };

  const handleQuestionVote = async (voteType: 'Up' | 'Down') => {
    if (authLoading || !user || !question || votingState === 'voting') return;
    setVotingState('voting');
    try {
      const response = await axios.post<{ newRating: number }>(`${API_URL}/questions/${question.id}/vote`, { voteType }, { withCredentials: true });
      setQuestion(prev => (prev ? { ...prev, rating: response.data.newRating } : null));
    } catch (error) { /* ... (обработка ошибок голосования) ... */ }
    finally { setVotingState('idle'); }
  };

  const handleAnswerVoteUpdate = (answerId: number, newRating: number) => {
    setQuestion(prevQuestion => {
        if (!prevQuestion) return null;
        const updatedAnswers = prevQuestion.answers.map(ans => ans.id === answerId ? { ...ans, rating: newRating } : ans)
            .sort((a, b) => (a.isAccepted && !b.isAccepted) ? -1 : ((!a.isAccepted && b.isAccepted) ? 1 : b.rating - a.rating));
        return { ...prevQuestion, answers: updatedAnswers };
    });
  };

  const formattedDate = (dateString: string) => {
    try { return formatDistanceToNow(parseISO(dateString), { addSuffix: true, locale: ru }); }
    catch (e) { return "недавно"; }
  };

  const getAnswerCountText = (count: number): string => {
    const cases = [2, 0, 1, 1, 1, 2];
    const titles = ['ответ', 'ответа', 'ответов'];
    return titles[(count % 100 > 4 && count % 100 < 20) ? 2 : cases[Math.min(count % 10, 5)]];
  };

  // Строгие проверки перед рендерингом основного контента
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 150px)' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Загрузка вопроса...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Container>
    );
  }

  if (!question) {
    // Это состояние может возникнуть, если setLoading(false) произошло, но setQuestion(null) или fetch не удался без установки error
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mt: 2 }}>Данные вопроса не доступны.</Alert>
      </Container>
    );
  }

  // Если мы дошли сюда, question точно не null
  return (
    <Container maxWidth="lg" sx={{ py: {xs: 2, md: 4} }}>
      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{wordBreak: 'break-word'}}>
          {question.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'text.secondary', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption">Задан: {formattedDate(question.createdAt)}</Typography>
          <Box sx={{display: 'flex', alignItems: 'center'}}>
            <Typography variant="caption" sx={{ mr: 0.5 }}>Автор:</Typography>
            <MuiLink component={RouterLink} to={`/profile/${question.author.id}`} sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }} color="inherit">
              <Avatar src={question.author.pictureUrl || undefined} alt={question.author.name} sx={{ width: 24, height: 24, mr: 0.5 }}>
                {!question.author.pictureUrl && <AccountCircleIcon fontSize="small" />}
              </Avatar>
              <Typography variant="caption" sx={{ '&:hover': { textDecoration: 'underline' } }}>{question.author.name}</Typography>
            </MuiLink>
          </Box>
        </Box>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', flexDirection: {xs: 'column', sm: 'row'} }}>
          <Box sx={{ mr: {xs: 0, sm: 3}, mb: {xs:2, sm:0}, textAlign: 'center', minWidth: {sm:'60px'}, display: 'flex', flexDirection: {xs:'row', sm: 'column'}, alignItems: 'center', justifyContent: {xs: 'flex-start', sm: 'flex-start'} }}>
            <Tooltip title="Полезный вопрос">
              <IconButton onClick={() => handleQuestionVote('Up')} size="small" disabled={votingState === 'voting' || authLoading}><ThumbUpAltOutlinedIcon /></IconButton>
            </Tooltip>
            <Typography variant="h5" component="div" sx={{ my: {sm: 0.5}, mx: {xs: 1, sm:0} }}>{question.rating ?? 0}</Typography>
            <Tooltip title="Бесполезный вопрос">
              <IconButton onClick={() => handleQuestionVote('Down')} size="small" disabled={votingState === 'voting' || authLoading}><ThumbDownAltOutlinedIcon /></IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <Box
              ref={contentRef}
              className="question-content"
              sx={{
                mb: 3, wordBreak: 'break-word', fontSize: '1rem',
                '& p': { marginBlockStart: '0.5em', marginBlockEnd: '0.5em', lineHeight: 1.6 },
                '& h1': { fontSize: '2em', mt: '1.2em', mb: '0.6em', lineHeight: 1.3, fontWeight: 600 },
                '& h2': { fontSize: '1.75em', mt: '1.2em', mb: '0.6em', lineHeight: 1.3, fontWeight: 600 },
                '& h3': { fontSize: '1.5em', mt: '1.2em', mb: '0.6em', lineHeight: 1.3, fontWeight: 600 },
                '& h4': { fontSize: '1.25em', mt: '1.2em', mb: '0.6em', lineHeight: 1.3, fontWeight: 600 },
                '& ul, & ol': { pl: '2em', my: '1em' }, // Увеличил отступы для списков
                '& li': { mb: '0.4em', lineHeight: 1.6 }, // Увеличил отступы для элементов списка
                '& a': { color: 'primary.main', textDecoration: 'underline', '&:hover': {textDecoration: 'none'} },
                '& img': { maxWidth: '100%', height: 'auto', borderRadius: '4px', my: 1 },
                '& blockquote': {
                    borderLeft: (theme) => `4px solid ${theme.palette.divider}`,
                    pl: '1em', ml: 0, my: '1em', color: 'text.secondary', fontStyle: 'italic',
                    '& p': { marginBlockStart: '0.25em', marginBlockEnd: '0.25em' } // Уменьшаем отступы параграфов внутри цитат
                },
                '& pre, & .ql-syntax': {
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#272822' : '#f4f6f8',
                  color: (theme) => theme.palette.mode === 'dark' ? '#f8f8f2' : '#212B36',
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  padding: '12px 16px', my: '16px', borderRadius: '8px', overflowX: 'auto',
                  fontFamily: '"Menlo", "Consolas", "Monaco", "Liberation Mono", "Lucida Console", monospace',
                  fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre', tabSize: 4,
                },
                '& pre code, & .ql-syntax code': {
                  fontFamily: 'inherit', fontSize: 'inherit', backgroundColor: 'transparent',
                  color: 'inherit', padding: 0, margin: 0, borderRadius: 0,
                  whiteSpace: 'inherit', display: 'block',
                },
                '& code:not(pre code)': {
                  fontFamily: '"Menlo", "Consolas", "Monaco", "Liberation Mono", "Lucida Console", monospace',
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(145, 158, 171, 0.16)' : 'rgba(145, 158, 171, 0.12)',
                  padding: '2px 6px', margin: '0 2px', fontSize: '13px', borderRadius: '6px',
                  wordBreak: 'break-all', color: (theme) => theme.palette.mode === 'dark' ? '#E3E3E3' : '#37474F'
                },
              }}
              dangerouslySetInnerHTML={{ __html: sanitizedHtml(question.content) }}
            />

            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {question.tags.map(tag => (
                <Chip key={tag.id} label={tag.name} size="small" component={RouterLink} to={`/?tags=${encodeURIComponent(tag.name)}`} clickable sx={{textTransform: 'lowercase'}}/>
              ))}
            </Box>
            <CommentList targetId={question.id} targetType="question" />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>{question.answers.length} {getAnswerCountText(question.answers.length)}</Typography>
            {question.answers.length > 0 ? (
                <List disablePadding sx={{mt: 2}}>
                {question.answers.map(answer => (
                    <ListItem key={answer.id} disablePadding sx={{ display: 'block', mb: 2 }}>
                    <AnswerCard answer={answer} onVote={handleAnswerVoteUpdate} questionAuthorId={question.author.id} />
                    </ListItem>
                ))}
                </List>
            ) : ( <Typography sx={{ mt: 2, color: 'text.secondary' }}>На этот вопрос пока нет ответов. Будьте первым!</Typography> )}
        </Box>
        {user && !authLoading && questionId && (
          <Box sx={{mt: 4}}>
            <Typography variant="h6" gutterBottom>Ваш ответ</Typography>
            <AddAnswerForm questionId={Number(questionId)} onAnswerAdded={handleAnswerAdded} />
          </Box>
        )}
         {!user && !authLoading && (
            <Alert severity="info" sx={{mt: 4}}>
                <MuiLink component={RouterLink} to="/login" state={{ from: location.pathname }} fontWeight="bold">Войдите</MuiLink>, чтобы оставить ответ.
            </Alert>
         )}
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2500}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
};

export default QuestionDetailPage;