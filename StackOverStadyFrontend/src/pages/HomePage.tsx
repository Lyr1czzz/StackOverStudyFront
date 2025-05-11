import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Box, Typography, CircularProgress, Alert, Button,
  TextField, Collapse, Stack, Pagination,
  IconButton, Paper, Link as MuiLink, InputAdornment, useTheme, Tooltip,
  Autocomplete
} from '@mui/material';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import QuestionCard from '../components/QuestionCard'; // Убедись, что путь верный
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7295/api';

// Интерфейсы (убедись, что они соответствуют твоему API)
export interface UserSummary {
  id: number;
  name: string;
  pictureUrl: string | null;
}

export interface TagSummary {
  id: number;
  name: string;
  // questionCount?: number; // Если твой API /api/Tags возвращает это
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
  const theme = useTheme();
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  // --- Состояния, управляющие API запросом ---
  // Инициализируются из URL или значениями по умолчанию
  const [page, setPage] = useState<number>(() => parseInt(searchParams.get('page') || '1', 10));
  const [sortOrder, setSortOrder] = useState<'newest' | 'votes' | 'active'>(
    () => (searchParams.get('sort') as 'newest' | 'votes' | 'active') || 'newest'
  );
  const [tagFilterForAPI, setTagFilterForAPI] = useState<string>(() => searchParams.get('tags') || '');
  const [searchTextForAPI, setSearchTextForAPI] = useState<string>(() => searchParams.get('search') || '');

  const [pageSize] = useState<number>(10);
  const [totalItems, setTotalItems] = useState(0);

  // --- Состояния для UI элементов фильтров ---
  const [inputSearchText, setInputSearchText] = useState<string>(searchTextForAPI);
  const [selectedTag, setSelectedTag] = useState<TagSummary | null>(null); // Выбранный объект тега
  const [tagAutocompleteInputValue, setTagAutocompleteInputValue] = useState(''); // Текст в поле Autocomplete

  const [allAvailableTags, setAllAvailableTags] = useState<TagSummary[]>([]);
  const [loadingTags, setLoadingTags] = useState<boolean>(false);

  const firstMount = useRef(true);


  // 1. Эффект: Загрузка списка тегов для Autocomplete
  useEffect(() => {
    const fetchTags = async () => {
      setLoadingTags(true);
      try {
        const response = await axios.get<TagSummary[]>(`${API_URL}/Tags`); // Используем /api/Tags
        setAllAvailableTags(response.data);
        // Если в URL есть тег при первой загрузке, пытаемся его выбрать в Autocomplete
        const initialTagFromUrl = searchParams.get('tags');
        if (initialTagFromUrl) {
          const found = response.data.find(t => t.name.toLowerCase() === initialTagFromUrl.toLowerCase());
          if (found) {
            setSelectedTag(found);
            setTagAutocompleteInputValue(found.name); // Устанавливаем текст в поле
          } else {
            setTagAutocompleteInputValue(initialTagFromUrl); // Если не нашли, просто ставим в инпут
          }
        }
      } catch (e) {
        console.error("Error fetching tags:", e);
      } finally {
        setLoadingTags(false);
      }
    };
    fetchTags();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Загружаем один раз

  // 2. Эффект: Синхронизация состояний фильтров (page, sortOrder, etc.) с searchParams URL
  // Этот эффект срабатывает, когда URL меняется извне (например, кнопка "назад")
  useEffect(() => {
    const newPage = parseInt(searchParams.get('page') || '1', 10);
    const newSort = (searchParams.get('sort') as 'newest' | 'votes' | 'active') || 'newest';
    const newTags = searchParams.get('tags') || '';
    const newSearch = searchParams.get('search') || '';

    if (newPage !== page) setPage(newPage);
    if (newSort !== sortOrder) setSortOrder(newSort);
    if (newTags !== tagFilterForAPI) {
        setTagFilterForAPI(newTags);
        // Обновляем Autocomplete на основе нового значения newTags
        if (newTags) {
            const found = allAvailableTags.find(t => t.name.toLowerCase() === newTags.toLowerCase());
            setSelectedTag(found || null);
            setTagAutocompleteInputValue(found ? found.name : newTags);
        } else {
            setSelectedTag(null);
            setTagAutocompleteInputValue('');
        }
    }
    if (newSearch !== searchTextForAPI) {
        setSearchTextForAPI(newSearch);
        setInputSearchText(newSearch); // Синхронизируем поле ввода
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, allAvailableTags]); // Зависим от searchParams и allAvailableTags для корректной установки selectedTag

  // 3. Эффект: Загрузка вопросов при изменении фильтров, влияющих на API-запрос
  // Также обновляет URL этими параметрами
  const fetchAndSetUrl = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log(`Fetching Questions with: page=${page}, sort=${sortOrder}, tags='${tagFilterForAPI}', search='${searchTextForAPI}'`);

    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('sort', sortOrder);
    if (tagFilterForAPI) params.append('tags', tagFilterForAPI);
    if (searchTextForAPI) params.append('search', searchTextForAPI);
    params.append('pageSize', pageSize.toString());

    // Обновляем URL перед запросом
    const newUrlParams: Record<string, string> = {};
    if (page > 1) newUrlParams.page = page.toString();
    if (sortOrder !== 'newest') newUrlParams.sort = sortOrder;
    if (tagFilterForAPI) newUrlParams.tags = tagFilterForAPI;
    if (searchTextForAPI) newUrlParams.search = searchTextForAPI;
    
    // Только если параметры действительно изменились по сравнению с текущим URL
    const currentUrlSearchParams = new URLSearchParams(window.location.search);
    let shouldSetNewUrlParams = false;
    const allKeys = new Set([...Object.keys(newUrlParams), ...Array.from(currentUrlSearchParams.keys())]);
    allKeys.forEach(key => {
        if (newUrlParams[key] !== currentUrlSearchParams.get(key) && (newUrlParams[key] || currentUrlSearchParams.get(key) !== null )) {
            shouldSetNewUrlParams = true;
        }
    });
    if(shouldSetNewUrlParams){
        setSearchParams(newUrlParams, { replace: true });
    }


    try {
      const response = await axios.get<PaginatedResponse<QuestionSummary>>(
        `${API_URL}/Questions`, { params }
      );
      setQuestions(response.data.items);
      setTotalItems(response.data.totalCount);
    } catch (err) {
      console.error("Error fetching questions:", err);
      if (axios.isAxiosError(err)) {
        const errData = err.response?.data as { message?: string; details?: string };
        setError(`Не удалось загрузить вопросы. ${errData?.message || errData?.details || 'Ошибка сервера'}`);
      } else {
        setError("Произошла неизвестная ошибка при загрузке вопросов.");
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortOrder, tagFilterForAPI, searchTextForAPI, pageSize, setSearchParams]); // setSearchParams добавлен для стабильности useCallback

  useEffect(() => {
    // Пропускаем первый вызов, если состояния еще не синхронизированы с URL (если URL был непустой)
    // или если это просто первый рендер с дефолтными значениями.
    // Основной useEffect [searchParams, allAvailableTags] должен сначала установить корректные состояния.
    if (firstMount.current) {
        firstMount.current = false;
        // Проверяем, нужно ли запустить fetchAndSetUrl на первом рендере,
        // если параметры из URL были не дефолтными и уже установились
        const initialSort = (searchParams.get('sort') as 'newest' | 'votes' | 'active') || 'newest';
        const initialTags = searchParams.get('tags') || '';
        const initialSearch = searchParams.get('search') || '';
        const initialPage = parseInt(searchParams.get('page') || '1', 10);
        if(page !== initialPage || sortOrder !== initialSort || tagFilterForAPI !== initialTags || searchTextForAPI !== initialSearch){
            // Состояния еще не синхронизированы с URL, ждем useEffect [searchParams]
        } else {
            fetchAndSetUrl(); // Состояния уже корректны, загружаем
        }
        return;
    }
    fetchAndSetUrl();
  }, [fetchAndSetUrl]); // Зависимость только от fetchAndSetUrl


  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleSortChange = (newSort: 'newest' | 'votes' | 'active') => {
    if (sortOrder !== newSort) {
      setSortOrder(newSort);
      setPage(1);
    }
  };

  const handleApplyFilters = () => {
    const newSearchAPI = inputSearchText.trim();
    const newTagAPI = selectedTag ? selectedTag.name : '';

    // Обновляем состояния для API, только если они изменились
    let stateChanged = false;
    if (newSearchAPI !== searchTextForAPI) {
      setSearchTextForAPI(newSearchAPI);
      stateChanged = true;
    }
    if (newTagAPI !== tagFilterForAPI) {
      setTagFilterForAPI(newTagAPI);
      stateChanged = true;
    }

    if (page !== 1 || stateChanged) {
      setPage(1); // Сброс страницы вызовет useEffect и fetchAndSetUrl
    } else if (stateChanged && page === 1) {
      // Если страница уже 1, но фильтры изменились,
      // fetchAndSetUrl вызовется из-за изменения searchTextForAPI или tagFilterForAPI
    }
  };
  
  const handleClearSearchFilter = () => {
    setInputSearchText(''); // Очищаем поле ввода
    if (searchTextForAPI !== '') {
      setSearchTextForAPI(''); // Очищаем активный фильтр
      setPage(1);
    }
  };

  const handleClearTagFilterFromAutocomplete = () => {
    setSelectedTag(null);
    setTagAutocompleteInputValue('');
    if (tagFilterForAPI !== '') {
      setTagFilterForAPI('');
      setPage(1);
    }
  };

  const handleResetAllFilters = () => {
    setInputSearchText('');
    setSelectedTag(null);
    setTagAutocompleteInputValue('');
    
    setSearchTextForAPI('');
    setTagFilterForAPI('');
    setSortOrder('newest');
    setPage(1);
    // URL обновится через useEffect, слушающий эти состояния
  };
  
  const areAnyFiltersApplied = Boolean(searchTextForAPI || tagFilterForAPI || sortOrder !== 'newest');

  const pageCount = Math.ceil(totalItems / pageSize);
  const effectivePageTitle = tagFilterForAPI ? `Тег: "${tagFilterForAPI}"` : (searchTextForAPI ? `Поиск: "${searchTextForAPI}"`: 'Все вопросы');

  return (
    <Box>
      <Stack 
        direction={{xs: 'column', sm: 'row'}} 
        justifyContent="space-between" 
        alignItems={{xs:'flex-start', sm:'center'}} 
        mb={3}
        spacing={{xs:2, sm:1}}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0.5 }}>
            {effectivePageTitle}
          </Typography>
          {totalItems > 0 && !loading && (
            <Typography variant="body2" color="text.secondary">
                Найдено: {totalItems.toLocaleString()} вопрос{totalItems % 10 === 1 && totalItems % 100 !== 11 ? '' : (totalItems % 10 >= 2 && totalItems % 10 <= 4 && (totalItems % 100 < 10 || totalItems % 100 >= 20) ? 'а' : 'ов')}
            </Typography>
          )}
        </Box>
        <Button variant="contained" component={RouterLink} to="/ask" size="medium" sx={{ alignSelf: {xs: 'flex-start', sm: 'center'} }}>
          Задать вопрос
        </Button>
      </Stack>

      <Paper sx={{ mb: 2.5, p: {xs:1.5, sm:2} }}>
        <Stack 
            direction={{xs: 'column', sm: 'row'}} 
            justifyContent="space-between" 
            alignItems={{xs:'stretch', sm:'center'}} 
            spacing={{xs: 1.5, sm: 1}}
        >
          <Button
            startIcon={<FilterListIcon />}
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-expanded={filtersOpen}
            aria-controls="filters-collapse"
            size="small"
            sx={{justifyContent: 'flex-start', color: 'text.secondary'}}
          >
            Фильтры { (tagFilterForAPI || searchTextForAPI) && `(${(tagFilterForAPI ? 1:0) + (searchTextForAPI ? 1:0)})` }
          </Button>
          <Stack direction="row" spacing={1} sx={{flexWrap: 'wrap', justifyContent: {xs:'flex-start', sm:'flex-end'}, gap: 0.5}}>
            {(['newest', 'votes', 'active'] as const).map((s) => (
              <Button
                key={s}
                variant={sortOrder === s ? 'contained' : 'outlined'}
                size="small"
                onClick={() => handleSortChange(s)}
                sx={{minWidth: '75px'}}
              >
                {s === 'newest' ? 'Новые' : s === 'votes' ? 'Топ' : 'Активные'}
              </Button>
            ))}
          </Stack>
        </Stack>
        <Collapse in={filtersOpen} timeout="auto" unmountOnExit>
          <Box sx={{ pt: 2, mt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Stack spacing={2}>
              <TextField
                label="Поиск по вопросам"
                value={inputSearchText} // Управляется inputSearchText
                onChange={(e) => setInputSearchText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                fullWidth
                size="small"
                InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action"/></InputAdornment>,
                    endAdornment: inputSearchText ? (
                        <IconButton onClick={handleClearSearchFilter} edge="end" size="small" title="Очистить поиск">
                            <ClearIcon fontSize="small"/>
                        </IconButton>
                    ) : null
                }}
              />
              <Autocomplete
                fullWidth
                size="small"
                options={allAvailableTags}
                loading={loadingTags}
                value={selectedTag} // Управляется selectedTag (объект)
                inputValue={tagAutocompleteInputValue} // Управляется текстом ввода
                onInputChange={(event, newInputValue, reason) => {
                    setTagAutocompleteInputValue(newInputValue);
                    // Если пользователь очистил поле крестиком Autocomplete или стер все
                    if (reason === 'clear' || (reason === 'input' && newInputValue === '')) {
                        if(selectedTag !== null) handleClearTagFilterFromAutocomplete(); // Вызываем наш кастомный обработчик
                    }
                }}
                onChange={(event, newValue: TagSummary | null) => {
                    setSelectedTag(newValue); // Обновляем выбранный объект
                    // Не нужно здесь вызывать handleApplyFilters или setTagFilterForAPI,
                    // это произойдет при нажатии "Применить"
                }}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Фильтр по тегу"
                    placeholder="Выберите или введите тег"
                    // Убираем onKeyPress отсюда, чтобы не конфликтовать с Autocomplete
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingTags ? <CircularProgress color="inherit" size={20} sx={{mr: selectedTag ? 1 : 0}} /> : null}
                          {params.InputProps.endAdornment}
                          {/* Кнопка X от Autocomplete сама очистит value (selectedTag) и inputValue */}
                        </>
                      ),
                    }}
                  />
                )}
                noOptionsText="Теги не найдены"
                loadingText="Загрузка тегов..."
              />
              <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                <Button
                    onClick={handleApplyFilters}
                    variant="contained"
                    disabled={loading || (inputSearchText.trim() === searchTextForAPI && (selectedTag?.name || '') === tagFilterForAPI)}
                >
                    Применить
                </Button>
                {areAnyFiltersApplied && (
                    <Tooltip title="Сбросить все фильтры и сортировку">
                        <Button
                            onClick={handleResetAllFilters}
                            variant="text"
                            size="small"
                            startIcon={<RotateLeftIcon fontSize="small"/>}
                            color="inherit"
                            sx={{color: 'text.secondary'}}
                        >
                            Сбросить всё
                        </Button>
                    </Tooltip>
                )}
              </Stack>
            </Stack>
          </Box>
        </Collapse>
      </Paper>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      )}
      {error && <Alert severity="error" sx={{mb: 2}}>{error}</Alert>}

      {!loading && !error && questions.length === 0 && (
        <Paper sx={{textAlign: 'center', p: {xs:2, sm:3}, color: 'text.secondary', mt: 2, }}>
          <Typography variant="h6" gutterBottom>Ничего не найдено</Typography>
          <Typography>
            Попробуйте изменить фильтры или <MuiLink component={RouterLink} to="/ask" fontWeight="medium">задайте свой вопрос</MuiLink>.
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

      {pageCount > 1 && !loading && questions.length > 0 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
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