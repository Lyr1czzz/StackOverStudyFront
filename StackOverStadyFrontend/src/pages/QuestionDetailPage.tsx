// src/pages/QuestionDetailPage.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Link as MuiLink,
  Divider,
  List,
  ListItem,
  IconButton,
  Tooltip,
  Snackbar,
  useTheme,
  Button, // Для кнопки удаления
  Dialog, // Для подтверждения удаления
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';
// Пример импорта языков для hljs (раскомментируй и добавь нужные)
// import javascript from 'highlight.js/lib/languages/javascript';
// hljs.registerLanguage('javascript', javascript);

import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DeleteIcon from '@mui/icons-material/Delete'; // Иконка удаления

import AddAnswerForm from '../components/AddAnswerForm';
import CommentList from '../components/CommentList';
import { useAuth } from '../AuthContext'; // Импортируем AuthUser
import AnswerCard from '../components/AnswerCard';

const API_URL = import.meta.env.VITE_API_URL;

export interface AnswerDto {
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
  const { user, loading: authLoading } = useAuth(); // user теперь AuthUser | null
  const theme = useTheme();

  const [question, setQuestion] = useState<QuestionDetailData | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [errorPage, setErrorPage] = useState<string | null>(null);
  const [votingState, setVotingState] = useState<'idle' | 'voting'>('idle');

  const contentRef = useRef<HTMLDivElement>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [deleteProcessing, setDeleteProcessing] = useState(false);

  const sanitizedHtml = (html: string) => {
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'title', 'width', 'height'],
    });
  };

  const sortAnswers = (answers: AnswerDto[]): AnswerDto[] => {
    return [...answers].sort((a, b) => {
        if (a.isAccepted && !b.isAccepted) return -1;
        if (!a.isAccepted && b.isAccepted) return 1;
        if (b.rating !== a.rating) return b.rating - a.rating;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  };

  const fetchQuestion = useCallback(async () => {
    if (!questionId) {
      setErrorPage("ID вопроса не предоставлен.");
      setLoadingPage(false);
      return;
    }
    setLoadingPage(true);
    setErrorPage(null);
    setQuestion(null);
    try {
      const response = await axios.get<QuestionDetailData>(`${API_URL}/api/Questions/${questionId}`);
      response.data.answers = sortAnswers(response.data.answers);
      setQuestion(response.data);
    } catch (err) {
      console.error("Ошибка загрузки вопроса:", err);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          setErrorPage("Вопрос не найден (404).");
        } else {
          const errData = err.response?.data as { message?: string };
          setErrorPage(`Не удалось загрузить вопрос. ${errData?.message || `Ошибка ${err.response?.status || 'сети'}`}.`);
        }
      } else {
        setErrorPage("Произошла неизвестная ошибка при загрузке вопроса.");
      }
    } finally {
      setLoadingPage(false);
    }
  }, [questionId]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  useEffect(() => {
    if (loadingPage || !question || !contentRef.current) return;
    const currentContentRef = contentRef.current;
    currentContentRef.querySelectorAll<HTMLElement>('pre code:not([data-highlighted]), pre.ql-syntax code:not([data-highlighted])').forEach((block) => {
        hljs.highlightElement(block);
        block.dataset.highlighted = 'true';
    });
    currentContentRef.querySelectorAll<HTMLPreElement>('pre:not(.code-block-wrapper pre)').forEach(pre => {
      if (pre.querySelector('button.copy-code-button')) return;
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.classList.add('code-block-wrapper');
      const copyButton = document.createElement('button');
      copyButton.classList.add('copy-code-button');
      const svgIcon = `<svg fill="currentColor" width="16px" height="16px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;
      copyButton.innerHTML = svgIcon;
      Object.assign(copyButton.style, {
        position: 'absolute', top: '8px', right: '8px', zIndex: '1',
        backgroundColor: theme.palette.action.hover, border: `1px solid ${theme.palette.divider}`,
        borderRadius: `${theme.shape.borderRadius / 2}px`, padding: '4px 6px', cursor: 'pointer', lineHeight: '0',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.palette.text.secondary
      });
      copyButton.onmouseover = () => { copyButton.style.backgroundColor = theme.palette.action.selected; copyButton.style.color = theme.palette.text.primary; };
      copyButton.onmouseout = () => { copyButton.style.backgroundColor = theme.palette.action.hover; copyButton.style.color = theme.palette.text.secondary; };
      copyButton.onclick = async () => {
        const codeToCopy = pre.textContent || '';
        try { await navigator.clipboard.writeText(codeToCopy); setSnackbarMessage("Код скопирован!"); setSnackbarOpen(true); }
        catch (err) { console.error('Failed to copy: ', err); setSnackbarMessage("Ошибка копирования!"); setSnackbarOpen(true); }
      };
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre); wrapper.appendChild(copyButton);
    });
  }, [loadingPage, question, theme]);

  const handleAnswerAdded = useCallback((newAnswer: AnswerDto) => {
    setQuestion(prev => prev ? { ...prev, answers: sortAnswers([...prev.answers, newAnswer]) } : null);
    setSnackbarMessage("Ответ успешно добавлен!"); setSnackbarOpen(true);
  }, []);

  const handleQuestionVote = async (voteType: 'Up' | 'Down') => {
    if (authLoading || !user || !question || votingState === 'voting') {
        if(!user && !authLoading) { setSnackbarMessage("Нужна авторизация для голосования"); setSnackbarOpen(true); }
        return;
    }
    setVotingState('voting');
    try {
      const response = await axios.post<{ action: string, newRating: number }>(`${API_URL}/api/questions/${question.id}/vote`, { voteType }, { withCredentials: true });
      setQuestion(prev => (prev ? { ...prev, rating: response.data.newRating } : null));
      setSnackbarMessage(response.data.action === "removed vote" ? "Голос отменен." : "Голос учтён!"); setSnackbarOpen(true);
    } catch (error) {
        const message = axios.isAxiosError(error) ? (error.response?.data?.message || "Ошибка голосования") : "Неизвестная ошибка";
        setSnackbarMessage(message); setSnackbarOpen(true);
    } finally { setVotingState('idle'); }
  };

  const handleAnswerVoteUpdate = useCallback((answerId: number, newRating: number) => {
    setQuestion(prev => prev ? { ...prev, answers: sortAnswers(prev.answers.map(ans => ans.id === answerId ? { ...ans, rating: newRating } : ans)) } : null);
  }, []);

  const handleAnswerDeleted = useCallback((deletedAnswerId: number) => {
    setQuestion(prev => prev ? { ...prev, answers: sortAnswers(prev.answers.filter(ans => ans.id !== deletedAnswerId)) } : null);
    setSnackbarMessage("Ответ удален."); setSnackbarOpen(true);
  }, []);

  const handleAcceptAnswerConfirmed = useCallback((acceptedAnswerId: number) => {
    setQuestion(prev => prev ? { ...prev, answers: sortAnswers(prev.answers.map(ans => ({ ...ans, isAccepted: ans.id === acceptedAnswerId }))) } : null);
    setSnackbarMessage("Ответ успешно принят!"); setSnackbarOpen(true);
  }, []);

  const handleDeleteQuestion = async () => {
    if (!question) return;
    setOpenDeleteConfirm(false);
    setDeleteProcessing(true);
    try {
        await axios.delete(`${API_URL}/api/Questions/${question.id}`, { withCredentials: true });
        setSnackbarMessage("Вопрос успешно удален.");
        setSnackbarOpen(true);
        navigate('/'); 
    } catch (err) {
        console.error("Ошибка удаления вопроса:", err);
        const message = axios.isAxiosError(err) ? (err.response?.data?.message || "Не удалось удалить вопрос.") : "Произошла неизвестная ошибка.";
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    } finally {
        setDeleteProcessing(false);
    }
  };

  const formattedDate = (dateString: string): string => { 
    try { return formatDistanceToNow(parseISO(dateString), { addSuffix: true, locale: ru }); }
    catch (e) { return "недавно"; }
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

  const canModerate = user && (user.role === 'Moderator' || user.role === 'Admin');

  if (loadingPage) {
    return (
      <Box sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Загрузка вопроса...</Typography>
      </Box>
    );
  }

  if (errorPage) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mt: 2, borderRadius: theme.shape.borderRadius }}>{errorPage}</Alert>
      </Box>
    );
  }

  if (!question) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mt: 2, borderRadius: theme.shape.borderRadius }}>Данные вопроса не доступны.</Alert>
      </Box>
    );
  }

  return (
    <>
      <Box> 
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1 }}>
            <Typography variant="h4" component="h1" sx={{wordBreak: 'break-word', flexGrow: 1}}>
            {question.title}
            </Typography>
            {canModerate && (
                <Tooltip title="Удалить вопрос (Модератор)">
                    <IconButton 
                        onClick={() => setOpenDeleteConfirm(true)} 
                        size="small" 
                        color="error" 
                        sx={{p: 0.75, mt: 0.5, flexShrink: 0, '&:hover': {bgcolor: 'error.lighter', color: 'error.dark'}}} // Добавил hover стиль
                        disabled={deleteProcessing}
                    >
                        {deleteProcessing ? <CircularProgress size={20} color="inherit"/> : <DeleteIcon />}
                    </IconButton>
                </Tooltip>
            )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, color: 'text.secondary', flexWrap: 'wrap', gap: 1.5 }}>
          <Typography variant="caption">Задан: {formattedDate(question.createdAt)}</Typography>
          <Box sx={{display: 'flex', alignItems: 'center'}}>
            <Typography variant="caption" sx={{ mr: 0.5 }}>Автор:</Typography>
            <MuiLink component={RouterLink} to={`/profile/${question.author.id}`} sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }} color="inherit">
              <Avatar src={question.author.pictureUrl || undefined} alt={question.author.name} sx={{ width: 24, height: 24, mr: 0.75 }}>
                {!question.author.pictureUrl && <AccountCircleIcon fontSize="small" />}
              </Avatar>
              <Typography variant="caption" sx={{ '&:hover': { textDecoration: 'underline', color: 'primary.main' } }}>{question.author.name}</Typography>
            </MuiLink>
          </Box>
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        <Box sx={{ display: 'flex', flexDirection: {xs: 'column', sm: 'row'} }}>
          <Box sx={{ 
            mr: {xs: 0, sm: 2.5}, mb: {xs:2, sm:0}, textAlign: 'center', minWidth: {sm:'50px'}, 
            display: 'flex', flexDirection: {xs:'row', sm: 'column'}, alignItems: 'center', 
            justifyContent: {xs: 'flex-start', sm: 'center'}, gap: {xs: 0.5, sm: 0.25}
          }}>
            <Tooltip title="Полезный вопрос">
              <IconButton onClick={() => handleQuestionVote('Up')} size="medium" disabled={votingState === 'voting' || authLoading || !user} sx={{ p: 0.75 }}>
                <ThumbUpAltOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Typography variant="h5" component="div" sx={{ fontWeight: 'medium' }}>{question.rating ?? 0}</Typography>
            <Tooltip title="Бесполезный вопрос">
              <IconButton onClick={() => handleQuestionVote('Down')} size="medium" disabled={votingState === 'voting' || authLoading || !user} sx={{ p: 0.75 }}>
                <ThumbDownAltOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <Box
              ref={contentRef}
              className="question-content"
              sx={{
                mb: 3, wordBreak: 'break-word', fontSize: '1rem', lineHeight: 1.7, color: 'text.primary',
                '& p': { marginBlockStart: '0.6em', marginBlockEnd: '0.6em' },
                '& h1,& h2,& h3,& h4,& h5,& h6': { mt: '1.5em', mb: '0.75em', lineHeight: 1.3, fontWeight: 600, color: 'text.primary' },
                '& ul,& ol': { pl: '2.5em', my: '1em' }, '& li': { mb: '0.5em' },
                '& a': { color: 'primary.main', textDecoration: 'underline', '&:hover': {textDecoration: 'none'} },
                '& img': { maxWidth: '100%', height: 'auto', borderRadius: `${theme.shape.borderRadius / 2}px`, my: 1.5 },
                '& blockquote': {
                    borderLeft: `4px solid ${theme.palette.divider}`, pl: '1.5em', ml: 0, my: '1.5em', 
                    color: 'text.secondary', fontStyle: 'italic', backgroundColor: theme.palette.action.hover,
                    py: 0.5, borderRadius: `${theme.shape.borderRadius / 2}px`,
                    '& p': { marginBlockStart: '0.25em', marginBlockEnd: '0.25em' }
                },
                '& pre, & .ql-syntax': {
                  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100],
                  color: theme.palette.text.primary, border: `1px solid ${theme.palette.divider}`,
                  padding: theme.spacing(1.5, 2), my: theme.spacing(2), borderRadius: `${theme.shape.borderRadius}px`, 
                  overflowX: 'auto', fontFamily: '"Menlo", "Consolas", "Monaco", "Liberation Mono", "Lucida Console", monospace',
                  fontSize: '0.9rem', lineHeight: 1.6,
                },
                '& pre code, & .ql-syntax code': { fontFamily: 'inherit', fontSize: 'inherit', backgroundColor: 'transparent', color: 'inherit', padding: 0, margin: 0, borderRadius: 0, whiteSpace: 'inherit', display: 'block' },
                '& code:not(pre code):not(.ql-syntax code)': {
                  fontFamily: '"Menlo", "Consolas", "Monaco", "Liberation Mono", "Lucida Console", monospace',
                  backgroundColor: theme.palette.action.selected, padding: '3px 6px', margin: '0 2px', 
                  fontSize: '0.875rem', borderRadius: `${theme.shape.borderRadius / 1.5}px`,
                  wordBreak: 'break-all', color: theme.palette.text.primary
                },
              }}
              dangerouslySetInnerHTML={{ __html: sanitizedHtml(question.content) }}
            />
            <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {question.tags.map(tag => ( <Chip key={tag.id} label={tag.name} size="small" component={RouterLink} to={`/?tags=${encodeURIComponent(tag.name)}&page=1`} clickable /> ))}
            </Box>
            <CommentList targetId={question.id} targetType="question" />
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />
        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom sx={{mb: 2.5}}>{question.answers.length} {getAnswerCountText(question.answers.length)}</Typography>
            {question.answers.length > 0 ? (
                <List disablePadding>
                {question.answers.map(answer => (
                    <ListItem key={answer.id} disablePadding sx={{ display: 'block', mb: 2.5 }}>
                    <AnswerCard
                        answer={answer}
                        onVote={handleAnswerVoteUpdate}
                        questionAuthorId={question.author.id}
                        onAcceptAnswer={handleAcceptAnswerConfirmed}
                        onAnswerDeleted={handleAnswerDeleted} // Передаем колбэк
                     />
                    </ListItem>
                ))}
                </List>
            ) : ( <Typography sx={{ mt: 2, color: 'text.secondary', fontStyle: 'italic' }}>На этот вопрос пока нет ответов.</Typography> )}
        </Box>
        
        {user && !authLoading && questionId && (
          <Box sx={{mt: 4, pt: 3, borderTop: 1, borderColor: 'divider'}}>
            <Typography variant="h6" gutterBottom sx={{mb: 1.5}}>Ваш ответ</Typography>
            <AddAnswerForm questionId={Number(questionId)} onAnswerAdded={handleAnswerAdded} />
          </Box>
        )}
         {!user && !authLoading && ( <Alert severity="info" sx={{mt: 4}}> <MuiLink component={RouterLink} to="/login" state={{ from: location.pathname }} fontWeight="bold">Войдите</MuiLink>, чтобы оставить ответ. </Alert> )}
      </Box>

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} message={snackbarMessage} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
      
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)} aria-labelledby="delete-question-dialog-title">
        <DialogTitle id="delete-question-dialog-title">Подтвердите удаление</DialogTitle>
        <DialogContent><DialogContentText>Вы уверены, что хотите удалить этот вопрос? Это действие необратимо, и все связанные с ним ответы и комментарии также будут удалены.</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteConfirm(false)}>Отмена</Button>
          <Button onClick={handleDeleteQuestion} color="error" disabled={deleteProcessing}>
            {deleteProcessing ? <CircularProgress size={20} color="inherit"/> : "Удалить вопрос"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuestionDetailPage;