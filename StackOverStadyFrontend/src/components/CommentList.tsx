import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box, Typography, CircularProgress, Divider, Button, useTheme,
  Link as MuiLink, Alert, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Snackbar
} from '@mui/material';
import CommentItem from './CommentItem';
import AddCommentForm from './AddCommentForm';
import { useAuth } from '../AuthContext'; // Импортируем AuthUser
import { Link as RouterLink, useLocation } from 'react-router-dom';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7295/api';

export interface CommentData {
    id: number;
    text: string;
    createdAt: string;
    user: { id: number; name: string; pictureUrl?: string; }; // pictureUrl опциональный
}

interface CommentListProps {
    targetId: number;
    targetType: 'question' | 'answer';
}

const CommentList: React.FC<CommentListProps> = ({ targetId, targetType }) => {
    const [comments, setComments] = useState<CommentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const { user } = useAuth(); // user: AuthUser | null
    const theme = useTheme();
    const location = useLocation();

    const [commentToDelete, setCommentToDelete] = useState<CommentData | null>(null);
    const [deleteProcessing, setDeleteProcessing] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");

    const apiUrl = targetType === 'question'
        ? `${API_URL}/questions/${targetId}/comments`
        : `${API_URL}/answers/${targetId}/comments`;

    const fetchComments = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const response = await axios.get<CommentData[]>(apiUrl, { withCredentials: true });
            // Сортируем комментарии по дате создания (сначала новые)
            setComments(response.data.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (err) {
            console.error(`Ошибка загрузки комментариев для ${targetType} ${targetId}:`, err);
            setError("Не удалось загрузить комментарии.");
        } finally { setLoading(false); }
    }, [apiUrl, targetType, targetId]);

    useEffect(() => { fetchComments(); }, [fetchComments]);

    const handleCommentAdded = (newComment: CommentData) => {
        // Добавляем новый комментарий в начало списка
        setComments(prev => [newComment, ...prev].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setShowAddForm(false);
        setSnackbarMessage("Комментарий добавлен.");
        setSnackbarOpen(true);
    };

    const handleCancelAddForm = () => setShowAddForm(false);

    const openDeleteConfirmationDialog = (comment: CommentData) => {
        setCommentToDelete(comment);
    };

    const handleDeleteCommentConfirmed = async () => {
        if (!commentToDelete || !user) return; // Дополнительная проверка на user

        const canActuallyDelete = (user.role === 'Admin' || user.role === 'Moderator') || user.id === commentToDelete.user.id;
        if (!canActuallyDelete) {
            setSnackbarMessage("У вас нет прав для удаления этого комментария.");
            setSnackbarOpen(true);
            setCommentToDelete(null);
            return;
        }

        setDeleteProcessing(true);
        try {
            await axios.delete(`${API_URL}/Comments/${commentToDelete.id}`, { withCredentials: true });
            setComments(prev => prev.filter(c => c.id !== commentToDelete.id));
            setSnackbarMessage("Комментарий удален.");
            setSnackbarOpen(true);
        } catch (err) {
            console.error("Ошибка удаления комментария:", err);
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || "Не удалось удалить комментарий.") : "Произошла ошибка.";
            setSnackbarMessage(message);
            setSnackbarOpen(true);
        } finally {
            setDeleteProcessing(false);
            setCommentToDelete(null); // Закрываем диалог
        }
    };

    const canCurrentUserModerate = user && (user.role === 'Admin' || user.role === 'Moderator');

    return (
        <>
        <Box sx={{ 
            mt: 2, 
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : theme.palette.action.hover,
            borderRadius: `${theme.shape.borderRadius / 1.5}px`,
            overflow: 'hidden' 
        }}>
            {(comments.length > 0 || user) && (
                <Box sx={{px: 1.5, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Комментарии ({comments.length})
                    </Typography>
                    {user && !showAddForm && (
                         <Button
                            size="small"
                            onClick={() => setShowAddForm(true)}
                            startIcon={<AddCircleOutlineIcon sx={{fontSize: '1rem'}}/>}
                            sx={{ 
                                color: 'text.secondary',
                                fontWeight: 400,
                                fontSize: '0.75rem',
                                p: '2px 6px', // Компактнее
                                '&:hover': { bgcolor: theme.palette.action.selected }
                            }}
                            variant="text"
                        >
                            Добавить
                        </Button>
                    )}
                </Box>
            )}
            
            { (comments.length > 0 || (user && showAddForm)) && <Divider sx={{mb: comments.length > 0 ? 0 : (showAddForm ? 1 : 0)}}/> }

            {loading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />}
            {error && <Alert severity="error" sx={{m:1, fontSize: '0.8rem'}}>{error}</Alert>}

            {!loading && !error && comments.length > 0 && (
                <Box sx={{ maxHeight: '300px', overflowY: 'auto',
                     '&::-webkit-scrollbar': { width: '5px' },
                     '&::-webkit-scrollbar-thumb': { backgroundColor: theme.palette.action.disabled, borderRadius: '3px' }
                }}>
                    {comments.map((comment, index) => (
                        <CommentItem 
                            key={comment.id} 
                            comment={comment} 
                            canDelete={canCurrentUserModerate || user?.id === comment.user.id}
                            onDeleteRequest={() => openDeleteConfirmationDialog(comment)}
                            isFirst={index === 0 && !(comments.length > 0 || user || showAddForm)}
                        />
                    ))}
                </Box>
            )}

            {!loading && !error && comments.length === 0 && !showAddForm && !user && (
                 <Typography variant="caption" sx={{ display: 'block', py: 1, px: 1.5, color: 'text.disabled', textAlign: 'left' }}>
                     Комментариев пока нет.
                 </Typography>
             )}
            
            {user && showAddForm && (
                <Box sx={{pt: 0.5, px:1.5, pb: 1, ...(comments.length > 0 && {borderTop: 1, borderColor: 'divider', mt:0})}}>
                    <AddCommentForm
                        targetId={targetId}
                        targetType={targetType}
                        onCommentAdded={handleCommentAdded}
                        onCancel={handleCancelAddForm}
                    />
                </Box>
            )}

            {!user && !showAddForm && ( // Предложение войти, если комментариев нет и формы нет
                 <Typography variant="caption" sx={{ display: 'block', py: 1, px: 1.5, color: 'text.disabled', textAlign: 'left', ...(comments.length > 0 && {borderTop: 1, borderColor: 'divider', mt: 1}) }}>
                     <MuiLink component={RouterLink} to="/login" state={{ from: location }} sx={{fontWeight: 'medium'}}>Войдите</MuiLink>, чтобы оставить комментарий.
                 </Typography>
            )}
        </Box>

        {commentToDelete && (
            <Dialog open={!!commentToDelete} onClose={() => setCommentToDelete(null)} aria-labelledby="delete-comment-dialog-title">
                <DialogTitle id="delete-comment-dialog-title">Удалить комментарий?</DialogTitle>
                <DialogContent><DialogContentText>Вы уверены, что хотите удалить этот комментарий?</DialogContentText></DialogContent>
                <DialogActions>
                    <Button onClick={() => setCommentToDelete(null)}>Отмена</Button>
                    <Button onClick={handleDeleteCommentConfirmed} color="error" disabled={deleteProcessing}>
                        {deleteProcessing ? <CircularProgress size={20} color="inherit"/> : "Удалить"}
                    </Button>
                </DialogActions>
            </Dialog>
        )}
        <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} message={snackbarMessage} />
        </>
    );
};

export default CommentList;