import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Paper, Box, Typography, Chip, Avatar, Link, Tooltip } from '@mui/material';
import { formatDistanceToNow, parseISO } from 'date-fns'; // Добавил parseISO
import { ru } from 'date-fns/locale';
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // Placeholder

// Убедитесь, что этот интерфейс соответствует данным, приходящим для списка вопросов
export interface QuestionSummaryDto {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    pictureUrl: string | null; // <--- ИЗМЕНЕНИЕ: теперь string | null
  };
  tags: { id: number; name: string }[];
  answerCount: number;
  rating: number;
}

interface QuestionCardProps {
  question: QuestionSummaryDto;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const timeAgo = formatDistanceToNow(parseISO(question.createdAt), { // Используем parseISO
    addSuffix: true,
    locale: ru,
  });

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        borderRadius: 1,
        flexDirection: { xs: 'column', md: 'row' },
        '&:hover': {
            borderColor: 'primary.main',
            boxShadow: (theme) => theme.shadows[1],
        }
      }}
    >
      <Box
        sx={{
          p: { xs: 1.5, md: 2 },
          bgcolor: 'action.hover',
          textAlign: 'center',
          width: { xs: '100%', md: '100px' }, // Чуть шире для лучшего вида
          minWidth: { xs: '100%', md: '100px' },
          display: 'flex',
          flexDirection: {xs: 'row', md: 'column'}, // Для мобильных в строку
          justifyContent: {xs: 'space-around', md:'center'},
          alignItems: 'center',
          gap: {xs:1, md:0.5},
          borderRight: { md: '1px solid' },
          borderBottom: { xs: '1px solid', md: 'none' },
          borderColor: 'divider',
        }}
      >
        <Box sx={{textAlign: 'center'}}>
            <Typography variant="body1" fontWeight="medium" color="text.secondary">
            {question.rating ?? 0}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, display: 'block' }}>
            голосов
            </Typography>
        </Box>
        <Box sx={{textAlign: 'center'}}>
            <Typography
            variant="body1"
            fontWeight={question.answerCount > 0 ? "bold" : "medium"}
            color={question.answerCount > 0 ? 'success.main' : 'text.secondary'}
            sx={{
                border: question.answerCount > 0 ? '1px solid' : 'none',
                borderColor: question.answerCount > 0 ? 'success.light' : 'transparent',
                borderRadius: '4px',
                px: question.answerCount > 0 ? 0.75 : 0,
                py: question.answerCount > 0 ? 0.25 : 0,
                minWidth: '24px',
                display: 'inline-block'
            }}
            >
            {question.answerCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, display: 'block' }}>
            ответов
            </Typography>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
            <Typography
                variant="h6"
                component="h2"
                sx={{
                    mb: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
            <Link
                component={RouterLink}
                to={`/questions/${question.id}`}
                underline="hover"
                color="text.primary"
                sx={{ fontWeight: 500 }} // Средний вес
            >
                {question.title}
            </Link>
            </Typography>

            <Typography
            variant="body2"
            color="text.secondary"
            sx={{
                mb: 1.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                maxHeight: '2.8em', // Примерно 2 строки
                lineHeight: '1.4em',
            }}
            >
            {/* Здесь лучше бы иметь краткое описание или начало текста, очищенное от HTML */}
            {question.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + (question.content.length > 150 ? '...' : '')}
            </Typography>

            <Box
            sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5,
                mb: 1.5,
            }}
            >
            {question.tags.map((tag) => (
                <Chip
                    key={tag.id}
                    label={tag.name}
                    size="small"
                    component={RouterLink}
                    to={`/?tags=${encodeURIComponent(tag.name)}`}
                    clickable
                    sx={{ textTransform: 'lowercase', '&:hover': { backgroundColor: 'action.selected'}}}
                />
            ))}
            </Box>
        </div>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            mt: 'auto',
          }}
        >
          <Link component={RouterLink} to={`/profile/${question.author.id}`} sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }} color="inherit">
              <Tooltip title={question.author.name} placement="top">
                <Avatar
                src={question.author.pictureUrl || undefined}
                alt={question.author.name}
                sx={{ width: 24, height: 24, mr: 0.75 }}
                >
                 {!question.author.pictureUrl && <AccountCircleIcon fontSize="small" />}
                </Avatar>
              </Tooltip>
              <Typography variant="caption" color="text.secondary" sx={{ '&:hover': { textDecoration: 'underline', color: 'primary.main' }, fontWeight: 500, mr: 0.5 }}>
                {question.author.name}
              </Typography>
          </Link>
          <Typography variant="caption" color="text.secondary" >
            {'•'} {timeAgo}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default QuestionCard;