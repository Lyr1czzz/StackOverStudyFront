
import {
  Box,
  Typography,
  Link as MuiLink,
  Divider,
  Stack,
  IconButton,
  useTheme,
  Tooltip,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom'; // useNavigate здесь не нужен

import HomeIcon from '@mui/icons-material/Home';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const theme = useTheme();

  const navLinkStyles = {
    display: 'flex',
    alignItems: 'center',
    py: 0.5,
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
        mt: 'auto',
        pt: { xs: 3, sm: 4 },
        pb: { xs: 2, sm: 3 },
        backgroundColor: 'background.paper',
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box
        sx={{
          maxWidth: 'lg',
          mx: 'auto',
          px: { xs: 2, sm: 3 },
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            gap: { xs: 3, md: 4 },
            mb: { xs: 3, sm: 4 },
          }}
        >
          <Box sx={{ flex: '1 1 200px', minWidth: '180px' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom component="div">
              StackOverStudy
            </Typography>
            <Stack spacing={0.5} component="nav">
              <MuiLink component={RouterLink} to="/" sx={navLinkStyles}>
                <HomeIcon fontSize="small" sx={{ mr: 1 }} />
                Главная
              </MuiLink>
              <MuiLink component={RouterLink} to="/?sort=newest&page=1" sx={navLinkStyles}> {/* Добавил page=1 */}
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

          <Box sx={{ flex: '1 1 200px', minWidth: '180px' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom component="div">
              Ресурсы
            </Typography>
            <Stack spacing={0.5}>
              <MuiLink component={RouterLink} to="/about" sx={navLinkStyles}>
                О проекте
              </MuiLink>
              {/* ИСПРАВЛЕНИЕ: Используем RouterLink для навигации */}
              <MuiLink component={RouterLink} to="/terms" sx={navLinkStyles}>
                Условия использования
              </MuiLink>
              <MuiLink component={RouterLink} to="/privacy" sx={navLinkStyles}>
                Политика конфиденциальности
              </MuiLink>
            </Stack>
          </Box>

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
              <Tooltip title="LinkedIn">
                <IconButton component="a" href="https://linkedin.com/in/YOUR_PROFILE" target="_blank" rel="noopener noreferrer" sx={socialLinkStyles} aria-label="LinkedIn">
                  <LinkedInIcon />
                </IconButton>
              </Tooltip>
            </Stack>
             <Typography variant="body2" color="text.secondary" sx={{mt: 2}}>
                Email: contact@stackoverstudy.dev
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: 'center', 
            gap: 2 
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {currentYear} StackOverStudy. Все права защищены.
          </Typography>
          <Stack direction="row" spacing={2} divider={<Divider orientation="vertical" flexItem />}>
            {/* ИСПРАВЛЕНИЕ: Используем RouterLink для навигации */}
            <MuiLink component={RouterLink} to="/terms" color="text.secondary" underline="hover" variant="caption">
              Условия
            </MuiLink>
            <MuiLink component={RouterLink} to="/privacy" color="text.secondary" underline="hover" variant="caption">
              Конфиденциальность
            </MuiLink>
            {/* <MuiLink component="button" color="text.secondary" underline="hover" variant="caption" onClick={() => alert('Файлы cookie')}> Файлы cookie </MuiLink> */}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;