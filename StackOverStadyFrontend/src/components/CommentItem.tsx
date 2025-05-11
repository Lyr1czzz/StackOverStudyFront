// src/components/CommentItem.tsx
import React from 'react';
import { Box, Typography, Link as MuiLink, Avatar, useTheme } from '@mui/material'; // Добавил Avatar, useTheme
import { Link as RouterLink } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns'; // Добавил parseISO
import { ru } from 'date-fns/locale';
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // Для аватара по умолчанию

interface CommentData { // Используем тот же интерфейс, что и в CommentList
    id: number; text: string; createdAt: string;
    user: { id: number; name: string; pictureUrl?: string; };
}

interface CommentItemProps {
    comment: CommentData;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
    const theme = useTheme();
    let timeAgo = "недавно";
    try {
        timeAgo = formatDistanceToNow(parseISO(comment.createdAt), { addSuffix: true, locale: ru });
    } catch (e) {
        console.warn("Invalid date for comment:", comment.createdAt);
    }
    

    return (
        <Box
            sx={{
                py: 1,
                px: 1.5,
                borderTop: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'flex-start', // Выравниваем по верху, если текст длинный
                gap: 1,
                '&:first-of-type': { // Убираем верхнюю границу у первого комментария, если кнопка скрыта
                   // borderTop: 'none', // Это лучше делать в CommentList, если нужно
                }
            }}
        >
            <MuiLink component={RouterLink} to={`/profile/${comment.user.id}`} sx={{ flexShrink: 0, mt: 0.25 }}>
                <Avatar 
                    src={comment.user.pictureUrl || undefined} 
                    alt={comment.user.name}
                    sx={{width: 20, height: 20, fontSize: '0.7rem'}}
                >
                    {!comment.user.pictureUrl && <AccountCircleIcon sx={{fontSize: '1.1rem'}}/>}
                </Avatar>
            </MuiLink>
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="caption" component="span" sx={{ color: 'text.primary', wordBreak: 'break-word' }}>
                     {comment.text}
                </Typography>
                <Typography variant="caption" component="span" sx={{ color: 'text.secondary', ml: 0.75 }}>
                    – <MuiLink component={RouterLink} to={`/profile/${comment.user.id}`} underline="hover" color="inherit" sx={{fontWeight: 'medium'}}>
                         {comment.user.name}
                     </MuiLink>
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', whiteSpace: 'nowrap', ml: 0.75 }}>
                    {timeAgo}
                </Typography>
            </Box>
        </Box>
    );
};

export default CommentItem;