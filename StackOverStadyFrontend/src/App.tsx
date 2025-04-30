import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Header from './components/Header';
import Profile from './pages/Profile';
import About from './pages/About';
import HomePage from './pages/HomePage';
import AskQuestionPage from './pages/AskQuestionPage';
import QuestionDetailPage from './pages/QuestionDetailPage';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Header />
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/:userId" element={<Profile />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/ask" element={<AskQuestionPage />} />
                    <Route path="/questions/:questionId" element={<QuestionDetailPage />} /> {/* Страница вопроса */}
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;