// src/components/QuestionCard.tsx
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Paper, Box, Typography, Chip, Avatar, Link, Tooltip, useTheme } from '@mui/material';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export interface QuestionSummaryDto {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    pictureUrl: string | null;
  };
  tags: { id: number; name: string }[];
  answerCount: number;
  rating: number;
  hasAcceptedAnswer: boolean;
}

interface QuestionCardProps {
  question: QuestionSummaryDto;
  view?: 'list' | 'grid'; // Новый проп для режима отображения
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, view = 'list' }) => {
  const theme = useTheme();
  const timeAgo = formatDistanceToNow(parseISO(question.createdAt), {
    addSuffix: true,
    locale: ru,
  });

  const hasAnyAnswer = question.answerCount > 0;
  const isSolved = question.hasAcceptedAnswer;

  let answerBlockStyles = {};
  let answerBlockContent;
  let answerBlockTooltip = "";

  if (isSolved) {
    answerBlockTooltip = "Вопрос решён";
    answerBlockStyles = {
      border: '1px solid',
      borderColor: 'success.main',
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.25)' : 'rgba(232, 245, 233, 0.8)',
      color: 'success.dark',
    };
    answerBlockContent = (
      <>
        <CheckCircleOutlineIcon sx={{ fontSize: view === 'grid' ? '1.4rem' : '1.7rem', mb: 0.1 }} />
        <Typography variant="caption" sx={{ lineHeight: 1.1, display: 'block', fontWeight: 500 }}>
          решён
        </Typography>
      </>
    );
  } else if (hasAnyAnswer) {
    answerBlockTooltip = `${question.answerCount} ${question.answerCount === 1 ? 'ответ' : (question.answerCount > 1 && question.answerCount < 5 ? 'ответа' : 'ответов')}`;
    answerBlockStyles = {
      backgroundColor: 'transparent',
      color: 'text.secondary',
    };
    answerBlockContent = (
      <>
        <Typography variant={view === 'grid' ? "h6" : "h6"} fontWeight="medium"> {/* Было h6, оставим */}
          {question.answerCount}
        </Typography>
        <Typography variant="caption" sx={{ lineHeight: 1.1, display: 'block' }}>
          {question.answerCount === 1 ? 'ответ' : (question.answerCount > 1 && question.answerCount < 5 ? 'ответа' : 'ответов')}
        </Typography>
      </>
    );
  } else {
    answerBlockTooltip = "Нет ответов";
    answerBlockStyles = {
      color: 'text.disabled',
      backgroundColor: 'transparent',
    };
    answerBlockContent = (
      <>
        <Typography variant={view === 'grid' ? "h6" : "h6"} fontWeight="medium">
          0
        </Typography>
        <Typography variant="caption" sx={{ lineHeight: 1.1, display: 'block' }}>
          ответов
        </Typography>
      </>
    );
  }

  // Для grid view делаем карточку выше и контент центрируем
  const isGridView = view === 'grid';

  return (
    <Paper
      sx={{
        display: 'flex',
        // border: '1px solid', // Уже из темы
        // borderColor: 'divider', // Уже из темы
        overflow: 'hidden',
        // borderRadius: 2, // Уже из темы
        flexDirection: isGridView ? 'column' : { xs: 'column', md: 'row' }, // В сетке всегда колонка
        height: isGridView ? '100%' : undefined, // Для Grid item, чтобы занимали всю высоту ячейки
        transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
            borderColor: 'primary.light',
            boxShadow: (theme) => `0 2px 8px 0px ${theme.palette.action.focus}`,
        },
        backgroundColor: isSolved ? (theme) => theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.03)' : 'rgba(232, 245, 233, 0.15)' : 'transparent',
      }}
    >
      <Box
        sx={{
          p: isGridView ? 1.5 : { xs: 1.5, md: 2 },
          bgcolor: 'action.hover',
          textAlign: 'center',
          width: isGridView ? '100%' : { xs: '100%', md: '100px' },
          minWidth: isGridView ? 'auto' : { xs: '100%', md: '100px' },
          display: 'flex',
          flexDirection: isGridView ? 'row' : {xs: 'row', md: 'column'},
          justifyContent: 'space-around',
          alignItems: 'center',
          gap: 1,
          borderRight: isGridView ? 'none' : { md: `1px solid`},
          borderBottom: isGridView ? `1px solid` : { xs: `1px solid`, md: 'none' },
          borderColor: 'divider',
        }}
      >
        <Box sx={{textAlign: 'center'}}>
            <Typography variant={isGridView ? "body2" : "body1"} fontWeight="medium" color="text.secondary">
            {question.rating ?? 0}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, display: 'block' }}>
            голосов
            </Typography>
        </Box>

        <Tooltip title={answerBlockTooltip} placement="top">
            <Box
                sx={{
                    textAlign: 'center',
                    borderRadius: 1.5,
                    px: 1,
                    py: 0.5,
                    minWidth: '60px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease-in-out',
                    ...answerBlockStyles
                }}
            >
            {answerBlockContent}
            </Box>
        </Tooltip>
      </Box>

      <Box sx={{ 
          flexGrow: 1, 
          p: isGridView ? 1.5 : 2, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between', 
          overflow: 'hidden',
          minHeight: isGridView ? 150 : 'auto' // Минимальная высота для контента в сетке
        }}>
        <div>
            <Typography
                variant={isGridView ? "subtitle1" : "h6"} // Меньше заголовок для сетки
                component="h2"
                sx={{
                    mb: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: isGridView ? 3 : 2, // Больше строк для сетки, если нужно
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.35,
                    minHeight: isGridView ? '4em' :'2.7em', 
                    maxHeight: isGridView ? '4em' :'2.7em',
                }}
            >
            <Link
                component={RouterLink}
                to={`/questions/${question.id}`}
                underline="hover"
                color="text.primary"
                sx={{ fontWeight: 500, '&:hover': {color: 'primary.main'} }}
            >
                {question.title}
            </Link>
            </Typography>

            {!isGridView && ( // Контент показываем только в режиме списка
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
                    maxHeight: '3em',
                    lineHeight: '1.5em',
                }}
              >
                {question.content.replace(/<[^>]*>?/gm, '').substring(0, 120) + (question.content.length > 120 ? '...' : '')}
              </Typography>
            )}

            <Box
            sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5,
                mb: 1.5,
                maxHeight: isGridView ? '42px' : 'auto', // Ограничиваем высоту тегов в сетке
                overflow: isGridView ? 'hidden' : 'visible',
            }}
            >
            {question.tags.slice(0, isGridView ? 3 : undefined).map((tag) => ( // Показываем меньше тегов в сетке
                <Chip
                    key={tag.id}
                    label={tag.name}
                    size="small"
                    component={RouterLink}
                    to={`/?tags=${encodeURIComponent(tag.name)}`}
                    clickable
                    sx={{ textTransform: 'lowercase' }} // backgroundColor из темы
                />
            ))}
            {isGridView && question.tags.length > 3 && (
                <Typography variant="caption" sx={{ml:0.5, color: 'text.secondary'}}>...</Typography>
            )}
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
                sx={{ width: 20, height: 20, mr: 0.75, fontSize: '0.8rem' }}
                >
                 {!question.author.pictureUrl && <AccountCircleIcon fontSize="inherit" />}
                </Avatar>
              </Tooltip>
              {!isGridView && ( // Имя автора только в списке
                <Typography variant="caption" color="text.secondary" sx={{ '&:hover': { textDecoration: 'underline', color: 'primary.main' }, fontWeight: 500, mr: 0.5 }}>
                    {question.author.name}
                </Typography>
              )}
          </Link>
          <Typography variant="caption" color="text.secondary" >
            {!isGridView && `• `}{timeAgo}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default QuestionCard;