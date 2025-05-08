// src/pages/AskQuestionPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Autocomplete,
  Chip,
  FormControl,    // Для error state и helper text
  FormHelperText,
  FormLabel,      // Вместо InputLabel для большей гибкости
} from '@mui/material';
import { useAuth } from '../AuthContext'; // Проверьте путь
import RichTextEditor from '../components/RichTextEditor';

interface TagOption {
  id: number;
  name: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7295/api';

const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
};

const AskQuestionPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, login } = useAuth();

  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);

  const [content, setContent] = useState('');
  const [contentError, setContentError] = useState<string | null>(null);

  const [selectedTags, setSelectedTags] = useState<TagOption[]>([]);
  const [tagsError, setTagsError] = useState<string | null>(null);

  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<TagOption[]>([]);
  const [tagLoading, setTagLoading] = useState(false);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSubmitError(null);
  }, [user]);

  const fetchTagSuggestions = async (query: string): Promise<TagOption[]> => {
    if (!query || query.trim().length < 1) return [];
    setTagLoading(true);
    try {
      const response = await axios.get<TagOption[]>(`${API_URL}/Tags/suggest`, { params: { query } });
      return response.data;
    } catch (err) {
      console.error("Error fetching tag suggestions:", err);
      return [];
    } finally {
      setTagLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetchTags = useCallback(debounce(async (query: string) => {
    const suggestions = await fetchTagSuggestions(query);
    setTagSuggestions(suggestions);
  }, 300), [API_URL]);

  useEffect(() => {
    if (tagInput.trim()) {
      debouncedFetchTags(tagInput);
    } else {
      setTagSuggestions([]);
    }
  }, [tagInput, debouncedFetchTags]);

  const validateForm = (): boolean => {
    let isValid = true;
    setTitleError(null);
    setContentError(null);
    setTagsError(null);
    setSubmitError(null);

    if (!title.trim() || title.trim().length < 5 || title.trim().length > 200) {
      setTitleError("Заголовок должен содержать от 5 до 200 символов.");
      isValid = false;
    }
    const textOnlyContent = content.replace(/<[^>]*>?/gm, '');
    if (!textOnlyContent.trim() || textOnlyContent.trim().length < 20) {
      setContentError("Содержимое вопроса должно содержать не менее 20 видимых символов.");
      isValid = false;
    }
    if (selectedTags.length === 0 || selectedTags.length > 5) {
      setTagsError("Необходимо выбрать от 1 до 5 тегов.");
      isValid = false;
    }
    return isValid;
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    const textOnly = value.replace(/<[^>]*>?/gm, '');
    if (textOnly.trim().length >= 20 && contentError) { // Сбрасываем ошибку, только если она была
      setContentError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) {
      setSubmitError("Пожалуйста, исправьте ошибки в форме.");
      return;
    }
    if (authLoading) {
      setSubmitError("Подождите, идет проверка аутентификации...");
      return;
    }
    if (!user) {
      setSubmitError('Вы должны быть авторизованы, чтобы задать вопрос.');
      return;
    }
    const questionData = {
      title: title.trim(),
      content: content,
      tags: selectedTags.map(tag => tag.name),
    };
    setIsSubmitting(true);
    try {
      const response = await axios.post<{ id: number }>(
        `${API_URL}/Questions`,
        questionData,
        { withCredentials: true }
      );
      navigate(`/questions/${response.data.id}`);
    } catch (error) {
      console.error('AskQuestionPage: Ошибка создания вопроса:', error);
      let errorMessage = 'Не удалось создать вопрос.';
      if (axios.isAxiosError(error)) {
        if (error.response) {
          if (error.response.status === 400 && error.response.data?.errors) {
            const messages = Object.values(error.response.data.errors).flat().join(' ');
            errorMessage = `Ошибка валидации: ${messages || 'Проверьте введенные данные.'}`;
          } else if (error.response.data?.message || error.response.data?.title) {
            errorMessage = `Ошибка ${error.response.status}: ${error.response.data.message || error.response.data.title}`;
          } else if (typeof error.response.data === 'string') {
            errorMessage = `Ошибка ${error.response.status}: ${error.response.data}`;
          } else {
             errorMessage = `Ошибка сервера (${error.response.status}). Пожалуйста, попробуйте позже.`;
          }
        } else if (error.request) {
          errorMessage = "Нет ответа от сервера. Проверьте ваше интернет-соединение.";
        }
      }
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress /> <Typography sx={{ ml: 2 }}>Проверка пользователя...</Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ padding: 4, maxWidth: '600px', margin: 'auto', textAlign: 'center', mt: 5 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>Чтобы задать вопрос, необходимо авторизоваться.</Alert>
        <Button variant="contained" onClick={login} size="large">Войти</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: { xs: 2, sm: 4 }, maxWidth: '800px', margin: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Задать новый вопрос
      </Typography>
      <form onSubmit={handleSubmit} noValidate>
        <TextField
          fullWidth
          label="Заголовок вопроса"
          variant="outlined"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (e.target.value.trim().length >= 5 && e.target.value.trim().length <= 200) setTitleError(null);
          }}
          required
          margin="normal"
          disabled={isSubmitting}
          inputProps={{ minLength: 5, maxLength: 200 }}
          error={!!titleError}
          helperText={titleError || "Кратко и ясно опишите суть проблемы (5-200 символов)."}
        />

        <FormControl fullWidth margin="normal" error={!!contentError} disabled={isSubmitting}>
          <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.9rem', color: !!contentError ? 'error.main' : 'text.secondary' }}>
            Подробное описание проблемы
          </FormLabel>
          <RichTextEditor
            value={content}
            onChange={handleContentChange}
            placeholder="Опишите детали: что вы пытались сделать, какой результат ожидали и что получили..."
            
          />
          <FormHelperText error={!!contentError}>
            {contentError || "Минимум 20 видимых символов. Используйте панель для форматирования."}
          </FormHelperText>
        </FormControl>

        <Autocomplete
          multiple
          id="tags-autocomplete"
          options={tagSuggestions}
          value={selectedTags}
          inputValue={tagInput}
          onInputChange={(event, newInputValue, reason) => {
            if (reason === 'input') setTagInput(newInputValue);
            else if (reason === 'clear') setTagInput('');
          }}
          onChange={(event, newValue) => {
            const newProcessedTags = newValue
              .map(option => typeof option === 'string' ? { name: option, id: 0 } : option)
              .filter((tag, index, self) => index === self.findIndex(t => t.name.toLowerCase() === tag.name.toLowerCase()));
            
            if (newProcessedTags.length <= 5) {
              setSelectedTags(newProcessedTags);
              if (newProcessedTags.length > 0) setTagsError(null); else if (newProcessedTags.length === 0 && selectedTags.length > 0) {/* Не сбрасывать ошибку если удалили последний тег, но форма еще не сабмитилась */}
            } else {
              setSelectedTags(newProcessedTags.slice(0, 5));
              setTagsError("Можно выбрать не более 5 тегов.");
            }
          }}
          getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
          isOptionEqualToValue={(option, value) => option.name.toLowerCase() === value.name.toLowerCase()}
          loading={tagLoading}
          loadingText="Загрузка тегов..."
          freeSolo
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...otherTagProps } = getTagProps({ index });
              return <Chip key={key} label={option.name} {...otherTagProps} />;
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label="Теги"
              error={!!tagsError}
              helperText={tagsError || "От 1 до 5 тегов. Нажмите Enter или выберите из списка."}
              placeholder={selectedTags.length < 5 ? "Начните вводить..." : "Максимум 5 тегов"}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <React.Fragment>
                    {tagLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </React.Fragment>
                ),
              }}
              disabled={isSubmitting || (selectedTags.length >= 5 && params.inputProps?.value === '')}
            />
          )}
          sx={{ my: 2 }} // margin-top и margin-bottom для Autocomplete
          disabled={isSubmitting || (selectedTags.length >= 5 && tagInput === "")}
        />

        {submitError && <Alert severity="error" sx={{ mt: 2, mb: 2 }}>{submitError}</Alert>}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          sx={{ marginTop: 2, display: 'block', minWidth: '200px', mx: 'auto' }}
          disabled={isSubmitting || !!titleError || !!contentError || !!tagsError || selectedTags.length === 0 /* Доп. проверка, если tagsError не установлен сразу */}
        >
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Опубликовать вопрос'}
        </Button>
      </form>
    </Box>
  );
};

export default AskQuestionPage;