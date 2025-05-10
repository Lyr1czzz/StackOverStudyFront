// src/pages/HomePage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box, Typography, CircularProgress, Alert, Button,
  TextField, Collapse, Stack, Pagination,
  IconButton, Paper,
  Link as MuiLink // <--- ДОБАВЬ ЭТУ СТРОКУ
} from '@mui/material';
import { Link as RouterLink, useSearchParams, useNavigate } from 'react-router-dom';
import QuestionCard from '../components/QuestionCard';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

// ... остальной код файла HomePage.tsx без изменений ...

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

  const [sortOrder, setSortOrder] = useState<'newest' | 'votes' | 'active'>(
    (searchParams.get('sort') as 'newest' | 'votes' | 'active') || 'newest'
  );
  const [tagFilter, setTagFilter] = useState<string>(searchParams.get('tags') || '');
  const [searchText, setSearchText] = useState<string>(searchParams.get('search') || '');
  const [page, setPage] = useState<number>(parseInt(searchParams.get('page') || '1', 10));
  const [pageSize] = useState<number>(10);
  const [totalItems, setTotalItems] = useState(0);

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
      if (axios.isAxiosError(err)) {
        const errData = err.response?.data as { message?: string };
        setError(`Не удалось загрузить список вопросов. ${errData?.message || ''}`);
      } else {
        setError("Произошла неизвестная ошибка при загрузке вопросов.");
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortOrder, tagFilter, searchText, setSearchParams]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);


  useEffect(() => {
    const newPage = parseInt(searchParams.get('page') || '1', 10);
    const newSortOrder = (searchParams.get('sort') as 'newest' | 'votes' | 'active') || 'newest';
    const newTagFilter = searchParams.get('tags') || '';
    const newSearchText = searchParams.get('search') || '';

    if (newPage !== page) setPage(newPage);
    if (newSortOrder !== sortOrder) setSortOrder(newSortOrder);
    if (newTagFilter !== tagFilter) {
        setTagFilter(newTagFilter);
        setCurrentTagFilter(newTagFilter);
    }
    if (newSearchText !== searchText) {
        setSearchText(newSearchText);
        setCurrentSearchText(newSearchText);
    }
  }, [searchParams, page, sortOrder, tagFilter, searchText]);


  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleApplyFilters = () => {
    let changed = false;
    if (currentSearchText !== searchText) {
        setSearchText(currentSearchText);
        changed = true;
    }
    if (currentTagFilter !== tagFilter) {
        setTagFilter(currentTagFilter);
        changed = true;
    }
    if (changed || page !== 1) {
        setPage(1);
    }
  };

  const handleClearTagFilter = () => {
    setCurrentTagFilter('');
    if (tagFilter !== '') {
        setTagFilter('');
        setPage(1);
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
  const effectivePageTitle = tagFilter ? `Вопросы с тегом "${tagFilter.split(',').map(t => t.trim()).filter(Boolean).join('", "')}"` : (searchText ? `Результаты поиска по "${searchText}"`: 'Все вопросы');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" component="h1" sx={{fontSize: {xs: '1.5rem', sm: '1.75rem', md: '2rem'}}}>
            {effectivePageTitle}
          </Typography>
          {totalItems > 0 && (
            <Typography variant="body2" color="text.secondary">
                {totalItems.toLocaleString()} вопрос{totalItems % 10 === 1 && totalItems % 100 !== 11 ? '' : (totalItems % 10 >= 2 && totalItems % 10 <= 4 && (totalItems % 100 < 10 || totalItems % 100 >= 20) ? 'а' : 'ов')}
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
          <Stack direction="row" spacing={{xs: 0.5, sm:1}} sx={{flexWrap: 'wrap', justifyContent: 'center'}}>
            {(['newest', 'votes', 'active'] as const).map((s) => (
              <Button
                key={s}
                variant={sortOrder === s ? 'contained' : 'outlined'}
                size="small"
                onClick={() => {
                  setSortOrder(s);
                  setPage(1);
                }}
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
                startIcon={<SearchIcon />}
                disabled={loading || (currentSearchText === searchText && currentTagFilter === tagFilter)}
                sx={{alignSelf: 'flex-start'}}
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
      {error && <Alert severity="error" sx={{mb: 2, borderRadius: 2}}>{error}</Alert>}

      {!loading && !error && questions.length === 0 && (
        <Paper elevation={0} sx={{textAlign: 'center', p: 3, color: 'text.secondary', borderRadius: 2, mt: 2, border: '1px dashed', borderColor: 'divider'}}>
          <Typography>
            По вашему запросу ничего не найдено.
          </Typography>
          <Typography sx={{mt: 1}}>
            Попробуйте изменить фильтры или <MuiLink component={RouterLink} to="/ask" fontWeight="bold">задайте свой вопрос</MuiLink>! {/* Здесь используется MuiLink */}
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

      {pageCount > 1 && !loading && (
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