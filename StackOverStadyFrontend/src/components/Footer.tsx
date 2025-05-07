// src/components/Footer.tsx
import React from 'react';
import {
  Box,
  Typography,
  Link,
  Divider,
  Grid,
  Stack
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import PersonIcon from '@mui/icons-material/Person';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        pt: 3,
        pb: 2,
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider'
      }}
    >
      {/* Ограниченный контейнер */}
      <Box
        sx={{
          maxWidth: '1200px',
          mx: 'auto',
          px: 3
        }}
      >
        {/* Основная часть футера */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Левая колонка */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              StackOverStudy
            </Typography>
            <Stack spacing={1} component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              <li>
                <Link
                  component="button"
                  color="text.secondary"
                  underline="hover"
                  onClick={() => window.location.href = '/'}
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <HomeIcon fontSize="small" sx={{ mr: 1 }} />
                  Home
                </Link>
              </li>
              <li>
                <Link
                  component="button"
                  color="text.secondary"
                  underline="hover"
                  onClick={() => window.location.href = '/questions'}
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <QuestionAnswerIcon fontSize="small" sx={{ mr: 1 }} />
                  Вопросы
                </Link>
              </li>
              <li>
                <Link
                  component="button"
                  color="text.secondary"
                  underline="hover"
                  onClick={() => window.location.href = '/about'}
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <InfoIcon fontSize="small" sx={{ mr: 1 }} />
                  О нас
                </Link>
              </li>
              <li>
                <Link
                  component="button"
                  color="text.secondary"
                  underline="hover"
                  onClick={() => window.location.href = '/profile'}
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                  Профиль
                </Link>
              </li>
            </Stack>
          </Grid>

          {/* Центральная колонка */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Компания
            </Typography>
            <Stack spacing={1} component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              <li>
                <Link
                  component="button"
                  color="text.secondary"
                  underline="hover"
                  onClick={() => alert('О проекте')}
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  О проекте
                </Link>
              </li>
              <li>
                <Link
                  component="button"
                  color="text.secondary"
                  underline="hover"
                  onClick={() => alert('Условия использования')}
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  Условия использования
                </Link>
              </li>
              <li>
                <Link
                  component="button"
                  color="text.secondary"
                  underline="hover"
                  onClick={() => alert('Политика конфиденциальности')}
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  Политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link
                  component="button"
                  color="text.secondary"
                  underline="hover"
                  onClick={() => alert('Реклама')}
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  Реклама
                </Link>
              </li>
            </Stack>
          </Grid>

          {/* Правая колонка */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Связь
            </Typography>
            <Stack spacing={1} component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              <li>
                <Link
                  component="a"
                  href="https://github.com"
                  color="text.secondary"
                  underline="hover"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <GitHubIcon fontSize="small" sx={{ mr: 1 }} />
                  GitHub
                </Link>
              </li>
              <li>
                <Link
                  component="a"
                  href="https://linkedin.com"
                  color="text.secondary"
                  underline="hover"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <LinkedInIcon fontSize="small" sx={{ mr: 1 }} />
                  LinkedIn
                </Link>
              </li>
              <li>
                <Link
                  component="a"
                  href="https://twitter.com"
                  color="text.secondary"
                  underline="hover"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <TwitterIcon fontSize="small" sx={{ mr: 1 }} />
                  Twitter
                </Link>
              </li>
            </Stack>
          </Grid>

          {/* Права и статистика */}
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Статистика
            </Typography>
            <Stack spacing={1} component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              <li>
                <Typography variant="body2" color="text.secondary">
                  24,235,748 вопросов
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  © {currentYear} StackOverStudy
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  Разработано с ❤️ на React + MUI
                </Typography>
              </li>
            </Stack>
          </Grid>
        </Grid>

        {/* Разделитель */}
        <Divider sx={{ my: 2 }} />

        {/* Нижняя строка */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            © {currentYear} StackOverStudy · Все права защищены
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link
              component="button"
              color="text.secondary"
              underline="hover"
              variant="body2"
              onClick={() => alert('Условия использования')}
            >
              Условия
            </Link>
            <Link
              component="button"
              color="text.secondary"
              underline="hover"
              variant="body2"
              onClick={() => alert('Конфиденциальность')}
            >
              Конфиденциальность
            </Link>
            <Link
              component="button"
              color="text.secondary"
              underline="hover"
              variant="body2"
              onClick={() => alert('Файлы cookie')}
            >
              Файлы cookie
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;