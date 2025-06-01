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
  FormControl,
  FormHelperText,
  FormLabel, // Убедись, что FormLabel импортирован, если используешь
  useTheme,
  Paper,
} from '@mui/material';
import { useAuth } from '../AuthContext';
import RichTextEditor from '../components/RichTextEditor';

interface TagOption {
  id: number; // id 0 для новых тегов, которые будут созданы на бэкенде
  name: string;
  inputValue?: string; // Для опции "Создать: ..."
}

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7295/api';
const MAX_TAG_LENGTH = 30;
const MAX_TAGS_COUNT = 5;

const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => { // Тип возвращаемого значения any, т.к. debouncedFetchTags не всегда возвращает Promise<void>
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
    setSubmitError(null); // Сбрасываем общую ошибку при изменении пользователя
  }, [user]);

  const fetchTagSuggestions = async (query: string): Promise<TagOption[]> => {
    if (!query || query.trim().length < 1) return [];
    setTagLoading(true);
    try {
      const response = await axios.get<TagOption[]>(`${API_URL}/Tags/suggest`, { params: { query } });
      return response.data.map(tag => ({ ...tag, id: tag.id || 0 })); // Убедимся, что id есть
    } catch (err) {
      console.error("Error fetching tag suggestions:", err);
      return [];
    } finally {
      setTagLoading(false);
    }
  };
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetchTags = useCallback(debounce(async (query: string) => {
    if (query.trim().length >= 1) { // Добавил проверку query здесь тоже
      const suggestions = await fetchTagSuggestions(query);
      setTagSuggestions(suggestions);
    } else {
      setTagSuggestions([]);
    }
  }, 300), []); // Пустой массив зависимостей для useCallback, если fetchTagSuggestions не зависит от внешних переменных

  useEffect(() => {
    debouncedFetchTags(tagInput); // Вызываем debouncedFetchTags напрямую
  }, [tagInput, debouncedFetchTags]);


  useEffect(() => {
    if (title.trim().length >= 5 && title.trim().length <= 200) setTitleError(null);
  }, [title]);

  useEffect(() => {
    if (content.replace(/<[^>]*>?/gm, '').trim().length >= 20) setContentError(null);
  }, [content]);

  useEffect(() => {
    if (selectedTags.length > 0 && selectedTags.length <= MAX_TAGS_COUNT) setTagsError(null);
  }, [selectedTags]);


  const validateForm = (): boolean => {
    let isValid = true;
    setSubmitError(null); 

    const trimmedTitle = title.trim();
    if (!trimmedTitle || trimmedTitle.length < 5 || trimmedTitle.length > 200) {
      setTitleError("Заголовок должен содержать от 5 до 200 символов.");
      isValid = false;
    } else {
      setTitleError(null);
    }

    const textOnlyContent = content.replace(/<[^>]*>?/gm, '').trim();
    if (!textOnlyContent || textOnlyContent.length < 20) {
      setContentError("Содержимое вопроса должно содержать не менее 20 видимых символов.");
      isValid = false;
    } else {
      setContentError(null);
    }

    if (selectedTags.length === 0) {
      setTagsError("Необходимо выбрать хотя бы один тег.");
      isValid = false;
    } else if (selectedTags.length > MAX_TAGS_COUNT) {
      setTagsError(`Можно выбрать не более ${MAX_TAGS_COUNT} тегов.`);
      isValid = false;
    } else {
      setTagsError(null);
    }
    return isValid;
  };

  const handleContentChange = (value: string) => {
    setContent(value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) {
      setSubmitError("Пожалуйста, исправьте ошибки в форме.");
      return;
    }
    if (authLoading || !user) {
      setSubmitError('Необходима авторизация. Пожалуйста, войдите.');
      if(!authLoading && !user && login) login(); // login() если он есть в AuthContext
      return;
    }

    const questionData = {
      title: title.trim(),
      content: content,
      tags: selectedTags.map(tag => tag.name.trim().toLowerCase().replace(/^создать: "/i, '').replace(/"$/, '')), // Очищаем "Создать: "
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

  const isFormValidForSubmit = 
        title.trim().length >= 5 && title.trim().length <= 200 &&
        content.replace(/<[^>]*>?/gm, '').trim().length >= 20 &&
        selectedTags.length > 0 && selectedTags.length <= MAX_TAGS_COUNT;

  const isButtonDisabled = isSubmitting || !isFormValidForSubmit || !!titleError || !!contentError || !!tagsError;

  return (
    <Paper sx={{ p: { xs: 2, sm: 3, md: 4 } }}> {/* elevation={0} и borderRadius из темы */}
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Задать новый вопрос
      </Typography>
      <form onSubmit={handleSubmit} noValidate>
        <TextField
          fullWidth
          label="Заголовок вопроса"
          variant="outlined" // Стили будут из темы
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
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
          error={!!titleError}
          helperText={titleError || "Кратко и ясно опишите суть проблемы."}
        />

        <FormControl fullWidth margin="normal" error={!!contentError} disabled={isSubmitting}>
          <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.875rem', color: !!contentError ? 'error.main' : 'text.secondary' }}>
            Подробное описание проблемы*
          </FormLabel>
          <Box sx={{ 
            border: 1, 
            borderColor: contentError ? theme.palette.error.main : theme.palette.divider, 
            overflow: 'hidden', 
            '&:hover': { borderColor: contentError ? theme.palette.error.main : theme.palette.action.active, }, 
            '&.Mui-focused, &:focus-within': { borderColor: contentError ? theme.palette.error.main : theme.palette.primary.main, borderWidth: '1px', }, 
            '.ql-toolbar': { 
                borderBottom: `1px solid ${theme.palette.divider}`, 
                backgroundColor: theme.palette.action.hover, 
                borderTopLeftRadius: theme.shape.borderRadius, 
                borderTopRightRadius: theme.shape.borderRadius, 
            }, 
            '.ql-container': { 
                minHeight: '200px', 
                fontSize: '1rem', 
                fontFamily: theme.typography.fontFamily, 
                backgroundColor: theme.palette.background.paper, 
                borderBottomLeftRadius: theme.shape.borderRadius, 
                borderBottomRightRadius: theme.shape.borderRadius, 
                '& .ql-editor': { p: theme.spacing(1.5, 2), }, 
                '& .ql-editor.ql-blank::before': { 
                    color: theme.palette.text.disabled, 
                    fontStyle: 'normal', 
                    left: theme.spacing(2), // Согласуем с отступами .ql-editor
                    right: theme.spacing(2),
                } 
            }
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
          // ИСПРАВЛЕНИЕ 1: Используем _event, если event не используется
          onInputChange={(_event, newInputValue, reason) => {
            if (reason === 'input') {
              // Ограничиваем длину вводимого тега
              if (newInputValue.length <= MAX_TAG_LENGTH) {
                setTagInput(newInputValue);
              }
            } else if (reason === 'clear') { // Если пользователь очистил поле (нажал X в Autocomplete)
              setTagInput(''); // Очищаем и наш стейт для ввода
            }
            // Не нужно вызывать setTagSuggestions([]) здесь, это делает useEffect [tagInput]
          }}
          // ИСПРАВЛЕНИЕ 2: Используем _event, если event не используется
          onChange={(_event, newValue, reason) => {
            const processedNewValue = newValue.map(optionOrString => {
              const name = (typeof optionOrString === 'string' ? optionOrString : optionOrString.inputValue || optionOrString.name)
                           .trim().toLowerCase(); // Приводим к нижнему регистру для сравнения и хранения
              if (!name || name.length > MAX_TAG_LENGTH) return null;
              // Для новых тегов (созданных через freeSolo или inputValue) id будет 0 или тот, что пришел из inputValue
              // Для существующих тегов id будет из TagOption
              return { name: name, id: (typeof optionOrString === 'string' || optionOrString.inputValue) ? 0 : optionOrString.id };
            }).filter(tag => tag !== null && tag.name !== '') as TagOption[];

            const uniqueTags = processedNewValue.filter((tag, index, self) =>
              index === self.findIndex(t => t.name === tag.name) // Сравнение по name (уже в lowerCase)
            );

            if (uniqueTags.length <= MAX_TAGS_COUNT) {
              setSelectedTags(uniqueTags);
              if (uniqueTags.length > 0) setTagsError(null); 
            } else {
              setSelectedTags(uniqueTags.slice(0, MAX_TAGS_COUNT));
              setTagsError(`Можно выбрать не более ${MAX_TAGS_COUNT} тегов.`);
            }
            
            // Очищаем поле ввода и предложения после выбора или создания тега
            if (reason === 'selectOption' || reason === 'createOption') {
                setTagInput('');
                setTagSuggestions([]); // Очищаем предложения, чтобы не мешали
            }
          }}
          getOptionLabel={(option) => {
            if (typeof option === 'string') return option; // Для freeSolo ввода
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
            const trimmedInputValue = inputValue.trim().toLowerCase(); // Сразу в lowerCase
            
            if (trimmedInputValue !== '' && 
                trimmedInputValue.length <= MAX_TAG_LENGTH &&
                selectedTags.length < MAX_TAGS_COUNT &&
                !selectedTags.some(tag => tag.name === trimmedInputValue) && // Сравнение с уже выбранными (они тоже в lowerCase)
                !options.some(option => option.name.toLowerCase() === trimmedInputValue) // Проверка в исходных предложениях
                ) {
              // Добавляем опцию "Создать", если такого тега нет ни в выбранных, ни в предложенных
              filtered.push({ inputValue: inputValue.trim(), name: `Создать: "${inputValue.trim()}"`, id: 0 });
            }
            return filtered;
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip {...getTagProps({ index })} key={option.name + index} label={option.name} size="small" />
            ))
          }
          renderInput={(params) => (
            <TextField {...params} variant="outlined" label="Теги" error={!!tagsError}
              helperText={tagsError || `От 1 до ${MAX_TAGS_COUNT} тегов. Длина тега до ${MAX_TAG_LENGTH} симв.`}
              placeholder={selectedTags.length < MAX_TAGS_COUNT ? "Начните вводить название тега..." : "Достигнут лимит тегов"}
              disabled={isSubmitting || (selectedTags.length >= MAX_TAGS_COUNT && params.inputProps?.value === '')} 
            />
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
          disabled={isButtonDisabled}
        >
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Опубликовать вопрос'}
        </Button>
      </form>
    </Paper>
  );
};

export default AskQuestionPage;