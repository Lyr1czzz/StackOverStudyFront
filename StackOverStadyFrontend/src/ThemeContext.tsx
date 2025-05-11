// src/ThemeContext.tsx
import React, { createContext, useState, useEffect, useMemo, useContext } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider, PaletteMode, responsiveFontSizes, Theme } from '@mui/material';

interface ThemeContextType {
    mode: PaletteMode;
    toggleTheme: () => void;
    theme: Theme; // Добавим саму тему в контекст для удобства доступа
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useAppTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useAppTheme must be used within an AppThemeProvider');
    }
    return context;
};

interface AppThemeProviderProps {
    children: React.ReactNode;
}

export const AppThemeProvider: React.FC<AppThemeProviderProps> = ({ children }) => {
    const [mode, setMode] = useState<PaletteMode>(() => {
        try {
            const storedMode = localStorage.getItem('themeMode') as PaletteMode | null;
            return storedMode && (storedMode === 'light' || storedMode === 'dark') ? storedMode : 'light';
        } catch (error) {
            console.error("Error reading themeMode from localStorage", error);
            return 'light';
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('themeMode', mode);
            document.body.setAttribute('data-theme', mode);
        } catch (error) {
            console.error("Error saving themeMode to localStorage", error);
        }
    }, [mode]);

    const toggleTheme = () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    };

    let muiTheme = useMemo(() => {
        let newTheme = createTheme({
            palette: {
                mode,
                primary: {
                    main: mode === 'light' ? '#1976d2' : '#90caf9', // Синий для светлой, голубой для темной
                },
                secondary: {
                    main: mode === 'light' ? '#dc004e' : '#f48fb1', // Розовый
                },
                background: {
                    default: mode === 'light' ? '#f4f6f8' : '#121212',
                    paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
                },
                text: {
                    primary: mode === 'light' ? 'rgba(0, 0, 0, 0.87)' : '#ffffff',
                    secondary: mode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)',
                    disabled: mode === 'light' ? 'rgba(0, 0, 0, 0.38)' : 'rgba(255, 255, 255, 0.5)',
                },
                action: {
                    active: mode === 'light' ? 'rgba(0, 0, 0, 0.54)' : 'rgba(255, 255, 255, 0.7)',
                    hover: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
                    selected: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.16)',
                    disabledBackground: mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
                    disabled: mode === 'light' ? 'rgba(0, 0, 0, 0.26)' : 'rgba(255, 255, 255, 0.3)',
                    focus: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                },
                divider: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                success: { // Добавим цвета для success
                    main: mode === 'light' ? '#2e7d32' : '#66bb6a',
                    light: mode === 'light' ? '#d7ffd9' : 'rgba(102,187,106,0.2)',
                    dark: mode === 'light' ? '#1b5e20' : '#a5d6a7',
                    contrastText: mode === 'light' ? '#fff' : '#000',
                },
            },
            typography: {
                fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                h4: { fontWeight: 600, fontSize: '2.125rem' },
                h5: { fontWeight: 600, fontSize: '1.5rem' },
                h6: { fontWeight: 600, fontSize: '1.25rem' },
                subtitle1: { fontWeight: 500 },
                button: { textTransform: 'none', fontWeight: 500 },
            },
            shape: {
                borderRadius: 8,
            },
            components: {
                MuiAppBar: {
                    defaultProps: {
                        color: 'inherit', // Наследует цвет от родителя, обычно background.paper
                        elevation: 0, // Убираем тень по умолчанию
                    },
                    styleOverrides: {
                        root: ({ theme: appTheme }) => ({
                             borderBottom: `1px solid ${appTheme.palette.divider}`,
                             // Можно добавить легкую тень, если нужно, но elevation=0 ее убирает
                             // boxShadow: appTheme.palette.mode === 'light' ? `0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)` : `0 1px 2px 0 rgba(0, 0, 0, 0.2), 0 1px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px 0 rgba(0, 0, 0, 0.15)`,
                        }),
                    },
                },
                MuiPaper: {
                    defaultProps: {
                        elevation: 0, // По умолчанию без тени
                    },
                    styleOverrides: {
                        root: ({ownerState, theme : paperTheme}) => ({
                            // Если elevation не установлен явно (т.е. равен 0), добавляем рамку
                            ...(!ownerState.elevation && ownerState.variant !== 'outlined' && { // Не добавлять рамку, если уже outlined
                                border: `1px solid ${paperTheme.palette.divider}`,
                            }),
                        }),
                    }
                },
                MuiButton: {
                    defaultProps: {
                        disableElevation: true, // Убираем тень у всех кнопок
                    },
                },
                MuiCard: { // Для консистентности, если будешь использовать Card
                    defaultProps: {
                        elevation: 0,
                    },
                     styleOverrides: {
                        root: ({theme: cardTheme}) => ({
                            border: `1px solid ${cardTheme.palette.divider}`,
                        })
                    }
                },
                MuiListItemButton: {
                    styleOverrides: {
                        root: ({theme: btnTheme}) => ({
                            borderRadius: btnTheme.shape.borderRadius, // Скругление для кнопок списка
                            '&.Mui-selected': {
                                backgroundColor: btnTheme.palette.action.selected,
                                 '&:hover': {
                                    backgroundColor: btnTheme.palette.action.hover, // Для консистентности
                                },
                                '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                                    color: btnTheme.palette.primary.main,
                                    fontWeight: 600,
                                }
                            }
                        })
                    }
                },
                MuiTextField: { // Глобальные стили для TextField
                    styleOverrides: {
                        root: ({ theme: tfTheme }) => ({
                            '& .MuiOutlinedInput-root': {
                                // borderRadius: tfTheme.shape.borderRadius * 2.5, // Можно оставить, если нравится более круглый
                                backgroundColor: tfTheme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', // Фон для поля ввода
                                '& fieldset': {
                                    borderColor: 'transparent', // Убираем рамку по умолчанию
                                },
                                '&:hover fieldset': {
                                    borderColor: tfTheme.palette.action.disabled, // Рамка при наведении
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: tfTheme.palette.primary.main, // Рамка при фокусе
                                    borderWidth: '1px',
                                },
                            },
                        }),
                    },
                },
                MuiTooltip: { // Кастомизация Tooltip для лучшего вида
                    styleOverrides: {
                        tooltip: ({theme: tipTheme}) => ({
                            backgroundColor: tipTheme.palette.mode === 'dark' ? tipTheme.palette.grey[700] : tipTheme.palette.grey[800],
                            color: '#fff',
                            fontSize: '0.75rem',
                            borderRadius: tipTheme.shape.borderRadius / 2,
                        }),
                        arrow: ({theme: tipTheme}) => ({
                            color: tipTheme.palette.mode === 'dark' ? tipTheme.palette.grey[700] : tipTheme.palette.grey[800],
                        }),
                    },
                },
                MuiChip: {
                    styleOverrides: {
                        root: ({theme: chipTheme}) => ({
                            backgroundColor: chipTheme.palette.action.hover,
                            fontWeight: 400,
                        }),
                        clickable: ({theme: chipTheme}) => ({
                            '&:hover': {
                                backgroundColor: chipTheme.palette.action.selected,
                            }
                        })
                    }
                },
            },
        });
        return responsiveFontSizes(newTheme);
    }, [mode]);

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme, theme: muiTheme }}>
            <MuiThemeProvider theme={muiTheme}>
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};