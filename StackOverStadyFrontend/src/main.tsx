import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import { CssBaseline } from '@mui/material';
import 'react-quill/dist/quill.snow.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AppThemeProvider>
            <AuthProvider>
                <CssBaseline />
                <App />
            </AuthProvider>
        </AppThemeProvider>
    </React.StrictMode>
);