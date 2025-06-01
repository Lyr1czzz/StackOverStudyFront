import {
  Box,
  Typography,
  Link as MuiLink, // Переименовал, чтобы не конфликтовать с RouterLink
  Divider,
  Stack,
  IconButton, // Для иконок соцсетей, если захочешь сделать их просто иконками
  useTheme,
  Tooltip,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom'; // Для навигации

// Иконки для навигации и соцсетей
import HomeIcon from '@mui/icons-material/Home';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'; // Используем Outlined версию
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
// import TwitterIcon from '@mui/icons-material/Twitter'; // Если нужен Twitter

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const theme = useTheme();

  const navLinkStyles = {
    display: 'flex',
    alignItems: 'center',
    py: 0.5, // Уменьшим вертикальный отступ
    color: 'text.secondary',
    textDecoration: 'none',
    '&:hover': {
      color: 'primary.main',
      textDecoration: 'underline',
    },
  };

  const socialLinkStyles = {
    color: 'text.secondary',
    '&:hover': {
      color: 'primary.main',
    },
  };

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto', // Прижимает футер к низу, если контент короче
        pt: { xs: 3, sm: 4 }, // Адаптивные отступы
        pb: { xs: 2, sm: 3 },
        backgroundColor: 'background.paper', // Из темы
        borderTop: `1px solid ${theme.palette.divider}`, // Из темы
      }}
    >
      <Box // Контейнер для ограничения ширины, аналог Container maxWidth="lg"
        sx={{
          maxWidth: 'lg', // Используем брейкпоинт из темы, соответствует 1200px по умолчанию
          mx: 'auto',
          px: { xs: 2, sm: 3 }, // Адаптивные боковые отступы
        }}
      >
        {/* Верхняя часть с колонками */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, // Колонки на md+, стек на xs
            justifyContent: 'space-between',
            gap: { xs: 3, md: 4 }, // Отступы между колонками
            mb: { xs: 3, sm: 4 },
          }}
        >
          {/* Колонка 1: Навигация по сайту */}
          <Box sx={{ flex: '1 1 200px', minWidth: '180px' }}> {/* flex-grow, flex-shrink, flex-basis */}
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom component="div">
              StackOverStudy
            </Typography>
            <Stack spacing={0.5} component="nav">
              <MuiLink component={RouterLink} to="/" sx={navLinkStyles}>
                <HomeIcon fontSize="small" sx={{ mr: 1 }} />
                Главная
              </MuiLink>
              <MuiLink component={RouterLink} to="/?sort=newest" sx={navLinkStyles}> {/* Пример ссылки на вопросы */}
                <QuestionAnswerOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
                Вопросы
              </MuiLink>
              <MuiLink component={RouterLink} to="/about" sx={navLinkStyles}>
                <InfoOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
                О нас
              </MuiLink>
              <MuiLink component={RouterLink} to="/profile" sx={navLinkStyles}>
                <PersonOutlineOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
                Профиль
              </MuiLink>
            </Stack>
          </Box>

          {/* Колонка 2: Компания/Ресурсы */}
          <Box sx={{ flex: '1 1 200px', minWidth: '180px' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom component="div">
              Ресурсы
            </Typography>
            <Stack spacing={0.5}>
              <MuiLink component={RouterLink} to="/about" sx={navLinkStyles}>
                О проекте
              </MuiLink>
              <MuiLink component={RouterLink} to="/terms" sx={navLinkStyles} onClick={(e) => { e.preventDefault(); alert('Страница "Условия использования" в разработке');}}>
                Условия использования
              </MuiLink>
              <MuiLink component={RouterLink} to="/privacy" sx={navLinkStyles} onClick={(e) => { e.preventDefault(); alert('Страница "Политика конфиденциальности" в разработке');}}>
                Политика конфиденциальности
              </MuiLink>
            </Stack>
          </Box>

          {/* Колонка 3: Социальные сети / Связь */}
          <Box sx={{ flex: '1 1 200px', minWidth: '180px' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom component="div">
              Свяжитесь с нами
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{mt:1}}>
              <Tooltip title="GitHub проекта">
                <IconButton component="a" href="https://github.com/YOUR_USERNAME/YOUR_REPO" target="_blank" rel="noopener noreferrer" sx={socialLinkStyles} aria-label="GitHub">
                  <GitHubIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="LinkedIn (если есть)">
                <IconButton component="a" href="https://linkedin.com/in/YOUR_PROFILE" target="_blank" rel="noopener noreferrer" sx={socialLinkStyles} aria-label="LinkedIn">
                  <LinkedInIcon />
                </IconButton>
              </Tooltip>
              {/* Добавьте другие соцсети по необходимости */}
            </Stack>
             <Typography variant="body2" color="text.secondary" sx={{mt: 2}}>
                Email: contact@stackoverstudy.dev
            </Typography>
          </Box>

        </Box>

        <Divider sx={{ my: 2.5 }} />

        {/* Нижняя строка с копирайтом и доп. ссылками */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, // На маленьких экранах в столбик
            justifyContent: 'space-between', 
            alignItems: 'center', 
            gap: 2 
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {currentYear} StackOverStudy. Все права защищены.
          </Typography>
          <Stack direction="row" spacing={2} divider={<Divider orientation="vertical" flexItem />}>
            <MuiLink component={RouterLink} to="/terms" color="text.secondary" underline="hover" variant="caption" onClick={(e) => { e.preventDefault(); alert('Страница "Условия использования" в разработке');}}>
              Условия
            </MuiLink>
            <MuiLink component={RouterLink} to="/privacy" color="text.secondary" underline="hover" variant="caption" onClick={(e) => { e.preventDefault(); alert('Страница "Политика конфиденциальности" в разработке');}}>
              Конфиденциальность
            </MuiLink>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;