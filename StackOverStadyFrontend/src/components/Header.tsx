// src/components/Header.tsx

import React, { useState, useContext } from 'react'; // Добавили React для JSX
// <<< Импортируем Link из react-router-dom как RouterLink >>>
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    AppBar, Toolbar, Typography, Button, Avatar, Box, IconButton,
    Menu, MenuItem, TextField, useMediaQuery, Theme, Skeleton,
    Link // <<< Импортируем Link из MUI >>>
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useAuth } from '../AuthContext'; // Проверьте путь
import { ThemeContext } from '../ThemeContext'; // Проверьте путь

const Header = () => {
    // Контексты и состояния
    const { mode, toggleTheme } = useContext(ThemeContext) || { mode: 'light', toggleTheme: () => {} };
    const { user, loading, login, logout } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
    const navigate = useNavigate();

    // Обработчики меню
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const handleProfileClick = () => {
        handleMenuClose();
        navigate('/profile');
    };

    const handleLogoutClick = async () => {
         handleMenuClose();
         await logout();
         navigate('/');
    };

    // Функция для рендеринга секции авторизации
    const renderAuthSection = () => {
        if (loading) {
            return (
                <Box display="flex" alignItems="center" gap={1}>
                    <Skeleton variant="circular" width={32} height={32} animation="wave" />
                    {!isMobile && <Skeleton variant="text" width={80} height={20} animation="wave" />}
                </Box>
            );
        }

        if (user) {
            return (
                <>
                    <IconButton onClick={handleMenuOpen} size="small" sx={{ p: 0 }}>
                        <Avatar
                            src={user.pictureUrl}
                            alt={user.name}
                            sx={{ width: 32, height: 32 }}
                            imgProps={{ referrerPolicy: "no-referrer" }}
                        />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        sx={{ mt: '45px' }}
                        MenuListProps={{ 'aria-labelledby': 'profile-menu-button' }}
                    >
                         <Box sx={{ px: 2, py: 1, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                             <Typography variant="subtitle2" noWrap>{user.name}</Typography>
                             <Typography variant="caption" color="text.secondary" noWrap>{user.email}</Typography>
                         </Box>
                        <MenuItem onClick={handleProfileClick}>Профиль</MenuItem>
                        <MenuItem onClick={handleLogoutClick}>Выйти</MenuItem>
                    </Menu>
                </>
            );
        } else {
            return (
                <Button variant="contained" color="secondary" onClick={login} size="small">
                    Войти
                </Button>
            );
        }
    };

    // Основная разметка хедера
    return (
        <AppBar position="static">
            <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', minHeight: '56px' }}>
                {/* Левая часть */}
                <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
                     {/* Используем MUI Link С RouterLink */}
                    <Link
                        component={RouterLink} // <<< Указываем компонент роутера
                        to="/"
                        color="inherit" // <<< Используем пропы MUI Link
                        underline="none" // <<< Используем пропы MUI Link
                        sx={{ display: 'flex', alignItems: 'center' }} // Стили через sx
                    >
                         <img src="/logo.png" alt="Logo" style={{ height: 32, marginRight: '8px' }} />
                        <Typography variant="h6" fontWeight="bold" component="div" sx={{ display: { xs: 'none', sm: 'block' } }}>
                            StackOverStudy
                        </Typography>
                         <Typography variant="h6" fontWeight="bold" component="div" sx={{ display: { xs: 'block', sm: 'none' } }}>
                            SOS
                        </Typography>
                    </Link>
                    {/* Используем MUI Link С RouterLink и sx для display */}
                     <Link
                        component={RouterLink} // <<< Указываем компонент роутера
                        to="/about"
                        color="inherit"
                        underline="none"
                        sx={{
                             display: { xs: 'none', md: 'block' } // <<< Правильный синтаксис sx для display
                        }}
                    >
                        <Button color="inherit" size="small">О нас</Button>
                    </Link>
                </Box>

                {/* Поиск */}
                <Box sx={{ flexGrow: 1, mx: 2, maxWidth: '600px' }}>
                     <TextField
                        placeholder="Поиск..."
                        size="small"
                        variant="outlined"
                        fullWidth
                        sx={{ /* стили */ }}
                    />
                </Box>


                {/* Правая часть */}
                <Box display="flex" alignItems="center" gap={1}>
                    <IconButton onClick={toggleTheme} color="inherit" aria-label="сменить тему">
                        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                    {renderAuthSection()}
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;