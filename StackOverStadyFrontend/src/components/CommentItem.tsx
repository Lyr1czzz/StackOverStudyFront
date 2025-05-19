import React from 'react';
import { Box, Typography, Link as MuiLink, Avatar, useTheme, IconButton, Tooltip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DeleteIcon from '@mui/icons-material/Delete'; // Иконка удаления
import { CommentData } from './CommentList'; // Импортируем интерфейс из CommentList

interface CommentItemProps {
    comment: CommentData;
    canDelete?: boolean;    // Флаг, может ли текущий пользователь удалить этот коммент
    onDeleteRequest?: () => void; // Колбэк для запроса на удаление (откроет диалог в CommentList)
    isFirst?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, canDelete, onDeleteRequest, isFirst }) => {
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
                borderTop: isFirst ? 'none' : `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'flex-start', // Выравниваем по верху
                gap: 1,
                position: 'relative', // Для позиционирования кнопки удаления
                '&:hover .delete-comment-btn': { // Показываем кнопку при наведении на весь элемент
                    opacity: 1,
                },
            }}
        >
            <MuiLink component={RouterLink} to={`/profile/${comment.user.id}`} sx={{ flexShrink: 0, mt: 0.25 }}>
                <Avatar
                    src={comment.user.pictureUrl || undefined}
                    alt={comment.user.name}
                    sx={{width: 20, height: 20, fontSize: '0.7rem'}} // Маленький аватар
                >
                    {!comment.user.pictureUrl && <AccountCircleIcon sx={{fontSize: '1.1rem'}}/>}
                </Avatar>
            </MuiLink>
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{display: 'flex', alignItems: 'baseline', flexWrap: 'wrap'}}>
                    <MuiLink
                        component={RouterLink}
                        to={`/profile/${comment.user.id}`}
                        underline="hover"
                        color="text.primary" // Имя автора более заметно
                        sx={{fontWeight: 500, fontSize: '0.8rem', mr: 0.75}}
                    >
                        {comment.user.name}
                    </MuiLink>
                    <Typography variant="caption" sx={{ color: 'text.disabled', whiteSpace: 'nowrap' }}>
                        {timeAgo}
                    </Typography>
                </Box>
                <Typography variant="body2" component="span" sx={{ color: 'text.primary', wordBreak: 'break-word', lineHeight: 1.5, fontSize: '0.875rem', mt: 0.25 }}>
                     {comment.text}
                </Typography>
            </Box>
            {canDelete && onDeleteRequest && (
                <Tooltip title="Удалить комментарий">
                    <IconButton
                        size="small"
                        onClick={onDeleteRequest}
                        className="delete-comment-btn" // Для :hover
                        sx={{
                            p:0.25,
                            opacity: { xs: 1, sm: 0 }, // На мобильных всегда видна, на десктопе при наведении
                            transition: 'opacity 0.2s ease-in-out',
                            color: 'text.disabled',
                            position: 'absolute', // Позиционируем справа
                            top: theme.spacing(0.5),
                            right: theme.spacing(0.5),
                            '&:hover': {
                                color: 'error.main',
                                backgroundColor: theme.palette.action.hover,
                            }
                        }}
                    >
                        <DeleteIcon sx={{fontSize: '1rem'}}/>
                    </IconButton>
                </Tooltip>
            )}
        </Box>
    );
};

export default CommentItem;