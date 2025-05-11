import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link as RouterLink, useLocation, useSearchParams } from 'react-router-dom';
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
  Skeleton,
  Link,
  TextField,
  InputAdornment,
  Container,
  ListItemIcon,
  ListItemText,
  Tooltip,
  useTheme, // Импортируем useTheme
  Theme as MuiTheme, // Для типизации theme из useTheme
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useAuth } from '../AuthContext';
import { useAppTheme } from '../ThemeContext'; // Используем наш хук для темы

interface HeaderProps {
  onDrawerToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onDrawerToggle }) => {
  const { mode, toggleTheme } = useAppTheme(); // Используем наш хук
  const { user, loading, login, logout } = useAuth();
  const [anchorElUserMenu, setAnchorElUserMenu] = useState<null | HTMLElement>(null);
  
  const muiStdTheme = useTheme(); // Стандартная тема MUI для брейкпоинтов
  const isMobile = useMediaQuery(muiStdTheme.breakpoints.down('sm'));
  const isMediumOrUp = useMediaQuery(muiStdTheme.breakpoints.up('md'));

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const currentSearchParam = searchParams.get('search');
    if (location.pathname === '/') {
        setSearchQuery(currentSearchParam || '');
    } else {
        setSearchQuery('');
    }
  }, [searchParams, location.pathname]);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorElUserMenu(event.currentTarget);
  const handleUserMenuClose = () => setAnchorElUserMenu(null);

  const handleProfileClick = () => {
    handleUserMenuClose();
    navigate('/profile');
  };

  const handleLogoutClick = async () => {
    handleUserMenuClose();
    await logout();
    navigate('/');
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      navigate(`/?search=${encodeURIComponent(trimmedQuery)}&page=1`);
    } else {
      navigate('/');
    }
  };

  const renderAuthSection = () => {
    if (loading) {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <Skeleton variant="circular" width={32} height={32} animation="wave"/>
          {!isMobile && <Skeleton variant="text" width={70} height={20} animation="wave"/>}
        </Box>
      );
    }

    if (user) {
      return (
        <>
          <Tooltip title="Меню пользователя">
            <IconButton onClick={handleUserMenuOpen} size="small" sx={{ p: 0 }} id="user-menu-button-header">
              <Avatar
                src={user.pictureUrl || undefined}
                alt={user.name || 'User Avatar'}
                sx={{ width: 32, height: 32, border: '1px solid', borderColor: 'divider' }}
              >
                {!user.pictureUrl && <AccountCircleIcon />}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorElUserMenu}
            open={Boolean(anchorElUserMenu)}
            onClose={handleUserMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            MenuListProps={{ 'aria-labelledby': 'user-menu-button-header' }}
            PaperProps={{sx: { minWidth: 220, borderRadius: 2, mt: 1.5, boxShadow: muiStdTheme.shadows[3] }}}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight="medium" noWrap>{user.name}</Typography>
              {user.email && <Typography variant="caption" color="text.secondary" noWrap>{user.email}</Typography>}
            </Box>
            <MenuItem onClick={handleProfileClick} sx={{py: 1.25, px: 2}}>
              <ListItemIcon sx={{minWidth: 36}}><PersonOutlineIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Профиль</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleLogoutClick} sx={{py: 1.25, px: 2}}>
              <ListItemIcon sx={{minWidth: 36}}><ExitToAppIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Выйти</ListItemText>
            </MenuItem>
          </Menu>
        </>
      );
    } else {
      return (
        <Button
          variant="contained"
          color="primary"
          onClick={login}
          size={isMobile ? "small" : "medium"}
          startIcon={
            <img src="https://www.google.com/favicon.ico" alt="Google" style={{ height: 16, width: 16 }}/>
          }
          sx={{ textTransform: 'none', whiteSpace: 'nowrap', px: isMobile ? 1.25 : 1.75, py: isMobile ? 0.5 : 0.75 }}
        >
          Войти
        </Button>
      );
    }
  };

  return (
    <AppBar
      position="fixed"
      color="inherit" // Наследует фон из темы (background.paper)
      // elevation={0} // Управляется из темы (components.MuiAppBar.defaultProps)
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        // borderBottom и boxShadow также должны применяться из темы
      }}
    >
      <Container maxWidth="lg"> {/* Тот же maxWidth, что и в App.tsx, БЕЗ disableGutters */}
        <Toolbar disableGutters sx={{ minHeight: { xs: 56, sm: 64 } }}> {/* Toolbar БЕЗ px, disableGutters чтобы не добавлял своих отступов */}
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', gap: {xs: 0.5, sm: 1} }}>
            
            <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, mr: {xs: 0, sm: 1} }}>
              <IconButton
                aria-label="open drawer"
                edge="start"
                onClick={onDrawerToggle}
                sx={{ display: { md: 'none' }, mr: 0.5, color: 'text.secondary' }}
              >
                <MenuIcon />
              </IconButton>
              <Link component={RouterLink} to="/" underline="none" sx={{ display: 'flex', alignItems: 'center' }}>
                <img src="/logo.png" alt="Logo" style={{ height: isMobile ? 28 : 32, marginRight: 8 }} />
                <Typography
                  variant={isMobile ? "h6" : "h5"}
                  noWrap
                  component="div"
                  color="text.primary"
                  fontWeight="bold"
                  sx={{ display: { xs: 'none', sm: 'block' } }}
                >
                  StackOverStudy
                </Typography>
                <Typography variant="h6" fontWeight="bold" component="div" sx={{ display: { xs: 'block', sm: 'none' }, color: 'text.primary' }}>
                  SOS
                </Typography>
              </Link>
            </Box>

            <Box sx={{ flexGrow: 1, mx: { xs: 1, sm: 2 }, maxWidth: {xs: 200, sm: 350, md: 500} }}>
              <form onSubmit={handleSearchSubmit}>
                <TextField
                  placeholder="Поиск..."
                  size="small"
                  variant="outlined"
                  fullWidth
                  value={searchQuery}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                  // Стили для TextField теперь должны применяться из темы (components.MuiTextField)
                />
              </form>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: {xs: 0.25, sm: 1}, flexShrink: 0 }}>
              {isMediumOrUp && (
                  <Button component={RouterLink} to="/about" color="inherit" size="small" sx={{color: 'text.secondary', '&:hover': {color: 'text.primary', bgcolor: 'action.hover'}}}>
                      О нас
                  </Button>
              )}
              <Tooltip title={mode === 'dark' ? 'Светлая тема' : 'Темная тема'}>
                <IconButton onClick={toggleTheme} sx={{color: 'text.secondary'}}>
                  {mode === 'dark' ? <Brightness7Icon fontSize="small"/> : <Brightness4Icon fontSize="small"/>}
                </IconButton>
              </Tooltip>
              {renderAuthSection()}
            </Box>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;