import React, { useState, useContext } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  TextField
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useAuth } from '../AuthContext';
import { ThemeContext } from '../ThemeContext';

const Header = () => {
  const { mode, toggleTheme } = useContext(ThemeContext) || { mode: 'light', toggleTheme: () => {} };
  const { user, loading, login, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  const navigate = useNavigate();

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
            />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{ mt: '45px' }}
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
        <Button
          variant="contained"
          onClick={login}
          startIcon={
            <img 
              src="https://www.google.com/favicon.ico" 
              alt="Google" 
              style={{ height: 20, marginRight: 4 }} 
            />
          }
          sx={{
            border: '1px solid divider',
            boxShadow: 0,
          }}
        >
          Войти через Google
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
        boxShadow: 1
      }}
    >
      <Toolbar
        sx={{
          minHeight: '56px',
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* Ограниченный контейнер для содержимого хедера */}
        <Box
          sx={{
            maxWidth: '1200px',
            width: '100%',
            mx: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Левая часть */}
          <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
            <Link
              component={RouterLink}
              to="/"
              color="inherit"
              underline="none"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <img src="/newlogo.png" alt="Logo" style={{ height: 32, marginRight: '8px' }} />
              <Typography variant="h6" fontWeight="bold" component="div" sx={{ display: { xs: 'none', sm: 'block' } }}>
                StackOverStudy
              </Typography>
              <Typography variant="h6" fontWeight="bold" component="div" sx={{ display: { xs: 'block', sm: 'none' } }}>
                SOS
              </Typography>
            </Link>

            <Link
              component={RouterLink}
              to="/about"
              color="inherit"
              underline="none"
              sx={{
                display: { xs: 'none', md: 'block' },
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
            />
          </Box>

          {/* Правая часть */}
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton onClick={toggleTheme} color="inherit" aria-label="сменить тему">
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