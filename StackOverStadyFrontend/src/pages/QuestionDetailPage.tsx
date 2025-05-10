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
// Убедитесь, что у вас установлены и импортированы нужные языки для highlight.js, например:
// import javascript from 'highlight.js/lib/languages/javascript';
// import python from 'highlight.js/lib/languages/python';
// import xml from 'highlight.js/lib/languages/xml'; // HTML тоже
// import css from 'highlight.js/lib/languages/css';
// import csharp from 'highlight.js/lib/languages/csharp';
// hljs.registerLanguage('javascript', javascript);
// hljs.registerLanguage('python', python);
// hljs.registerLanguage('xml', xml);
// hljs.registerLanguage('css', css);
// hljs.registerLanguage('csharp', csharp);


import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
// CheckCircleIcon не нужен здесь, он будет в AnswerCard для кнопки

import AddAnswerForm from '../components/AddAnswerForm'; // Предполагается, что этот компонент у вас есть
import CommentList from '../components/CommentList';     // И этот тоже
import { useAuth } from '../AuthContext';             // И AuthContext
import AnswerCard from '../components/AnswerCard';    // Наш AnswerCard

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7295/api'; // Убедитесь, что URL корректный

export interface AnswerDto {
    id: number;
    content: string;
    createdAt: string;
    author: UserInfoDto;
    rating: number;
    isAccepted: boolean; // Важное поле
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
  const [votingState, setVotingState] = useState<'idle' | 'voting'>('idle'); // Для голосования за вопрос

  const contentRef = useRef<HTMLDivElement>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const sanitizedHtml = (html: string) => {
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ADD_TAGS: ['iframe'], // Разрешаем iframe (например, для YouTube)
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'title', 'width', 'height'], // Атрибуты для iframe и других
    });
  };

  const sortAnswers = (answers: AnswerDto[]): AnswerDto[] => {
    return [...answers].sort((a, b) => {
        if (a.isAccepted && !b.isAccepted) return -1;
        if (!a.isAccepted && b.isAccepted) return 1;
        if (b.rating !== a.rating) return b.rating - a.rating;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Сначала новые, если рейтинг одинаковый
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
    setQuestion(null);
    try {
      const response = await axios.get<QuestionDetailData>(`${API_URL}/Questions/${questionId}`);
      // Сортировка ответов: принятый первым, затем по рейтингу, затем по дате
      response.data.answers = sortAnswers(response.data.answers);
      setQuestion(response.data);
    } catch (err) {
      console.error("Ошибка загрузки вопроса:", err);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          setError("Вопрос не найден (404).");
        } else {
          const errData = err.response?.data as { message?: string };
          setError(`Не удалось загрузить вопрос. ${errData?.message || `Ошибка ${err.response?.status || 'сети'}`}.`);
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
      return;
    }
    const currentContentRef = contentRef.current;

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
    const preElements = currentContentRef.querySelectorAll('pre:not(.code-block-wrapper-dynamic pre)'); // Избегаем дублирования
    preElements.forEach(pre => {
      if (pre.querySelector('button.copy-code-button')) { // Если кнопка уже есть
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
  }, [loading, question, question?.content]); // Перезапускаем при изменении контента вопроса


  const handleAnswerAdded = useCallback((newAnswer: AnswerDto) => {
    setQuestion(prevQuestion => {
        if (!prevQuestion) return null;
        const updatedAnswers = sortAnswers([...prevQuestion.answers, newAnswer]);
        return { ...prevQuestion, answers: updatedAnswers };
    });
    setSnackbarMessage("Ответ успешно добавлен!");
    setSnackbarOpen(true);
  }, []);

  const handleQuestionVote = async (voteType: 'Up' | 'Down') => {
    if (authLoading || !user || !question || votingState === 'voting') {
        if(!user && !authLoading) {
            setSnackbarMessage("Нужна авторизация для голосования за вопрос");
            setSnackbarOpen(true);
            // navigate('/login', { state: { from: location } }); // опционально
        }
        return;
    }
    setVotingState('voting');
    try {
      // Используем ваш VotesController
      const response = await axios.post<{ action: string, newRating: number }>(
        `${API_URL}/questions/${question.id}/vote`,
        { voteType },
        { withCredentials: true }
      );
      setQuestion(prev => (prev ? { ...prev, rating: response.data.newRating } : null));
      setSnackbarMessage(response.data.action === "removed vote" ? "Голос за вопрос отменен." : "Голос за вопрос учтён!");
      setSnackbarOpen(true);
    } catch (error) {
        console.error("Ошибка голосования за вопрос:", error);
        if (axios.isAxiosError(error)) {
             setSnackbarMessage(error.response?.data?.message || "Ошибка голосования за вопрос");
        } else {
            setSnackbarMessage("Неизвестная ошибка голосования за вопрос");
        }
        setSnackbarOpen(true);
    }
    finally { setVotingState('idle'); }
  };

  // Этот колбэк будет вызван из AnswerCard при успешном голосовании за ответ
  const handleAnswerVoteUpdate = useCallback((answerId: number, newRating: number) => {
    setQuestion(prevQuestion => {
        if (!prevQuestion) return null;
        const updatedAnswers = prevQuestion.answers.map(ans =>
            ans.id === answerId ? { ...ans, rating: newRating } : ans
        );
        return { ...prevQuestion, answers: sortAnswers(updatedAnswers) };
    });
    // Snackbar об успехе голосования за ответ будет в AnswerCard
  }, []);

  // Этот колбэк будет вызван из AnswerCard при успешном принятии ответа
  const handleAcceptAnswerConfirmed = useCallback((acceptedAnswerId: number) => {
    setQuestion(prevQuestion => {
      if (!prevQuestion) return null;

      const newAnswers = prevQuestion.answers.map(ans => ({
        ...ans,
        isAccepted: ans.id === acceptedAnswerId, // Принимаем новый
      }));
      
      setSnackbarMessage("Ответ успешно принят!");
      setSnackbarOpen(true);
      return { ...prevQuestion, answers: sortAnswers(newAnswers) };
    });
  }, []);


  const formattedDate = (dateString: string): string => {
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true, locale: ru });
    } catch (e) {
      console.warn("Invalid date for formatting:", dateString);
      return "недавно";
    }
  };

  const getAnswerCountText = (count: number): string => {
    if (count === 0) return 'ответов';
    const rem100 = count % 100;
    if (rem100 >= 5 && rem100 <= 20) return 'ответов';
    const rem10 = count % 10;
    if (rem10 === 1) return 'ответ';
    if (rem10 >= 2 && rem10 <= 4) return 'ответа';
    return 'ответов';
  };

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
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mt: 2 }}>Данные вопроса не доступны.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: {xs: 2, md: 4} }}>
      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}> {/* Добавил borderRadius */}
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
          <Box sx={{ mr: {xs: 0, sm: 3}, mb: {xs:2, sm:0}, textAlign: 'center', minWidth: {sm:'60px'}, display: 'flex', flexDirection: {xs:'row', sm: 'column'}, alignItems: 'center', justifyContent: {xs: 'flex-start', sm: 'center'} }}>
            <Tooltip title="Полезный вопрос">
              <IconButton onClick={() => handleQuestionVote('Up')} size="small" disabled={votingState === 'voting' || authLoading || !user}><ThumbUpAltOutlinedIcon /></IconButton>
            </Tooltip>
            <Typography variant="h5" component="div" sx={{ my: {sm: 0.5}, mx: {xs: 1, sm:0} }}>{question.rating ?? 0}</Typography>
            <Tooltip title="Бесполезный вопрос">
              <IconButton onClick={() => handleQuestionVote('Down')} size="small" disabled={votingState === 'voting' || authLoading || !user}><ThumbDownAltOutlinedIcon /></IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ flexGrow: 1, overflow: 'hidden' /* Для корректного рендеринга контента */ }}>
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
                '& ul, & ol': { pl: '2em', my: '1em' },
                '& li': { mb: '0.4em', lineHeight: 1.6 },
                '& a': { color: 'primary.main', textDecoration: 'underline', '&:hover': {textDecoration: 'none'} },
                '& img': { maxWidth: '100%', height: 'auto', borderRadius: '4px', my: 1 },
                '& blockquote': {
                    borderLeft: (theme) => `4px solid ${theme.palette.divider}`,
                    pl: '1em', ml: 0, my: '1em', color: 'text.secondary', fontStyle: 'italic',
                    '& p': { marginBlockStart: '0.25em', marginBlockEnd: '0.25em' }
                },
                '& pre, & .ql-syntax': {
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#2D2D2D' : '#F8F9FA', // Немного другие цвета
                  color: (theme) => theme.palette.mode === 'dark' ? '#F8F8F2' : '#212B36',
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
                '& code:not(pre code):not(.ql-syntax code)': {
                  fontFamily: '"Menlo", "Consolas", "Monaco", "Liberation Mono", "Lucida Console", monospace',
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(145, 158, 171, 0.16)' : 'rgba(222, 226, 230, 0.5)', // Чуть светлее инлайн
                  padding: '2px 6px', margin: '0 2px', fontSize: '13px', borderRadius: '6px',
                  wordBreak: 'break-all', color: (theme) => theme.palette.mode === 'dark' ? '#E0E0E0' : '#343A40' // Темнее текст для инлайна
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
                    <AnswerCard
                        answer={answer}
                        onVote={handleAnswerVoteUpdate}
                        questionAuthorId={question.author.id}
                        onAcceptAnswer={handleAcceptAnswerConfirmed}
                     />
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
            <Alert severity="info" sx={{mt: 4, borderRadius: 2}}>
                <MuiLink component={RouterLink} to="/login" state={{ from: location.pathname }} fontWeight="bold">Войдите</MuiLink>, чтобы оставить ответ.
            </Alert>
         )}
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000} // Увеличил немного
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
};

export default QuestionDetailPage;