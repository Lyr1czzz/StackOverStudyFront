import React, { createContext, useState } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    mode: ThemeMode;
    toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [mode, setMode] = useState<ThemeMode>('light');

    const toggleTheme = () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    };

    const theme = createTheme({
        palette: {
            mode,
            ...(mode === 'light'
                ? {
                      background: {
                          default: '#FFFFFF', // Белый фон для светлой темы
                      },
                      text: {
                          primary: '#000000', // Черный текст для светлой темы
                      },
                  }
                : {
                      background: {
                          default: '#121212', // Темный фон для темной темы
                      },
                      text: {
                          primary: '#FFFFFF', // Белый текст для темной темы
                      },
                  }),
        },
        components: {
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: mode === 'light' ? '#FFFFFF' : '#121212', // Цвет фона хедера
                        color: mode === 'light' ? '#000000' : '#FFFFFF', // Цвет текста хедера
                        borderBottom: `1px solid ${mode === 'light' ? '#E0E0E0' : '#333333'}`, // Обводка хедера
                        boxShadow: 'none', // Убираем тень
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                                borderColor: mode === 'light' ? '#E0E0E0' : '#444444', // Обводка поисковой строки
                            },
                            '&:hover fieldset': {
                                borderColor: mode === 'light' ? '#C0C0C0' : '#666666', // Обводка при наведении
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: mode === 'light' ? '#C0C0C0' : '#666666', // Обводка при фокусе
                            },
                        },
                    },
                },
            },
        },
    });

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme }}>
            <MuiThemeProvider theme={theme}>
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};