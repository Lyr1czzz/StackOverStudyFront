import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, CircularProgress, Alert, Button,
  TextField, Collapse, Stack, Pagination,
  IconButton
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import QuestionCard from '../components/QuestionCard';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface QuestionSummary {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    pictureUrl: string;
  };
  tags: { id: number; name: string }[];
  answerCount: number;
  rating: number;
}

const HomePage = () => {
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'votes' | 'active'>('newest');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('sort', sortOrder);
      if (tagFilter) params.append('tags', tagFilter);
      if (searchText) params.append('search', searchText);
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      const response = await axios.get<{
        items: QuestionSummary[];
        totalCount: number;
      }>('https://localhost:7295/api/Questions', { params });

      setQuestions(response.data.items);
      setTotalItems(response.data.totalCount);
    } catch (err) {
      setError("Не удалось загрузить список вопросов.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [sortOrder, tagFilter, searchText, page]);

  const pageCount = Math.ceil(totalItems / pageSize);

  return (
    <Box>
      {/* Заголовок */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2
      }}>
        <Box>
          <Typography variant="h5" component="h1">
            Новейшие вопросы
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {totalItems.toLocaleString()} вопроса(-ов)
          </Typography>
        </Box>
        <Button variant="contained" component={RouterLink} to="/ask">
          Задать вопрос
        </Button>
      </Box>

      {/* Фильтры */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="subtitle2">Фильтры</Typography>
          <IconButton onClick={() => setFiltersOpen(!filtersOpen)}>
            {filtersOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        <Collapse in={filtersOpen}>
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, mt: 1 }}>
            <Stack spacing={2}>
              <TextField
                label="Поиск по заголовкам"
                variant="outlined"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                fullWidth
              />
              <TextField
                label="Фильтр по тегу"
                variant="outlined"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                fullWidth
              />
            </Stack>
          </Box>
        </Collapse>
      </Box>

      {/* Ошибки и загрузка */}
      {error && <Alert severity="error">{error}</Alert>}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Карточки вопросов */}
      {!loading && !error && questions.length === 0 && (
        <Typography sx={{ textAlign: 'center', p: 3 }}>
          Пока нет ни одного вопроса. Станьте первым!
        </Typography>
      )}

      {!loading && !error && questions.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
          }}
        >
          {questions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}

          {/* Пагинация */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Pagination count={pageCount} page={page} onChange={(e, p) => setPage(p)} color="primary" />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default HomePage;