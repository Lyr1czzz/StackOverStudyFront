import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Paper,
  Box,
  Typography,
  Chip,
  Avatar,
  Link,
  Tooltip
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';

interface QuestionCardProps {
  question: {
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
  };
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const timeAgo = formatDistanceToNow(new Date(question.createdAt), {
    addSuffix: true,
  });

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        borderRadius: 0,
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      {/* Статистика слева */}
      <Box
        sx={{
          p: 1,
          bgcolor: 'action.hover',
          textAlign: 'center',
          width: { xs: '100%', md: '60px' },
          minWidth: { xs: '100%', md: '60px' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {question.rating ?? 0}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          голосов
        </Typography>
        <Typography
          variant="body2"
          fontWeight="bold"
          color={question.answerCount > 0 ? 'success.main' : 'text.secondary'}
        >
          {question.answerCount}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          ответов
        </Typography>
      </Box>

      {/* Основной контент */}
      <Box sx={{ flexGrow: 1, p: 2, width: '100%' }}>
        {/* Заголовок */}
        <Typography
          sx={{
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
          }}
        >
          <Link component={RouterLink} to={`/questions/${question.id}`} underline="hover">
            {question.title}
          </Link>
        </Typography>

        {/* Описание */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            maxHeight: '3em',
            lineHeight: '1.5em',
          }}
        >
          {question.content}
        </Typography>

        {/* Теги */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.5,
            mb: 1,
          }}
        >
          {question.tags.map((tag) => (
            <Chip key={tag.id} label={tag.name} size="small"/>
          ))}
        </Box>

        {/* Автор и дата */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            mt: 1,
          }}
        >
          <Tooltip title={question.author.name} placement="top">
            <Avatar
              src={question.author.pictureUrl}
              alt={question.author.name}
              sx={{ width: 20, height: 20, mr: 1 }}
              component={RouterLink}
              to={`/profile/${question.author.id}`}
              imgProps={{ referrerPolicy: 'no-referrer' }}
            />
          </Tooltip>
          <Typography variant="caption" color="text.secondary">
            <Link component={RouterLink} to={`/profile/${question.author.id}`} underline="hover">
              {question.author.name}
            </Link>
            {' • '} {timeAgo}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default QuestionCard;