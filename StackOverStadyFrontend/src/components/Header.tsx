import React, { useState, useContext, useEffect } from 'react'; // Добавил useEffect
import { useNavigate, Link as RouterLink, useLocation, useSearchParams } from 'react-router-dom'; // Добавил useLocation, useSearchParams
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  Theme,
  Skeleton,
  Link,
  TextField,
  InputAdornment // Для иконки поиска
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import SearchIcon from '@mui/icons-material/Search'; // Иконка поиска
import { useAuth } from '../AuthContext';
import { ThemeContext } from '../ThemeContext';

const Header = () => {
  const { mode, toggleTheme } = useContext(ThemeContext) || { mode: 'light', toggleTheme: () => {} };
  const { user, loading, login, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation(); // Чтобы знать текущий путь
  const [searchParams] = useSearchParams(); // Чтобы получить текущий параметр поиска из URL

  // Состояние для поискового запроса в хедере
  const [searchQuery, setSearchQuery] = useState('');

  // Эффект для обновления searchQuery в хедере, если параметр search изменился в URL
  // (например, при переходе по ссылке с тегом или при навигации назад/вперед)
  useEffect(() => {
    const currentSearchParam = searchParams.get('search');
    if (location.pathname === '/') { // Обновляем поле поиска только если мы на главной
        setSearchQuery(currentSearchParam || '');
    } else {
        // Если мы не на главной, можно очистить поле поиска в хедере
        // или оставить его как есть, в зависимости от желаемого поведения
        setSearchQuery(''); // Очищаем, если ушли с главной
    }
  }, [searchParams, location.pathname]);


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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchSubmit = (event?: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLDivElement>) => {
    if (event && typeof (event as React.FormEvent<HTMLFormElement>).preventDefault === 'function') {
        (event as React.FormEvent<HTMLFormElement>).preventDefault();
    }
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      navigate(`/?search=${encodeURIComponent(trimmedQuery)}`);
    } else {
      // Если запрос пустой, но мы уже на главной, можем просто убрать search параметр
      // или если не на главной - перейти на главную без параметров
      if (location.pathname === '/') {
        navigate('/'); // Уберет search параметр, если он был
      } else {
        navigate('/');
      }
    }
  };


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
              src={user.pictureUrl || undefined} // Добавил undefined для случая null
              alt={user.name}
              sx={{ width: 32, height: 32 }}
            />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            MenuListProps={{ 'aria-labelledby': 'user-menu-button' }} // Для доступности
            sx={{ mt: '45px' }} // Можно заменить на PaperProps sx для лучшей практики
          >
            <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" noWrap>{user.name}</Typography>
              {user.email && <Typography variant="caption" color="text.secondary" noWrap>{user.email}</Typography>}
            </Box>
            <MenuItem onClick={handleProfileClick}>Профиль</MenuItem>
            <MenuItem onClick={handleLogoutClick}>Выйти</MenuItem>
          </Menu>
        </>
      );
    } else {
      return (
        <Button
          variant="contained"
          color="primary" // Явно укажем цвет
          onClick={login}
          startIcon={
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              style={{ height: 18, marginRight: 0 }} // Уменьшил и убрал отступ
            />
          }
          sx={{
            // border: '1px solid divider', // Не нужно для contained
            boxShadow: 0,
            textTransform: 'none', // Уберем капс
            fontSize: '0.875rem',
            px: 1.5, // Немного уменьшим паддинг
          }}
        >
          Войти
        </Button>
      );
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'background.paper',
        boxShadow: (theme) => theme.shadows[1] // Более мягкая тень
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 56, sm: 64 }, // Стандартные высоты
          px: { xs: 1, sm: 2, md: 3 }, // Адаптивные отступы
        }}
      >
        <Box
          sx={{
            maxWidth: 'xl', // Можно использовать стандартные брейкпоинты MUI
            width: '100%',
            mx: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: { xs: 1, sm: 2 } // Пространство между основными блоками
          }}
        >
          {/* Левая часть */}
          <Box display="flex" alignItems="center" sx={{ flexShrink: 0 }}> {/* Предотвращает сжатие лого */}
            <Link
              component={RouterLink}
              to="/"
              color="text.primary" // Для лучшей читаемости на фоне paper
              underline="none"
              sx={{ display: 'flex', alignItems: 'center', mr: { xs: 1, sm: 2} }}
            >
              <img src="/newlogo.png" alt="Logo" style={{ height: 32, marginRight: isMobile ? 4 : 8 }} />
              <Typography variant="h6" fontWeight="bold" component="div" sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.primary' }}>
                StackOverStudy
              </Typography>
              <Typography variant="h6" fontWeight="bold" component="div" sx={{ display: { xs: 'block', sm: 'none' }, color: 'text.primary' }}>
                SOS
              </Typography>
            </Link>

            <Link
              component={RouterLink}
              to="/about"
              color="inherit"
              underline="hover" // Можно hover для лучшей интерактивности
              sx={{
                display: { xs: 'none', md: 'block' },
                color: 'text.secondary',
                '&:hover': { color: 'text.primary'}
              }}
            >
              <Button color="inherit" size="small">О нас</Button>
            </Link>
          </Box>

          {/* Поиск (теперь обернут в форму) */}
          <Box sx={{ flexGrow: 1, mx: { xs: 1, sm: 2 }, maxWidth: '600px' }}>
            <form onSubmit={handleSearchSubmit}>
              <TextField
                placeholder="Поиск вопросов..."
                size="small"
                variant="outlined"
                fullWidth
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '20px', // Скругленные углы
                        backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
                    },
                }}
              />
            </form>
          </Box>

          {/* Правая часть */}
          <Box display="flex" alignItems="center" gap={{xs: 0.5, sm:1}} sx={{ flexShrink: 0 }}> {/* Предотвращает сжатие */}
            <IconButton onClick={toggleTheme} color="inherit" aria-label="сменить тему" sx={{color: 'text.secondary'}}>
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            {renderAuthSection()}
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;