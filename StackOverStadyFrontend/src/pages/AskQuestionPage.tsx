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
  FormControl,
  FormHelperText,
  FormLabel,
  useTheme,
  Paper,
} from '@mui/material';
import { useAuth } from '../AuthContext';
import RichTextEditor from '../components/RichTextEditor';

interface TagOption {
  id: number;
  name: string;
  inputValue?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7295/api';
const MAX_TAG_LENGTH = 30;
const MAX_TAGS_COUNT = 5;

const debounce = <F extends (...args: any[]) => Promise<void>>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>): void => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };
};

const AskQuestionPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, login } = useAuth();
  const theme = useTheme();

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

  // eslint-disable-next-line
  const debouncedFetchTags = useCallback(debounce(async (query: string) => {
    const suggestions = await fetchTagSuggestions(query);
    setTagSuggestions(suggestions);
  }, 300), []);

  useEffect(() => {
    const trimmedInput = tagInput.trim();
    if (trimmedInput && trimmedInput.length >= 1) {
      debouncedFetchTags(trimmedInput);
    } else {
      setTagSuggestions([]);
    }
  }, [tagInput, debouncedFetchTags]);

  // --- Валидация и сброс ошибок при изменении полей ---
  useEffect(() => {
    if (title.trim().length >= 5 && title.trim().length <= 200) {
      setTitleError(null);
    }
  }, [title]);

  useEffect(() => {
    if (content.replace(/<[^>]*>?/gm, '').trim().length >= 20) {
      setContentError(null);
    }
  }, [content]);

  useEffect(() => {
    if (selectedTags.length > 0 && selectedTags.length <= MAX_TAGS_COUNT) {
      setTagsError(null);
    }
  }, [selectedTags]);
  // -----------------------------------------------------


  const validateForm = (): boolean => {
    let isValid = true;
    // Сбрасываем только submitError, ошибки полей будут проверены ниже
    setSubmitError(null); 

    const trimmedTitle = title.trim();
    if (!trimmedTitle || trimmedTitle.length < 5 || trimmedTitle.length > 200) {
      setTitleError("Заголовок должен содержать от 5 до 200 символов.");
      isValid = false;
    } else {
      setTitleError(null); // Сбрасываем, если валидно
    }

    const textOnlyContent = content.replace(/<[^>]*>?/gm, '').trim();
    if (!textOnlyContent || textOnlyContent.length < 20) {
      setContentError("Содержимое вопроса должно содержать не менее 20 видимых символов.");
      isValid = false;
    } else {
      setContentError(null); // Сбрасываем, если валидно
    }

    if (selectedTags.length === 0) {
      setTagsError("Необходимо выбрать хотя бы один тег.");
      isValid = false;
    } else if (selectedTags.length > MAX_TAGS_COUNT) {
      setTagsError(`Можно выбрать не более ${MAX_TAGS_COUNT} тегов.`);
      isValid = false;
    } else {
      setTagsError(null); // Сбрасываем, если валидно
    }
    return isValid;
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    // Проверка и сброс ошибки contentError перенесены в useEffect [content]
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) { // validateForm теперь сама сбрасывает ошибки полей, если они стали валидны
      setSubmitError("Пожалуйста, исправьте ошибки в форме.");
      return;
    }
    if (authLoading || !user) {
      setSubmitError('Необходима авторизация. Пожалуйста, войдите.');
      if(!authLoading && !user && login) login();
      return;
    }

    const questionData = {
      title: title.trim(),
      content: content,
      tags: selectedTags.map(tag => tag.name.trim().toLowerCase()),
    };

    setIsSubmitting(true);
    try {
      const response = await axios.post<{ id: number }>(`${API_URL}/Questions`, questionData, { withCredentials: true });
      navigate(`/questions/${response.data.id}`);
    } catch (error) {
      console.error('AskQuestionPage: Ошибка создания вопроса:', error);
      let errorMessage = 'Не удалось создать вопрос.';
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const data = error.response.data;
          if (error.response.status === 400 && data?.errors) {
            const errorObject = data.errors as Record<string, string[]>;
            // Обновляем конкретные ошибки полей, если они пришли с бэкенда
            if (errorObject.Title) setTitleError(errorObject.Title.join(' '));
            if (errorObject.Content) setContentError(errorObject.Content.join(' '));
            if (errorObject.Tags) setTagsError(errorObject.Tags.join(' '));
            
            const generalErrors = Object.entries(errorObject)
                .filter(([key]) => !['Title', 'Content', 'Tags'].includes(key))
                .map(([, value]) => value.join(' '))
                .join(' ');
            errorMessage = generalErrors ? `Ошибка валидации: ${generalErrors}` : "Проверьте введенные данные.";

          } else if (data?.message || data?.title) {
            errorMessage = `Ошибка ${error.response.status}: ${data.message || data.title}`;
          } else if (typeof data === 'string' && data.length < 300) {
            errorMessage = `Ошибка ${error.response.status}: ${data}`;
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
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 128px)' }}><CircularProgress /> <Typography sx={{ ml: 2 }}>Проверка пользователя...</Typography></Box>;
  }
  if (!user) {
    return <Paper sx={{ padding: { xs: 2, sm: 3, md: 4 }, maxWidth: '600px', margin: 'auto', textAlign: 'center', mt: {xs: 2, md: 5} }}><Alert severity="warning" sx={{ mb: 3 }}>Чтобы задать вопрос, необходимо авторизоваться.</Alert><Button variant="contained" onClick={login} size="large">Войти</Button></Paper>;
  }

  // Определяем, активна ли кнопка
  const isFormValidForSubmit = 
        title.trim().length >= 5 && title.trim().length <= 200 &&
        content.replace(/<[^>]*>?/gm, '').trim().length >= 20 &&
        selectedTags.length > 0 && selectedTags.length <= MAX_TAGS_COUNT;

  const isButtonDisabled = isSubmitting || !isFormValidForSubmit || !!titleError || !!contentError || !!tagsError;


  return (
    <Paper sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
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
            // Валидация "на лету" для подсказки, но основная при сабмите
            const trimmed = e.target.value.trim();
            if (trimmed && (trimmed.length < 5 || trimmed.length > 200)) {
                setTitleError("Заголовок: 5-200 символов.");
            } else {
                setTitleError(null);
            }
          }}
          required
          margin="normal"
          disabled={isSubmitting}
          error={!!titleError} // Показываем ошибку, если она есть
          helperText={titleError || "Кратко и ясно опишите суть проблемы."}
        />

        <FormControl fullWidth margin="normal" error={!!contentError} disabled={isSubmitting}>
          <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.875rem', color: !!contentError ? 'error.main' : 'text.secondary' }}>
            Подробное описание проблемы*
          </FormLabel>
          <Box sx={{ /* ... стили для Box RichTextEditor ... */ 
            border: 1, borderColor: contentError ? theme.palette.error.main : theme.palette.divider, overflow: 'hidden', '&:hover': { borderColor: contentError ? theme.palette.error.main : theme.palette.action.active, }, '&.Mui-focused, &:focus-within': { borderColor: contentError ? theme.palette.error.main : theme.palette.primary.main, borderWidth: '1px', }, '.ql-toolbar': { borderBottom: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.action.hover, borderTopLeftRadius: theme.shape.borderRadius, borderTopRightRadius: theme.shape.borderRadius, }, '.ql-container': { minHeight: '200px', fontSize: '1rem', fontFamily: theme.typography.fontFamily, backgroundColor: theme.palette.background.paper, borderBottomLeftRadius: theme.shape.borderRadius, borderBottomRightRadius: theme.shape.borderRadius, '& .ql-editor': { p: theme.spacing(1.5, 2), }, '& .ql-editor.ql-blank::before': { color: theme.palette.text.disabled, fontStyle: 'normal', left: theme.spacing(2), right: theme.spacing(2),} }
          }}>
            <RichTextEditor value={content} onChange={handleContentChange} placeholder="Опишите детали..."/>
          </Box>
          <FormHelperText>{contentError || "Минимум 20 видимых символов."}</FormHelperText>
        </FormControl>

        <Autocomplete
          multiple
          freeSolo
          id="tags-ask-question"
          options={tagSuggestions}
          value={selectedTags}
          inputValue={tagInput}
          onInputChange={(event, newInputValue, reason) => {
            if (reason === 'input') {
              if (newInputValue.length <= MAX_TAG_LENGTH) { setTagInput(newInputValue); }
            } else if (reason === 'clear') { setTagInput(''); }
          }}
          onChange={(event, newValue, reason) => {
            const processedNewValue = newValue.map(optionOrString => {
              const name = (typeof optionOrString === 'string' ? optionOrString : (optionOrString as TagOption).inputValue || (optionOrString as TagOption).name).trim();
              if (!name || name.length > MAX_TAG_LENGTH) return null;
              return { name: name, id: (optionOrString as TagOption).id === undefined || typeof optionOrString === 'string' || (optionOrString as TagOption).inputValue ? 0 : (optionOrString as TagOption).id };
            }).filter(tag => tag !== null) as TagOption[];

            const uniqueTags = processedNewValue.filter((tag, index, self) =>
              index === self.findIndex(t => t.name.toLowerCase() === tag.name.toLowerCase())
            );

            if (uniqueTags.length <= MAX_TAGS_COUNT) {
              setSelectedTags(uniqueTags);
              // Сбрасываем ошибку если количество тегов в допустимом диапазоне (даже если 0, но не > MAX_TAGS_COUNT)
              if (uniqueTags.length > 0) setTagsError(null); 
              else if (uniqueTags.length === 0 && reason !== 'removeOption' && reason !== 'clear') {
                  // Если последний тег был удален не кнопкой, а вводом/очисткой,
                  // ошибка "хотя бы 1 тег" появится при валидации формы.
                  // Пока не ставим ошибку, чтобы пользователь мог продолжить ввод.
              }
            } else {
              setSelectedTags(uniqueTags.slice(0, MAX_TAGS_COUNT));
              setTagsError(`Можно выбрать не более ${MAX_TAGS_COUNT} тегов.`);
            }
            
            if (reason === 'selectOption' || reason === 'createOption') {
                setTagInput('');
                setTagSuggestions([]);
            }
          }}
          getOptionLabel={(option) => {
            if (typeof option === 'string') return option;
            if (option.inputValue) return `Создать: "${option.inputValue}"`;
            return option.name;
          }}
          isOptionEqualToValue={(option, value) => option.name.toLowerCase() === value.name.toLowerCase()}
          loading={tagLoading}
          loadingText="Загрузка тегов..."
          filterOptions={(options, params) => {
            const filtered = options.filter((option) =>
              option.name.toLowerCase().includes(params.inputValue.toLowerCase())
            );
            const { inputValue } = params;
            const trimmedInputValue = inputValue.trim();
            
            if (trimmedInputValue !== '' && 
                trimmedInputValue.length <= MAX_TAG_LENGTH &&
                selectedTags.length < MAX_TAGS_COUNT &&
                !selectedTags.some(tag => tag.name.toLowerCase() === trimmedInputValue.toLowerCase()) &&
                !options.some(option => option.name.toLowerCase() === trimmedInputValue.toLowerCase()) && // Проверяем в исходных options, а не filtered
                !filtered.some(option => option.inputValue?.toLowerCase() === trimmedInputValue.toLowerCase()) // Проверяем, что такая "Создать" опция еще не добавлена
                ) {
              filtered.push({ inputValue: trimmedInputValue, name: `Создать: "${trimmedInputValue}"`, id: 0 });
            }
            return filtered;
          }}
          renderTags={(value, getTagProps) => value.map((option, index) => ( <Chip {...getTagProps({ index })} key={option.name + index} label={option.name} size="small" /> ))}
          renderInput={(params) => (
            <TextField {...params} variant="outlined" label="Теги" error={!!tagsError}
              helperText={tagsError || `От 1 до ${MAX_TAGS_COUNT} тегов. Длина тега до ${MAX_TAG_LENGTH} симв.`}
              placeholder={selectedTags.length < MAX_TAGS_COUNT ? "Название тега..." : "Достигнут лимит тегов"}
              disabled={isSubmitting || selectedTags.length >= MAX_TAGS_COUNT && params.inputProps?.value === ''} />
          )}
          sx={{ my: 2 }}
          disabled={isSubmitting}
        />

        {submitError && <Alert severity="error" sx={{ mt: 2, mb: 2 }}>{submitError}</Alert>}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          sx={{ marginTop: 2, display: 'block', minWidth: '200px', mx: 'auto' }}
          disabled={isButtonDisabled} // Используем вычисленное значение
        >
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Опубликовать вопрос'}
        </Button>
      </form>
    </Paper>
  );
};

export default AskQuestionPage;