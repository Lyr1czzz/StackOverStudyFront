// src/components/Sidebar.tsx
import React from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  useTheme, // Для доступа к теме, если нужно
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import PersonIcon from '@mui/icons-material/Person';
import TagIcon from '@mui/icons-material/Tag';
import AddCommentIcon from '@mui/icons-material/AddComment'; // Или CreateIcon / PostAddIcon

interface SidebarProps {
  onDrawerToggle?: () => void; // Опциональный для стационарного сайдбара
}

const Sidebar: React.FC<SidebarProps> = ({ onDrawerToggle }) => {
  const location = useLocation();
  const theme = useTheme(); // Можно использовать для кастомных стилей

  const navItems = [
    { path: '/', icon: <HomeIcon />, text: 'Главная' },
    { path: '/tags', icon: <TagIcon />, text: 'Теги' },
    { path: '/ask', icon: <AddCommentIcon />, text: 'Задать вопрос' },
    // { path: '/profile', icon: <PersonIcon />, text: 'Профиль' }, // Профиль обычно в меню пользователя
    { path: '/about', icon: <InfoIcon />, text: 'О нас' },
  ];

  const handleItemClick = () => {
    if (onDrawerToggle) {
      onDrawerToggle(); // Закрываем мобильный Drawer при клике
    }
  };

  return (
    <Box sx={{ pt: 1 }}> {/* Небольшой отступ сверху внутри Paper сайдбара */}
      <Typography variant="overline" sx={{ pl: 2, pb: 0.5, display: 'block', color: 'text.secondary' }}>
        Меню
      </Typography>
      <List component="nav" dense sx={{ px: 1}}> {/* Отступы для элементов списка */}
        {navItems.map((item) => (
          <ListItemButton
            key={item.text}
            component={RouterLink}
            to={item.path}
            selected={location.pathname === item.path}
            onClick={handleItemClick}
            sx={{
                // borderRadius уже из темы (MuiListItemButton)
                mb: 0.5, // Отступ между элементами
                // Стили для selected и hover уже должны применяться из темы
            }}
          >
            <ListItemIcon sx={{minWidth: 38, color: location.pathname === item.path ? 'primary.main' : 'inherit' }}> {/* Иконка тоже может менять цвет */}
                {item.icon}
            </ListItemIcon>
            <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                    fontWeight: location.pathname === item.path ? 600 : 400, // Вес из темы
                    variant:'body2', 
                    color: location.pathname === item.path ? 'primary.main' : 'text.primary' 
                }} 
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar;