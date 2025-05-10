import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box, Typography, CircularProgress, Alert, Button,
  TextField, Collapse, Stack, Pagination,
  IconButton, Paper
} from '@mui/material';
import { Link as RouterLink, useSearchParams, useNavigate } from 'react-router-dom';
import QuestionCard from '../components/QuestionCard'; // Убедитесь, что путь к компоненту верный
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';


// Убедись, что URL правильный
const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7295/api';

interface UserSummary {
  id: number;
  name: string;
  pictureUrl: string | null;
}

interface TagSummary {
  id: number;
  name: string;
}
export interface QuestionSummary { // Экспортируем, если используется в QuestionCard
  id: number;
  title: string;
  content: string; // Краткое содержание или начало
  createdAt: string;
  author: UserSummary;
  tags: TagSummary[];
  answerCount: number;
  rating: number;
  hasAcceptedAnswer: boolean;
}

interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
}

const HomePage = () => {
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Инициализация состояния из URL параметров
  const [sortOrder, setSortOrder] = useState<'newest' | 'votes' | 'active'>(
    (searchParams.get('sort') as 'newest' | 'votes' | 'active') || 'newest'
  );
  const [tagFilter, setTagFilter] = useState<string>(searchParams.get('tags') || '');
  const [searchText, setSearchText] = useState<string>(searchParams.get('search') || '');
  const [page, setPage] = useState<number>(parseInt(searchParams.get('page') || '1', 10));
  const [pageSize] = useState<number>(10); // Можно сделать настраиваемым
  const [totalItems, setTotalItems] = useState(0);

  // Локальные состояния для полей ввода фильтров, применяются по кнопке
  const [currentSearchText, setCurrentSearchText] = useState<string>(searchText);
  const [currentTagFilter, setCurrentTagFilter] = useState<string>(tagFilter);


  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.append('sort', sortOrder);
    if (tagFilter) params.append('tags', tagFilter);
    if (searchText) params.append('search', searchText);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    // Обновляем URL только теми параметрами, которые действительно используются
    const currentSearchParams: Record<string, string> = { page: page.toString(), sort: sortOrder };
    if (tagFilter) currentSearchParams.tags = tagFilter;
    if (searchText) currentSearchParams.search = searchText;
    setSearchParams(currentSearchParams, { replace: true });


    try {
      const response = await axios.get<PaginatedResponse<QuestionSummary>>(
        `${API_URL}/Questions`, { params }
      );
      setQuestions(response.data.items);
      setTotalItems(response.data.totalCount);
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError("Не удалось загрузить список вопросов.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortOrder, tagFilter, searchText, setSearchParams]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Обновление состояния, если параметры URL изменились извне (например, кнопка "назад")
  useEffect(() => {
    setPage(parseInt(searchParams.get('page') || '1', 10));
    setSortOrder((searchParams.get('sort') as 'newest' | 'votes' | 'active') || 'newest');
    setTagFilter(searchParams.get('tags') || '');
    setSearchText(searchParams.get('search') || '');
    // Также обновляем локальные поля ввода, если они должны синхронизироваться
    setCurrentTagFilter(searchParams.get('tags') || '');
    setCurrentSearchText(searchParams.get('search') || '');

  }, [searchParams]);


  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleApplyFilters = () => {
    setSearchText(currentSearchText);
    setTagFilter(currentTagFilter);
    setPage(1); // Сбрасываем на первую страницу при применении новых фильтров
    // fetchQuestions вызовется автоматически из-за изменения зависимостей useEffect
  };

  const handleClearTagFilter = () => {
    setCurrentTagFilter(''); // Очищаем поле ввода
    setTagFilter('');     // Очищаем активный фильтр
    setPage(1);
  };
  const handleClearSearchFilter = () => {
    setCurrentSearchText('');
    setSearchText('');
    setPage(1);
  }


  const pageCount = Math.ceil(totalItems / pageSize);
  const effectivePageTitle = tagFilter ? `Вопросы с тегом "${tagFilter}"` : (searchText ? `Результаты поиска по "${searchText}"`: 'Все вопросы');

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" component="h1">
            {effectivePageTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {totalItems.toLocaleString()} вопрос(а/ов)
          </Typography>
        </Box>
        <Button variant="contained" component={RouterLink} to="/ask" size="large">
          Задать вопрос
        </Button>
      </Box>

      <Paper elevation={1} sx={{ mb: 2, p: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            startIcon={<FilterListIcon />}
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-expanded={filtersOpen}
            aria-controls="filters-collapse"
          >
            Фильтры ({ (tagFilter ? 1:0) + (searchText ? 1:0) })
          </Button>
          <Stack direction="row" spacing={1}>
            {['newest', 'votes', 'active'].map((s) => (
              <Button
                key={s}
                variant={sortOrder === s ? 'contained' : 'outlined'}
                size="small"
                onClick={() => {
                  setSortOrder(s as 'newest' | 'votes' | 'active');
                  setPage(1);
                }}
              >
                {s === 'newest' ? 'Новые' : s === 'votes' ? 'Популярные' : 'Активные'}
              </Button>
            ))}
          </Stack>
        </Box>
        <Collapse in={filtersOpen} id="filters-collapse">
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', mt: 1.5 }}>
            <Stack spacing={2}>
              <TextField
                label="Поиск по заголовкам"
                variant="outlined"
                value={currentSearchText}
                onChange={(e) => setCurrentSearchText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                fullWidth
                InputProps={{
                    endAdornment: currentSearchText && (
                        <IconButton onClick={handleClearSearchFilter} edge="end" size="small">
                            <ClearIcon fontSize="small"/>
                        </IconButton>
                    )
                }}
              />
              <TextField
                label="Фильтр по тегу (или тегам через запятую)"
                variant="outlined"
                value={currentTagFilter}
                onChange={(e) => setCurrentTagFilter(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                fullWidth
                helperText="Пример: react,typescript"
                InputProps={{
                    endAdornment: currentTagFilter && (
                        <IconButton onClick={handleClearTagFilter} edge="end" size="small">
                            <ClearIcon fontSize="small"/>
                        </IconButton>
                    )
                }}
              />
              <Button
                onClick={handleApplyFilters}
                variant="contained"
                startIcon={<SearchIcon />}
                disabled={loading || (currentSearchText === searchText && currentTagFilter === tagFilter)}
              >
                Применить
              </Button>
            </Stack>
          </Box>
        </Collapse>
      </Paper>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      )}
      {error && <Alert severity="error" sx={{mb: 2}}>{error}</Alert>}

      {!loading && !error && questions.length === 0 && (
        <Typography sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
          По вашему запросу ничего не найдено. Попробуйте изменить фильтры или <RouterLink to="/ask">задайте свой вопрос</RouterLink>!
        </Typography>
      )}

      {!loading && !error && questions.length > 0 && (
        <Stack spacing={2}>
          {questions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </Stack>
      )}

      {pageCount > 1 && !loading && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
};

export default HomePage;