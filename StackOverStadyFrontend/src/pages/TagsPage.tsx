import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, CircularProgress, Alert,
  List, ListItem, ListItemText, Chip, Divider, Button,
  IconButton, Tooltip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete'; // Иконка удаления
import { useAuth } from '../AuthContext';   // Импортируем useAuth и AuthUser

interface TagWithCount {
  id: number;
  name: string;
  questionCount: number;
}

const API_URL = import.meta.env.VITE_API_URL;

const TagsPage = () => {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth(); // Получаем текущего пользователя

  const [tagToDelete, setTagToDelete] = useState<TagWithCount | null>(null);
  const [deleteProcessing, setDeleteProcessing] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<TagWithCount[]>(`${API_URL}/api/Tags`);
        // Сортируем: сначала по количеству вопросов (убывание), затем по имени (возрастание)
        setTags(response.data.sort((a, b) => b.questionCount - a.questionCount || a.name.localeCompare(b.name)));
      } catch (err) {
        console.error("Error fetching tags:", err);
        setError("Не удалось загрузить список тегов.");
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  const handleTagClick = (tagName: string) => {
    navigate(`/?tags=${encodeURIComponent(tagName)}&page=1`); // Добавляем page=1 для сброса пагинации
  };

  const openDeleteTagDialog = (tag: TagWithCount) => {
    setTagToDelete(tag);
  };

  const handleDeleteTagConfirmed = async () => {
    if (!tagToDelete || !user) return; // Проверка на всякий случай

    // На бэкенде уже есть проверка политики, но можно добавить и здесь
    if (!(user.role === 'Admin' || user.role === 'Moderator')) { 
        setSnackbarMessage("У вас нет прав для удаления тегов.");
        setSnackbarOpen(true);
        setTagToDelete(null);
        return;
    }

    setDeleteProcessing(true);
    try {
      await axios.delete(`${API_URL}/api/Tags/${tagToDelete.id}`, { withCredentials: true });
      setTags(prevTags => prevTags.filter(t => t.id !== tagToDelete.id));
      setSnackbarMessage(`Тег "${tagToDelete.name}" успешно удален.`);
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Ошибка удаления тега:", err);
      const message = axios.isAxiosError(err) ? 
                      (err.response?.data as { message?: string })?.message || "Не удалось удалить тег." : 
                      "Произошла неизвестная ошибка.";
      setSnackbarMessage(message);
      setSnackbarOpen(true);
    } finally {
      setDeleteProcessing(false);
      setTagToDelete(null); // Закрываем диалог
    }
  };

  // Определяем, может ли текущий пользователь модерировать (удалять теги)
  // Для тегов обычно это только Admin, но ты можешь использовать общую политику ModeratorRole
  const canManageTags = user && (user.role === 'Admin' || user.role === 'Moderator'); 
  // Если только админ: const canManageTags = user && user.role === 'Admin';

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  return (
    <> {/* Обертка для Box и Snackbar/Dialog */}
      <Box> {/* Эта страница рендерится внутри Paper из App.tsx */}
        <Typography variant="h4" component="h1" gutterBottom>
          Теги ({tags.length})
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Теги помогают группировать вопросы по схожим темам и находить нужную информацию.
        </Typography>

        {tags.length === 0 && !loading && (
          <Typography sx={{mt: 2, color: 'text.disabled'}}>Теги еще не созданы.</Typography>
        )}

        {/* Paper здесь можно убрать, т.к. страница уже в Paper в App.tsx */}
        {/* <Paper elevation={0} sx={{ p: 0 }}> */}
          <List sx={{bgcolor: 'transparent'}}>
            {tags.map((tag, index) => (
              <React.Fragment key={tag.id}>
                <ListItem
                  disablePadding
                  sx={{ 
                    py: 1.25, // Увеличим вертикальный отступ
                    display: 'flex', 
                    alignItems: 'center',
                    '&:hover .delete-tag-btn': { // Показываем кнопку удаления при наведении
                        opacity: 1,
                    }
                  }}
                  secondaryAction={
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleTagClick(tag.name)}
                            sx={{whiteSpace: 'nowrap'}}
                        >
                            Вопросы ({tag.questionCount})
                        </Button>
                        {canManageTags && (
                            <Tooltip title="Удалить тег">
                                <IconButton 
                                    onClick={() => openDeleteTagDialog(tag)} 
                                    size="small" 
                                    color="error"
                                    className="delete-tag-btn" // Для :hover
                                    sx={{opacity: {xs: 1, sm: 0}, transition: 'opacity 0.2s', p: 0.5}} // На мобильных всегда видна
                                    disabled={deleteProcessing && tagToDelete?.id === tag.id}
                                >
                                    {deleteProcessing && tagToDelete?.id === tag.id 
                                        ? <CircularProgress size={18} color="inherit"/> 
                                        : <DeleteIcon fontSize="small" />
                                    }
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Chip 
                        label={tag.name} 
                        onClick={() => handleTagClick(tag.name)} // Делаем сам чип кликабельным
                        clickable
                        size="medium" // Можно сделать чипы побольше
                        sx={{mr: 1, fontSize: '0.9rem', fontWeight: 500, textTransform: 'lowercase'}}
                      />
                    }
                    // secondary={`Использований: ${tag.questionCount}`} // Убрал, т.к. есть в кнопке
                    sx={{m:0}}
                  />
                </ListItem>
                {index < tags.length - 1 && <Divider component="li" variant="middle" />}
              </React.Fragment>
            ))}
          </List>
        {/* </Paper> */}
      </Box>

      {tagToDelete && (
        <Dialog open={!!tagToDelete} onClose={() => setTagToDelete(null)} aria-labelledby="delete-tag-dialog-title">
          <DialogTitle id="delete-tag-dialog-title">Удалить тег "{tagToDelete.name}"?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Вы уверены, что хотите удалить этот тег? 
              {tagToDelete.questionCount > 0 
                ? ` Он используется в ${tagToDelete.questionCount} вопросах. Удаление тега отвяжет его от этих вопросов.` 
                : ' Этот тег в данный момент не используется.'}
              Это действие необратимо.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTagToDelete(null)}>Отмена</Button>
            <Button onClick={handleDeleteTagConfirmed} color="error" disabled={deleteProcessing}>
              {deleteProcessing ? <CircularProgress size={20} color="inherit"/> : "Удалить тег"}
            </Button>
          </DialogActions>
        </Dialog>
      )}
       <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
};

export default TagsPage;