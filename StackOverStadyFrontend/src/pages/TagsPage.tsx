// src/pages/TagsPage.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, CircularProgress, Alert,
  List, ListItem, ListItemText, Paper, Chip, Divider, Button
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

interface TagWithCount {
  id: number;
  name: string;
  questionCount: number;
}

const API_URL = 'https://localhost:7295/api'; // Your API base URL

const TagsPage = () => {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<TagWithCount[]>(`${API_URL}/Tags`);
        setTags(response.data);
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
    // Navigate to home page with tag filter
    navigate(`/?tags=${encodeURIComponent(tagName)}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Теги
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Всего тегов: {tags.length}
      </Typography>

      {tags.length === 0 && !loading && (
        <Typography>Теги еще не созданы.</Typography>
      )}

      <Paper elevation={2} sx={{ p: 2 }}>
        <List>
          {tags.map((tag, index) => (
            <React.Fragment key={tag.id}>
              <ListItem
                secondaryAction={
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleTagClick(tag.name)}
                  >
                    Вопросы ({tag.questionCount})
                  </Button>
                }
              >
                <ListItemText
                  primary={
                    <Typography variant="h6" component="span" sx={{ textTransform: 'capitalize' }}>
                      {tag.name}
                    </Typography>
                  }
                  secondary={`Использований: ${tag.questionCount}`}
                />
              </ListItem>
              {index < tags.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default TagsPage;