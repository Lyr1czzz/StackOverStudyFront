// src/components/AnswerCard.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Paper, Box, Typography, Avatar, Link as MuiLink, Divider, IconButton,
  Tooltip, Button, Snackbar, useTheme, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, CircularProgress
} from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';
// Языки для hljs (если не зарегистрированы глобально)
// import javascript from 'highlight.js/lib/languages/javascript';
// hljs.registerLanguage('javascript', javascript);

import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DeleteIcon from '@mui/icons-material/Delete'; // Иконка удаления

import CommentList from './CommentList';
import { useAuth, AuthUser } from '../AuthContext'; // Импортируем AuthUser
import axios from 'axios';
import { AnswerDto } from '../pages/QuestionDetailPage';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7295/api';

interface AnswerCardProps {
  answer: AnswerDto;
  onVote: (answerId: number, newRating: number) => void;
  questionAuthorId: number;
  onAcceptAnswer: (answerId: number) => void;
  onAnswerDeleted: (answerId: number) => void; // Новый проп для колбэка удаления
}

const AnswerCard: React.FC<AnswerCardProps> = ({ answer, onVote, questionAuthorId, onAcceptAnswer, onAnswerDeleted }) => {
  const { user, loading: authLoading } = useAuth(); // user теперь AuthUser | null
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const [voteProcessing, setVoteProcessing] = useState(false);
  const [acceptProcessing, setAcceptProcessing] = useState(false);
  const [deleteProcessing, setDeleteProcessing] = useState(false); // Состояние для процесса удаления

  const answerContentRef = useRef<HTMLDivElement>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false); // Состояние для диалога удаления


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
  }, [answer.content, theme]);

  const handleVote = async (voteType: 'Up' | 'Down') => {
    if (authLoading || !user) { setSnackbarMessage("Нужна авторизация для голосования"); setSnackbarOpen(true); return; }
    if (voteProcessing) return;
    setVoteProcessing(true);
    try {
      const response = await axios.post<{ action: string, newRating: number }>(`${API_URL}/answers/${answer.id}/vote`, { voteType }, { withCredentials: true });
      onVote(answer.id, response.data.newRating);
      setSnackbarMessage(response.data.action === "removed vote" ? "Голос отменен." : "Голос учтён!"); setSnackbarOpen(true);
    } catch (error) {
      const message = axios.isAxiosError(error) ? (error.response?.data?.message || "Ошибка голосования") : "Неизвестная ошибка";
      setSnackbarMessage(message); setSnackbarOpen(true);
    } finally { setVoteProcessing(false); }
  };

  const handleAccept = async () => {
    if (authLoading || !user || acceptProcessing || user.id !== questionAuthorId) {
        if (!user && !authLoading) setSnackbarMessage("Нужна авторизация.");
        else if (user && user.id !== questionAuthorId && !answer.isAccepted) setSnackbarMessage("Только автор вопроса может принять ответ.");
        else if (answer.isAccepted) return; 
        setSnackbarOpen(true);
        return;
    }
    setAcceptProcessing(true);
    try {
      await axios.post(`${API_URL}/answers/${answer.id}/accept`, {}, { withCredentials: true });
      onAcceptAnswer(answer.id); 
    } catch (error) {
      const message = axios.isAxiosError(error) ? (error.response?.data?.message || "Не удалось принять ответ.") : "Произошла ошибка.";
      setSnackbarMessage(message); setSnackbarOpen(true);
    } finally { setAcceptProcessing(false); }
  };

  const handleDeleteAnswer = async () => {
    if (!user || !(user.role === 'Moderator' || user.role === 'Admin')) {
        setSnackbarMessage("У вас нет прав для удаления этого ответа.");
        setSnackbarOpen(true);
        return;
    }
    setOpenDeleteConfirm(false);
    setDeleteProcessing(true);
    try {
        await axios.delete(`${API_URL}/answers/${answer.id}`, { withCredentials: true });
        onAnswerDeleted(answer.id); // Вызываем колбэк для обновления списка в QuestionDetailPage
        // Snackbar об успехе удаления будет в QuestionDetailPage через onAnswerDeleted
    } catch (err) {
        console.error("Ошибка удаления ответа:", err);
        const message = axios.isAxiosError(err) ? (err.response?.data?.message || "Не удалось удалить ответ.") : "Произошла неизвестная ошибка.";
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

  const isCurrentUserAuthorOfQuestion = user?.id === questionAuthorId;
  const canModerate = user && (user.role === 'Moderator' || user.role === 'Admin');

  return (
    <>
    <Paper
      sx={{
        p: {xs: 1.5, sm: 2},
        borderColor: answer.isAccepted ? 'success.main' : 'divider',
        display: 'flex', flexDirection: {xs: 'column', sm: 'row'}, position: 'relative',
        boxShadow: answer.isAccepted ? (themeParam) => `0 0 10px ${themeParam.palette.success.light}` : 'none',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease',
        backgroundColor: answer.isAccepted 
            ? (theme.palette.mode === 'dark' ? 'rgba(102, 187, 106, 0.15)' : 'rgba(232, 245, 233, 0.7)') 
            : 'transparent',
      }}
    >
      {answer.isAccepted && (
        <Tooltip title="Принятый ответ">
          <CheckCircleIcon color="success" sx={{ position: 'absolute', top: {xs: 8, sm: 12}, right: {xs:8, sm:12}, fontSize: {xs: '1.6rem', sm:'1.85rem'} }} />
        </Tooltip>
      )}
      <Box sx={{ mr: {sm:2}, mb:{xs:1, sm:0}, textAlign: 'center', minWidth: {sm:'50px'}, display:'flex', flexDirection:{xs:'row', sm:'column'}, alignItems:'center', justifyContent:{xs:'flex-start', sm:'center'}, gap: {xs: 0.5, sm: 0.25} }}>
        <Tooltip title="Полезный ответ">
          <IconButton onClick={() => handleVote('Up')} size="medium" disabled={voteProcessing || authLoading || !user} sx={{ p: 0.75 }}> <ThumbUpAltOutlinedIcon fontSize="small" /> </IconButton>
        </Tooltip>
        <Typography variant="body1" component="div" sx={{ fontWeight: 'medium', color: answer.isAccepted ? 'success.dark' : 'text.primary' }}> {answer.rating ?? 0} </Typography>
        <Tooltip title="Бесполезный ответ">
          <IconButton onClick={() => handleVote('Down')} size="medium" disabled={voteProcessing || authLoading || !user} sx={{ p: 0.75 }}> <ThumbDownAltOutlinedIcon fontSize="small" /> </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ flexGrow: 1, width: {xs: '100%', sm: 'calc(100% - 70px)'}, overflow: 'hidden' }}>
        <Box ref={answerContentRef} className="answer-content" sx={{
            mb: 2, wordBreak: 'break-word', fontSize: '0.95rem', lineHeight: 1.7, color: 'text.primary',
            '& p': { marginBlockStart: '0.6em', marginBlockEnd: '0.6em' },
            '& h1,& h2,& h3,& h4,& h5,& h6': { mt: '1.5em', mb: '0.75em', lineHeight: 1.3, fontWeight: 600, color: 'text.primary' },
            '& ul,& ol': { pl: '2.5em', my: '1em' }, '& li': { mb: '0.5em' },
            '& a': { color: 'primary.main', textDecoration: 'underline', '&:hover': {textDecoration: 'none'} },
            '& img': { maxWidth: '100%', height: 'auto', borderRadius: `${theme.shape.borderRadius / 2}px`, my: 1.5 },
            '& blockquote': { borderLeft: `4px solid ${theme.palette.divider}`, pl: '1.5em', ml: 0, my: '1.5em', color: 'text.secondary', fontStyle: 'italic', backgroundColor: theme.palette.action.hover, py: 0.5, borderRadius: `${theme.shape.borderRadius / 2}px`, '& p': { marginBlockStart: '0.25em', marginBlockEnd: '0.25em' } },
            '& pre, & .ql-syntax': { backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100], color: theme.palette.text.primary, border: `1px solid ${theme.palette.divider}`, padding: theme.spacing(1.5, 2), my: theme.spacing(2), borderRadius: `${theme.shape.borderRadius}px`, overflowX: 'auto', fontFamily: '"Menlo", "Consolas", "Monaco", "Liberation Mono", "Lucida Console", monospace', fontSize: '0.9rem', lineHeight: 1.6, },
            '& pre code, & .ql-syntax code': { fontFamily: 'inherit', fontSize: 'inherit', backgroundColor: 'transparent', color: 'inherit', padding: 0, margin: 0, borderRadius: 0, whiteSpace: 'inherit', display: 'block', },
            '& code:not(pre code):not(.ql-syntax code)': { fontFamily: '"Menlo", "Consolas", "Monaco", "Liberation Mono", "Lucida Console", monospace', backgroundColor: theme.palette.action.selected, padding: '3px 6px', margin: '0 2px', fontSize: '0.875rem', borderRadius: `${theme.shape.borderRadius / 1.5}px`, wordBreak: 'break-all', color: theme.palette.text.primary },
          }} dangerouslySetInnerHTML={{ __html: sanitizedHtml(answer.content) }} />
        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{display: 'flex', gap: 1, alignItems: 'center'}}>
            {(isCurrentUserAuthorOfQuestion && !answer.isAccepted) && ( <Button size="small" variant="outlined" color="success" startIcon={<CheckCircleIcon />} onClick={handleAccept} disabled={acceptProcessing || authLoading || !user}>Принять ответ</Button> )}
            {(isCurrentUserAuthorOfQuestion && answer.isAccepted) && ( <Button size="small" variant="contained" color="success" startIcon={<CheckCircleIcon />} disabled sx={{cursor: 'default', '&.Mui-disabled': { backgroundColor: 'success.main', color: 'success.contrastText', opacity: 0.8 } }}>Ответ принят</Button> )}
            {canModerate && (
                <Tooltip title="Удалить ответ (Модератор)">
                    <IconButton 
                        onClick={() => setOpenDeleteConfirm(true)} 
                        size="small" 
                        color="error" 
                        disabled={deleteProcessing} 
                        sx={{p: 0.5, '&:hover': {bgcolor: 'error.lighter', color: 'error.dark'}}}
                    >
                        {deleteProcessing ? <CircularProgress size={16} color="inherit"/> : <DeleteIcon fontSize="small"/>}
                    </IconButton>
                </Tooltip>
            )}
          </Box>
          <Box sx={{ flexGrow: (isCurrentUserAuthorOfQuestion || canModerate) ? 0 : 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', ml: (isCurrentUserAuthorOfQuestion || canModerate) ? 'auto' : 0 }}>
            <Typography variant="caption" sx={{ mr: 0.5 }}> Ответил(а) {formattedDate(answer.createdAt)} </Typography>
            <MuiLink component={RouterLink} to={`/profile/${answer.author.id}`} sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }} color="inherit">
              <Tooltip title={answer.author.name} placement="top">
                <Avatar src={answer.author.pictureUrl || undefined} alt={answer.author.name} sx={{ width: 24, height: 24, mr: 0.75 }}> {!answer.author.pictureUrl && <AccountCircleIcon fontSize="small" />} </Avatar>
              </Tooltip>
              <Typography variant="caption" sx={{ '&:hover': { textDecoration: 'underline', color: 'primary.main' } }}> {answer.author.name} </Typography>
            </MuiLink>
          </Box>
        </Box>
        <CommentList targetId={answer.id} targetType="answer" />
      </Box>
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} message={snackbarMessage} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Paper>

    <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)} aria-labelledby="delete-answer-dialog-title">
        <DialogTitle id="delete-answer-dialog-title">Подтвердите удаление</DialogTitle>
        <DialogContent><DialogContentText>Вы уверены, что хотите удалить этот ответ? Это действие необратимо.</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteConfirm(false)}>Отмена</Button>
          <Button onClick={handleDeleteAnswer} color="error" disabled={deleteProcessing}>
            {deleteProcessing ? <CircularProgress size={20} color="inherit"/> : "Удалить ответ"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AnswerCard;