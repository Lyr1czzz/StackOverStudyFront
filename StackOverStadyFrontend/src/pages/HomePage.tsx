// src/pages/HomePage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Box, Typography, CircularProgress, Alert, Button,
  TextField, Collapse, Stack, Pagination,
  IconButton, Paper, Link as MuiLink, InputAdornment, Tooltip,
  Autocomplete
} from '@mui/material';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import QuestionCard from '../components/QuestionCard';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7295/api';

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

  const [page, setPage] = useState<number>(() => parseInt(searchParams.get('page') || '1', 10));
  const [sortOrder, setSortOrder] = useState<'newest' | 'votes' | 'active'>(
    () => (searchParams.get('sort') as 'newest' | 'votes' | 'active') || 'newest'
  );
  const [tagFilterForAPI, setTagFilterForAPI] = useState<string>(() => searchParams.get('tags') || '');
  const [searchTextForAPI, setSearchTextForAPI] = useState<string>(() => searchParams.get('search') || '');

  const [pageSize] = useState<number>(10);
  const [totalItems, setTotalItems] = useState(0);

  const [inputSearchText, setInputSearchText] = useState<string>(searchTextForAPI);
  const [selectedTag, setSelectedTag] = useState<TagSummary | null>(null);
  const [tagAutocompleteInputValue, setTagAutocompleteInputValue] = useState('');

  const [allAvailableTags, setAllAvailableTags] = useState<TagSummary[]>([]);
  const [loadingTags, setLoadingTags] = useState<boolean>(false);

  const firstMount = useRef(true);

  useEffect(() => {
    const fetchTags = async () => {
      setLoadingTags(true);
      try {
        const response = await axios.get<TagSummary[]>(`${API_URL}/Tags`);
        setAllAvailableTags(response.data);
        const initialTagFromUrl = searchParams.get('tags');
        if (initialTagFromUrl) {
          const found = response.data.find(t => t.name.toLowerCase() === initialTagFromUrl.toLowerCase());
          if (found) { setSelectedTag(found); setTagAutocompleteInputValue(found.name); }
          else { setTagAutocompleteInputValue(initialTagFromUrl); }
        }
      } catch (e) { console.error("Error fetching tags:", e); }
      finally { setLoadingTags(false); }
    };
    fetchTags();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const newPage = parseInt(searchParams.get('page') || '1', 10);
    const newSort = (searchParams.get('sort') as 'newest' | 'votes' | 'active') || 'newest';
    const newTags = searchParams.get('tags') || '';
    const newSearch = searchParams.get('search') || '';

    if (newPage !== page) setPage(newPage);
    if (newSort !== sortOrder) setSortOrder(newSort);
    if (newTags !== tagFilterForAPI) {
        setTagFilterForAPI(newTags);
        if (newTags) {
            const found = allAvailableTags.find(t => t.name.toLowerCase() === newTags.toLowerCase());
            setSelectedTag(found || null);
            setTagAutocompleteInputValue(found ? found.name : newTags);
        } else { setSelectedTag(null); setTagAutocompleteInputValue(''); }
    }
    if (newSearch !== searchTextForAPI) {
        setSearchTextForAPI(newSearch);
        setInputSearchText(newSearch);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, allAvailableTags]); 

  const fetchAndSetUrl = useCallback(async () => {
    setLoading(true); setError(null);
    // console.log(`Fetching Questions with: page=${page}, sort=${sortOrder}, tags='${tagFilterForAPI}', search='${searchTextForAPI}'`); // Раскомментируй для отладки

    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('sort', sortOrder);
    if (tagFilterForAPI) params.append('tags', tagFilterForAPI);
    if (searchTextForAPI) params.append('search', searchTextForAPI);
    params.append('pageSize', pageSize.toString());

    const newUrlParams: Record<string, string> = {};
    if (page > 1) newUrlParams.page = page.toString();
    if (sortOrder !== 'newest') newUrlParams.sort = sortOrder;
    if (tagFilterForAPI) newUrlParams.tags = tagFilterForAPI;
    if (searchTextForAPI) newUrlParams.search = searchTextForAPI;
    
    const currentUrlSearchParams = new URLSearchParams(window.location.search);
    let shouldSetNewUrlParams = false;
    const allKeys = new Set([...Object.keys(newUrlParams), ...Array.from(currentUrlSearchParams.keys())]);
    allKeys.forEach(key => { if (newUrlParams[key] !== currentUrlSearchParams.get(key) && (newUrlParams[key] || currentUrlSearchParams.get(key) !== null )) shouldSetNewUrlParams = true; });
    
    if (shouldSetNewUrlParams) { // Обновляем URL, только если параметры изменились
        setSearchParams(newUrlParams, { replace: true });
    } else if (Object.keys(newUrlParams).length === 0 && Array.from(currentUrlSearchParams.keys()).length > 0) {
        // Если новые параметры пусты, а в URL что-то было, очищаем URL
        setSearchParams({}, { replace: true });
    }


    try {
      const response = await axios.get<PaginatedResponse<QuestionSummary>>(`${API_URL}/Questions`, { params });
      setQuestions(response.data.items);
      setTotalItems(response.data.totalCount);
    } catch (err) {
      console.error("Error fetching questions:", err);
      if (axios.isAxiosError(err)) { const errData = err.response?.data as { message?: string; details?: string }; setError(`Не удалось загрузить вопросы. ${errData?.message || errData?.details || 'Ошибка сервера'}`); }
      else { setError("Произошла неизвестная ошибка при загрузке вопросов."); }
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortOrder, tagFilterForAPI, searchTextForAPI, pageSize]); // Убрал setSearchParams, если он не меняется

  useEffect(() => {
    if (firstMount.current) {
        firstMount.current = false;
        // Начальная загрузка, если параметры URL уже установлены и совпадают с состоянием
        // или если URL пуст и используются дефолтные значения состояния.
        const initialSort = (searchParams.get('sort') as 'newest' | 'votes' | 'active') || 'newest';
        const initialTags = searchParams.get('tags') || '';
        const initialSearch = searchParams.get('search') || '';
        const initialPage = parseInt(searchParams.get('page') || '1', 10);
        if(page === initialPage && sortOrder === initialSort && tagFilterForAPI === initialTags && searchTextForAPI === initialSearch) {
            fetchAndSetUrl();
        }
        return;
    }
    fetchAndSetUrl();
  }, [fetchAndSetUrl]);


  // ИСПРАВЛЕНИЕ 1: убираем неиспользуемый 'event'
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
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
    const newTagAPI = selectedTag ? selectedTag.name : (tagAutocompleteInputValue.trim() || ''); // Используем текст из Autocomplete, если тег не выбран из списка

    let stateChanged = false;
    if (newSearchAPI !== searchTextForAPI) {
      setSearchTextForAPI(newSearchAPI);
      stateChanged = true;
    }
    if (newTagAPI !== tagFilterForAPI) {
      setTagFilterForAPI(newTagAPI);
      stateChanged = true;
    }

    if (stateChanged || page !== 1) { // Если фильтры изменились или мы не на 1 странице
        setPage(1);
    } else if (stateChanged && page === 1) {
      // Если страница уже 1, но фильтры изменились,
      // fetchAndSetUrl вызовется из-за изменения searchTextForAPI или tagFilterForAPI через основной useEffect
    }
  };
  
  const handleClearSearchFilter = () => {
    setInputSearchText('');
    if (searchTextForAPI !== '') {
      setSearchTextForAPI('');
      setPage(1);
    }
  };

  const handleClearTagFilterFromAutocomplete = () => {
    setSelectedTag(null);
    setTagAutocompleteInputValue(''); // Важно очистить и текст ввода
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
  };
  
  const areAnyFiltersApplied = Boolean(searchTextForAPI || tagFilterForAPI || sortOrder !== 'newest' || page !== 1);
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
                value={inputSearchText}
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
                value={selectedTag}
                inputValue={tagAutocompleteInputValue}
                // ИСПРАВЛЕНИЕ 2: убираем неиспользуемый 'event'
                onInputChange={(_event, newInputValue, reason) => {
                    setTagAutocompleteInputValue(newInputValue);
                    if (reason === 'clear' || (reason === 'input' && newInputValue === '')) {
                        if(selectedTag !== null || tagFilterForAPI !== '') handleClearTagFilterFromAutocomplete(); 
                    }
                }}
                // ИСПРАВЛЕНИЕ 3: убираем неиспользуемый 'event'
                onChange={(_event, newValue: TagSummary | null) => {
                    setSelectedTag(newValue);
                }}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Фильтр по тегу"
                    placeholder="Выберите или введите тег"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingTags ? <CircularProgress color="inherit" size={20} sx={{mr: params.InputProps.endAdornment ? 1 : 0}} /> : null}
                          {params.InputProps.endAdornment}
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
                    disabled={loading || (inputSearchText.trim() === searchTextForAPI && (selectedTag?.name || (tagAutocompleteInputValue.trim() || '')) === tagFilterForAPI)}
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

      {loading && ( <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}> <CircularProgress /> </Box> )}
      {error && <Alert severity="error" sx={{mb: 2}}>{error}</Alert>}
      {!loading && !error && questions.length === 0 && ( <Paper sx={{textAlign: 'center', p: {xs:2, sm:3}, color: 'text.secondary', mt: 2, }}> <Typography variant="h6" gutterBottom>Ничего не найдено</Typography> <Typography> Попробуйте изменить фильтры или <MuiLink component={RouterLink} to="/ask" fontWeight="medium">задайте свой вопрос</MuiLink>. </Typography> </Paper> )}
      {!loading && !error && questions.length > 0 && ( <Stack spacing={2}> {questions.map((question) => ( <QuestionCard key={question.id} question={question} /> ))} </Stack> )}
      {pageCount > 1 && !loading && questions.length > 0 && ( <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}> <Pagination count={pageCount} page={page} onChange={handlePageChange} color="primary" showFirstButton showLastButton size={ (typeof window !== 'undefined' && window.innerWidth < 600) ? 'small' : 'medium' } /> </Box> )}
    </Box>
  );
};

export default HomePage;