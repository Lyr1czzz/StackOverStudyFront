// src/components/QuestionCard.tsx
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Paper, Box, Typography, Chip, Avatar, Link, Tooltip } from '@mui/material';
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
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
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
      backgroundColor: (theme: { palette: { mode: string; success: { main: any; light: any; }; }; }) => theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.25)' : 'rgba(232, 245, 233, 0.8)',
      color: 'success.dark',
    };
    answerBlockContent = (
      <>
        <CheckCircleOutlineIcon sx={{ fontSize: '1.7rem', mb: 0.25 }} />
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
        <Typography variant="h6" fontWeight="medium">
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
        <Typography variant="h6" fontWeight="medium">
          0
        </Typography>
        <Typography variant="caption" sx={{ lineHeight: 1.1, display: 'block' }}>
          ответов
        </Typography>
      </>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        border: '1px solid',
        // ИСПРАВЛЕНИЕ ЗДЕСЬ: Общая рамка карточки теперь всегда 'divider'
        // или можно сделать ее чуть темнее при наведении, но не зеленой по умолчанию для решенных
        borderColor: 'divider',
        overflow: 'hidden',
        borderRadius: 2,
        flexDirection: { xs: 'column', md: 'row' },
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
            borderColor: 'primary.main', // При наведении рамка становится основной
            boxShadow: (theme) => `0 4px 12px ${theme.palette.action.hover}`,
        },
        // Легкий фон для всей карточки если решен, может остаться, он не так бросается в глаза
        // Если хочешь убрать и его, то сделай:
        // backgroundColor: 'transparent',
        backgroundColor: isSolved ? (theme) => theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.05)' : 'rgba(232, 245, 233, 0.2)' : 'transparent',
      }}
    >
      {/* Блок с рейтингом и ответами */}
      <Box
        sx={{
          p: { xs: 1.5, md: 2 },
          bgcolor: 'action.hover',
          textAlign: 'center',
          width: { xs: '100%', md: '110px' },
          minWidth: { xs: '100%', md: '110px' },
          display: 'flex',
          flexDirection: {xs: 'row', md: 'column'},
          justifyContent: {xs: 'space-around', md:'center'},
          alignItems: 'center',
          gap: {xs:1, md:1},
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

        <Tooltip title={answerBlockTooltip} placement="top">
            <Box
                sx={{
                    textAlign: 'center',
                    borderRadius: '8px',
                    px: 1,
                    py: 0.5,
                    minWidth: '60px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    ...answerBlockStyles
                }}
            >
            {answerBlockContent}
            </Box>
        </Tooltip>
      </Box>

      {/* Основной контент карточки */}
      <Box sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
        <div>
            <Typography
                variant="h6"
                component="h2"
                sx={{
                    mb: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.3,
                    minHeight: '2.6em',
                }}
            >
            <Link
                component={RouterLink}
                to={`/questions/${question.id}`}
                underline="hover"
                color="text.primary"
                sx={{ fontWeight: 500 }}
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
                maxHeight: '2.8em',
                lineHeight: '1.4em',
            }}
            >
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