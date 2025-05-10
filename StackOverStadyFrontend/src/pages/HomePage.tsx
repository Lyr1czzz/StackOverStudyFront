// src/pages/HomePage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react'; // Добавил useRef
import axios from 'axios';
import {
  Box, Typography, CircularProgress, Alert, Button,
  TextField, Collapse, Stack, Pagination,
  IconButton, Paper, Link as MuiLink
} from '@mui/material';
import { Link as RouterLink, useSearchParams } from 'react-router-dom'; // Убрал useNavigate, если не используется для другого
import QuestionCard from '../components/QuestionCard';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7295/api';

// ... интерфейсы UserSummary, TagSummary, QuestionSummary, PaginatedResponse ...
// (они должны быть такими же, как в предыдущих версиях, включая hasAcceptedAnswer в QuestionSummary)
export interface UserSummary {
  id: number;
  name: string;
  pictureUrl: string | null;
}

export interface TagSummary {
  id: number;
  name: string;
}
export interface QuestionSummary {
  id: number;
  title: string;
  content: string;
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

  // Состояния, которые напрямую влияют на запрос API и URL
  const [sortOrder, setSortOrder] = useState<'newest' | 'votes' | 'active'>(() => (searchParams.get('sort') as 'newest' | 'votes' | 'active') || 'newest');
  const [tagFilter, setTagFilter] = useState<string>(() => searchParams.get('tags') || '');
  const [searchText, setSearchText] = useState<string>(() => searchParams.get('search') || '');
  const [page, setPage] = useState<number>(() => parseInt(searchParams.get('page') || '1', 10));

  const [pageSize] = useState<number>(10);
  const [totalItems, setTotalItems] = useState(0);

  // Локальные состояния для полей ввода фильтров (управляемые компоненты)
  const [currentSearchText, setCurrentSearchText] = useState<string>(searchText);
  const [currentTagFilter, setCurrentTagFilter] = useState<string>(tagFilter);

  // Флаг, чтобы избежать первоначального двойного запроса при монтировании
  const isMounted = useRef(false);

  // Эффект для синхронизации состояний с параметрами URL при их изменении извне
  useEffect(() => {
    const urlSort = (searchParams.get('sort') as 'newest' | 'votes' | 'active') || 'newest';
    const urlTags = searchParams.get('tags') || '';
    const urlSearch = searchParams.get('search') || '';
    const urlPage = parseInt(searchParams.get('page') || '1', 10);

    // Обновляем состояния, только если они действительно отличаются от текущих в URL
    // Это помогает избежать лишних ререндеров, если URL меняется кодом этого же компонента
    if (urlSort !== sortOrder) setSortOrder(urlSort);
    if (urlTags !== tagFilter) {
        setTagFilter(urlTags);
        setCurrentTagFilter(urlTags); // Синхронизируем поле ввода
    }
    if (urlSearch !== searchText) {
        setSearchText(urlSearch);
        setCurrentSearchText(urlSearch); // Синхронизируем поле ввода
    }
    if (urlPage !== page) setPage(urlPage);

  }, [searchParams]); // Зависимость только от searchParams


  const fetchQuestions = useCallback(async (
    currentPage: number,
    currentSort: string,
    currentTags: string,
    currentSearchQuery: string
  ) => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.append('sort', currentSort);
    if (currentTags) params.append('tags', currentTags);
    if (currentSearchQuery) params.append('search', currentSearchQuery);
    params.append('page', currentPage.toString());
    params.append('pageSize', pageSize.toString());

    // Формируем объект для setSearchParams, чтобы URL был чистым
    const newSearchParams: Record<string, string> = {};
    if (currentPage > 1) newSearchParams.page = currentPage.toString(); // Не добавляем page=1
    if (currentSort !== 'newest') newSearchParams.sort = currentSort; // Не добавляем sort=newest (дефолт)
    if (currentTags) newSearchParams.tags = currentTags;
    if (currentSearchQuery) newSearchParams.search = currentSearchQuery;

    // Обновляем URL. `replace: true` чтобы не засорять историю браузера при каждом изменении фильтра
    setSearchParams(newSearchParams, { replace: true });

    try {
      console.log('Fetching questions with params:', params.toString()); // Для отладки
      const response = await axios.get<PaginatedResponse<QuestionSummary>>(
        `${API_URL}/Questions`, { params }
      );
      setQuestions(response.data.items);
      setTotalItems(response.data.totalCount);
    } catch (err) {
      console.error("Error fetching questions:", err);
      if (axios.isAxiosError(err)) {
        const errData = err.response?.data as { message?: string };
        setError(`Не удалось загрузить список вопросов. ${errData?.message || 'Ошибка сервера'}`);
      } else {
        setError("Произошла неизвестная ошибка при загрузке вопросов.");
      }
    } finally {
      setLoading(false);
    }
  }, [pageSize, setSearchParams]); // Зависимости useCallback: pageSize и setSearchParams

  // Основной эффект для загрузки данных при изменении состояний фильтров/пагинации/сортировки
  useEffect(() => {
    if (isMounted.current) { // Загружаем данные только после первого рендера и если состояния изменились
      fetchQuestions(page, sortOrder, tagFilter, searchText);
    } else {
      // При первом монтировании, значения уже взяты из URL,
      // и мы хотим выполнить начальную загрузку с этими значениями.
      // Если URL пуст, то используются дефолтные значения.
      fetchQuestions(page, sortOrder, tagFilter, searchText);
      isMounted.current = true;
    }
  }, [page, sortOrder, tagFilter, searchText, fetchQuestions]);


  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value); // Изменение page вызовет useEffect -> fetchQuestions
  };

  const handleSortChange = (newSortOrder: 'newest' | 'votes' | 'active') => {
    setSortOrder(newSortOrder);
    setPage(1); // Сброс на первую страницу при смене сортировки
  };

  const handleApplyFilters = () => {
    // Проверяем, изменились ли значения в полях ввода по сравнению с активными фильтрами
    const searchChanged = currentSearchText !== searchText;
    const tagsChanged = currentTagFilter !== tagFilter;

    if (searchChanged || tagsChanged) {
        // Если что-то изменилось, обновляем активные фильтры и сбрасываем на 1 страницу
        if (searchChanged) setSearchText(currentSearchText);
        if (tagsChanged) setTagFilter(currentTagFilter);
        setPage(1);
    }
    // Если ничего не изменилось в полях, никаких действий не требуется,
    // т.к. данные уже загружены с текущими searchText и tagFilter
  };

  const handleClearTagFilter = () => {
    setCurrentTagFilter(''); // Очищаем поле ввода
    if (tagFilter !== '') { // Если активный фильтр был установлен
        setTagFilter('');     // Очищаем активный фильтр
        setPage(1);           // Сбрасываем на первую страницу
    }
  };

  const handleClearSearchFilter = () => {
    setCurrentSearchText('');
    if (searchText !== '') {
        setSearchText('');
        setPage(1);
    }
  }

  const pageCount = Math.ceil(totalItems / pageSize);
  const effectivePageTitle = tagFilter ? `Тег: "${tagFilter.split(',').map(t => t.trim()).filter(Boolean).join('", "')}"` : (searchText ? `Поиск: "${searchText}"`: 'Все вопросы');

  return (
    <Box sx={{ maxWidth: {xs: '100%', md: 900}, mx: 'auto', px: {xs: 1, sm: 2} }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" component="h1" sx={{fontSize: {xs: '1.5rem', sm: '1.75rem', md: '2rem'} }}>
            {effectivePageTitle}
          </Typography>
          {totalItems > 0 && !loading && ( // Показываем количество только если есть и не идет загрузка
            <Typography variant="body2" color="text.secondary">
                Найдено: {totalItems.toLocaleString()} вопрос{totalItems % 10 === 1 && totalItems % 100 !== 11 ? '' : (totalItems % 10 >= 2 && totalItems % 10 <= 4 && (totalItems % 100 < 10 || totalItems % 100 >= 20) ? 'а' : 'ов')}
            </Typography>
          )}
        </Box>
        <Button variant="contained" component={RouterLink} to="/ask" size="large" sx={{height: 'fit-content'}}>
          Задать вопрос
        </Button>
      </Box>

      <Paper elevation={1} sx={{ mb: 2, p: 1.5, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Button
            startIcon={<FilterListIcon />}
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-expanded={filtersOpen}
            aria-controls="filters-collapse"
            size="small"
          >
            Фильтры { (tagFilter || searchText) && `(${(tagFilter ? 1:0) + (searchText ? 1:0)})` }
          </Button>
          <Stack direction="row" spacing={{xs: 0.5, sm:1}} sx={{flexWrap: 'wrap', justifyContent: 'center', gap: 0.5 /* Добавил gap для переноса */}}>
            {(['newest', 'votes', 'active'] as const).map((s) => (
              <Button
                key={s}
                variant={sortOrder === s ? 'contained' : 'outlined'}
                size="small"
                onClick={() => handleSortChange(s)}
                sx={{minWidth: {xs: '70px', sm: '80px'}}}
              >
                {s === 'newest' ? 'Новые' : s === 'votes' ? 'Топ' : 'Активные'}
              </Button>
            ))}
          </Stack>
        </Box>
        <Collapse in={filtersOpen} id="filters-collapse">
          <Box sx={{ p: {xs: 1, sm:2}, borderTop: '1px solid', borderColor: 'divider', mt: 1.5 }}>
            <Stack spacing={2}>
              <TextField
                label="Поиск по заголовкам и тексту"
                variant="outlined"
                value={currentSearchText}
                onChange={(e) => setCurrentSearchText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                fullWidth
                size="small"
                InputProps={{
                    startAdornment: <SearchIcon sx={{mr:1, color:'action.active'}}/>,
                    endAdornment: currentSearchText && (
                        <IconButton onClick={handleClearSearchFilter} edge="end" size="small" title="Очистить поиск">
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
                size="small"
                helperText="Пример: react,typescript"
                InputProps={{
                    endAdornment: currentTagFilter && (
                        <IconButton onClick={handleClearTagFilter} edge="end" size="small" title="Очистить теги">
                            <ClearIcon fontSize="small"/>
                        </IconButton>
                    )
                }}
              />
              <Button
                onClick={handleApplyFilters}
                variant="contained"
                // startIcon={<SearchIcon />} // Убрал, т.к. иконка есть в поле поиска
                disabled={loading || (currentSearchText === searchText && currentTagFilter === tagFilter)}
                sx={{alignSelf: 'flex-start'}}
              >
                Применить фильтры
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
      {error && <Alert severity="error" sx={{mb: 2, borderRadius: 2}}>{error}</Alert>}

      {!loading && !error && questions.length === 0 && (
        <Paper elevation={0} sx={{textAlign: 'center', p: 3, color: 'text.secondary', borderRadius: 2, mt: 2, border: '1px dashed', borderColor: 'divider'}}>
          <Typography>
            По вашему запросу ничего не найдено.
          </Typography>
          <Typography sx={{mt: 1}}>
            Попробуйте изменить фильтры или <MuiLink component={RouterLink} to="/ask" fontWeight="bold">задайте свой вопрос</MuiLink>!
          </Typography>
        </Paper>
      )}

      {!loading && !error && questions.length > 0 && (
        <Stack spacing={2}>
          {questions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </Stack>
      )}

      {pageCount > 1 && !loading && questions.length > 0 && ( // Показываем пагинацию только если есть вопросы
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
            size={ (typeof window !== 'undefined' && window.innerWidth < 600) ? 'small' : 'medium' }
          />
        </Box>
      )}
    </Box>
  );
};

export default HomePage;