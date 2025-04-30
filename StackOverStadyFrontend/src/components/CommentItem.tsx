import React from 'react';
import { Box, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface CommentItemProps {
    comment: {
        id: number;
        text: string;
        createdAt: string;
        user: {
            id: number;
            name: string;
            // pictureUrl не обязателен для комментов
        };
    };
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
    const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ru });

    return (
        <Box
            sx={{
                py: 0.5, // Вертикальный отступ
                px: 1, // Горизонтальный отступ
                borderTop: '1px solid', // Линия сверху
                borderColor: 'divider',
                display: 'flex',
                fontSize: '0.8rem', // Меньший размер шрифта
                color: 'text.secondary', // Серый цвет
            }}
        >
            <Typography variant="caption" sx={{ mr: 1, flexShrink: 0 }}>
                 {comment.text}
            </Typography>
             <Typography variant="caption" sx={{ mr: 1, ml: 'auto', flexShrink: 0, whiteSpace: 'nowrap' }}>
                –  {/* Неразрывный пробел */}
                 <Link component={RouterLink} to={`/profile/${comment.user.id}`} underline="hover" color="inherit">
                     {comment.user.name}
                 </Link>
            </Typography>
            <Typography variant="caption" sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                {timeAgo}
            </Typography>
        </Box>
    );
};

export default CommentItem;