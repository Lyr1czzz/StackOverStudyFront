import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Profile from './pages/Profile';
import About from './pages/About';
import HomePage from './pages/HomePage';
import AskQuestionPage from './pages/AskQuestionPage';
import QuestionDetailPage from './pages/QuestionDetailPage';
import { Box, CssBaseline } from '@mui/material';
import Footer from './components/Footer';
import TagsPage from './pages/TagsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <CssBaseline />
        
        {/* Хедер */}
        <Header />

        {/* Основной контейнер с ограничением ширины */}
        <Box
          component="main"
          sx={{
            mt: '64px', // высота хедера
            maxWidth: '1200px',
            mx: 'auto',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
            width: '100%',
          }}
        >
          {/* Сайдбар */}
          <Box
            sx={{
              width: { xs: '100%', md: '220px' },
              flexShrink: 0,
              bgcolor: 'background.paper',
              borderRadius: 0,
              border: '1px solid',
              borderColor: 'divider',
              p: 2,
            }}
          >
            <Sidebar />
          </Box>

          {/* Контент (вопросы, профиль и т.д.) */}
          <Box
            sx={{
              flexGrow: 1,
              bgcolor: 'background.default',
              borderRadius: 1,
              p: 2,
              minWidth: 0,
            }}
          >
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/about" element={<About />} />
              <Route path="/ask" element={<AskQuestionPage />} />
              <Route path="/questions/:questionId" element={<QuestionDetailPage />} />
              <Route path="/tags" element={<TagsPage />} />
            </Routes>
          </Box>
        </Box>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;