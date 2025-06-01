import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Profile from './pages/Profile';
import About from './pages/About';
import HomePage from './pages/HomePage';
import AskQuestionPage from './pages/AskQuestionPage';
import QuestionDetailPage from './pages/QuestionDetailPage';
import { Box, CssBaseline, Container, Drawer, useTheme, Paper, GlobalStyles, Theme as MuiTheme } from '@mui/material';
import Footer from './components/Footer';
import TagsPage from './pages/TagsPage';
import { AppThemeProvider } from './ThemeContext'; // Импортируем useAppTheme, если он нужен здесь

const drawerWidth = 240;

function AppContent() {
  const theme = useTheme(); // Получаем текущую тему MUI, предоставленную MuiThemeProvider
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  React.useEffect(() => {
    if (mobileOpen) {
      setMobileOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const getToolbarHeightValue = (currentTheme: MuiTheme): number => {
    const toolbarConfig = currentTheme.mixins.toolbar;
    let height = 64;
    const currentBreakpoint = [...currentTheme.breakpoints.keys].reverse().find(key => currentTheme.breakpoints.up(key)) || 'xs';

    if (toolbarConfig && typeof toolbarConfig.minHeight === 'number') {
        height = toolbarConfig.minHeight;
    } else if (toolbarConfig && typeof toolbarConfig.minHeight === 'object' && toolbarConfig.minHeight !== null) {
        // @ts-ignore
        const heightForCurrentBreakpoint = toolbarConfig.minHeight[currentBreakpoint];
        if(typeof heightForCurrentBreakpoint === 'number') height = heightForCurrentBreakpoint;
        // @ts-ignore
        else if(typeof toolbarConfig.minHeight['xs'] === 'number' && currentTheme.breakpoints.down('sm')) height = toolbarConfig.minHeight['xs']; // fallback для xs
        // @ts-ignore
        else if(typeof toolbarConfig.minHeight['sm'] === 'number') height = toolbarConfig.minHeight['sm']; // fallback для sm
    }
     // Если toolbarConfig.minHeight это строка '56px' или '64px'
    else if (typeof toolbarConfig.minHeight === 'string') {
        height = parseInt(toolbarConfig.minHeight, 10);
    }
    // Если это объект вида {'@media (min-width:0px)': {minHeight: '56px'}}
    else if (toolbarConfig && (toolbarConfig as any)['@media (min-width:600px)']) { // Пример для sm и выше
         height = parseInt((toolbarConfig as any)['@media (min-width:600px)'].minHeight, 10);
         if(currentTheme.breakpoints.down('sm')){ // Для xs
            height = parseInt((toolbarConfig as any)['@media (min-width:0px)'].minHeight, 10);
         }
    }

    return isNaN(height) ? (currentTheme.breakpoints.up('sm') ? 64 : 56) : height;
  };

  const toolbarHeight = getToolbarHeightValue(theme);
  const mainContentTopMargin = theme.spacing(3);
  const stickySidebarTopOffset = `calc(${toolbarHeight}px + ${mainContentTopMargin})`;
  const mainContainerBottomPadding = theme.spacing(4);
  const stickySidebarMaxHeight = `calc(100vh - ${toolbarHeight}px - ${mainContentTopMargin} - ${mainContainerBottomPadding} - ${theme.spacing(2)})`; // Доп. отступ для гармонии

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <GlobalStyles styles={{ 'html, body, #root': { height: '100%' }, body: { backgroundColor: theme.palette.background.default } }} />
      
      <Header onDrawerToggle={handleDrawerToggle} />

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth, 
            pt: `${toolbarHeight}px`,
            backgroundColor: 'background.paper', // Явно задаем фон
            borderRight: 0, // Убираем границу, если фон paper
          },
        }}
      >
        <Sidebar onDrawerToggle={handleDrawerToggle} />
      </Drawer>

      <Container
          maxWidth="lg"
          component="main"
          sx={{
            pt: `calc(${toolbarHeight}px + ${mainContentTopMargin})`,
            pb: mainContainerBottomPadding,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 2, md: 3 },
            flexGrow: 1,
          }}
      >
        <Box
          component="aside"
          sx={{
            width: { md: drawerWidth },
            flexShrink: 0,
            display: { xs: 'none', md: 'block' },
            position: 'sticky',
            top: stickySidebarTopOffset,
            alignSelf: 'flex-start',
            maxHeight: stickySidebarMaxHeight,
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: '6px', height: '6px' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: theme.palette.action.disabled, borderRadius: '3px' },
            '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
          }}
        >
          <Paper sx={{ height: '100%', overflow: 'hidden', p: 0.5 /* Отступ для Sidebar внутри Paper */ }}> {/* elevation={0} уже по дефолту */}
            <Sidebar />
          </Paper>
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Paper sx={{p: {xs: 1.5, sm: 2, md: 3}, height: '100%' }}> {/* elevation={0} уже по дефолту */}
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/about" element={<About />} />
              <Route path="/ask" element={<AskQuestionPage />} />
              <Route path="/questions/:questionId" element={<QuestionDetailPage />} />
              <Route path="/tags" element={<TagsPage />} />
            </Routes>
          </Paper>
        </Box>
      </Container>
      <Footer />
    </Box>
  );
}

function App() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </AppThemeProvider>
  );
}

export default App;