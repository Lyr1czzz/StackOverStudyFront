import { Container, Typography, Box, Paper, List, ListItem, ListItemIcon, ListItemText, Link as Divider, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom'; // Для внутренних ссылок
import SchoolIcon from '@mui/icons-material/School'; // Иконка для образования
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer'; // Иконка для вопросов и ответов
import GroupIcon from '@mui/icons-material/Group'; // Иконка для сообщества
import SecurityIcon from '@mui/icons-material/Security'; // Иконка для безопасности
import BuildIcon from '@mui/icons-material/Build'; // Иконка для инструментов разработки

const About = () => {
    return (
        <Container>
            <Paper>
                <Typography variant="h3" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
                    О проекте StackOverStudy
                </Typography>

                <Typography variant="h6" component="h2" paragraph sx={{ color: 'text.secondary', textAlign: 'center', fontStyle: 'italic', maxWidth: '700px', mx: 'auto' }}>
                    Ваш надежный помощник в мире лабораторных работ и студенческих проектов.
                </Typography>
                
                <Divider sx={{ my: 4 }} />

                <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2, fontWeight: 'medium' }}>
                    Наша миссия
                </Typography>
                <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
                    StackOverStudy создан с целью предоставить студентам русскоязычного сегмента удобную и эффективную платформу для обмена знаниями, решения учебных задач и взаимопомощи в выполнении лабораторных работ. Мы стремимся создать дружелюбное сообщество, где каждый может задать вопрос, поделиться своим опытом и найти поддержку от единомышленников. Наша платформа может быть особенно полезна для локального использования в учебных заведениях, интегрируясь с существующими сервисами, такими как Google Workspace, для упрощения доступа и совместной работы.
                </Typography>

                <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2, fontWeight: 'medium' }}>
                    Ключевые возможности
                </Typography>
                <List sx={{ mb: 2 }}>
                    <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{minWidth: 40}}>
                            <QuestionAnswerIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Публикация вопросов и ответов" secondary="Делитесь своими задачами и находите готовые решения от других студентов." />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{minWidth: 40}}>
                            <GroupIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Система комментариев" secondary="Обсуждайте детали, уточняйте информацию и общайтесь под вопросами и ответами." />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{minWidth: 40}}>
                            <SchoolIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Тегирование и фильтрация" secondary="Удобная навигация и поиск по темам благодаря системе тегов и гибким фильтрам." />
                    </ListItem>
                     <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{minWidth: 40}}>
                            <SecurityIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Оценка контента и система репутации" secondary="Голосуйте за полезные вопросы и ответы, повышая их видимость и формируя рейтинг пользователей." />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{minWidth: 40}}>
                            <BuildIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Модерация контента" secondary="Поддержание порядка и актуальности информации благодаря ролям модераторов." />
                    </ListItem>
                     <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{minWidth: 40}}>
                            <SchoolIcon color="primary" /> {/* Можно заменить на другую иконку */}
                        </ListItemIcon>
                        <ListItemText primary="Система достижений" secondary="Получайте награды за активность и вклад в развитие сообщества." />
                    </ListItem>
                </List>

                <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2, fontWeight: 'medium' }}>
                    Технологический стек
                </Typography>
                <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
                    Проект StackOverStudy реализован с использованием современных и надежных технологий. Серверная часть построена на языке C# с использованием платформы ASP.NET Core, что обеспечивает высокую производительность и масштабируемость. В качестве системы управления базами данных выбрана PostgreSQL, известная своей стабильностью и поддержкой сложных запросов.
                </Typography>
                <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
                    Пользовательский интерфейс разработан на TypeScript с применением популярной библиотеки React и компонентов Material-UI, что позволяет создавать адаптивные, интерактивные и эстетически приятные страницы. Аутентификация пользователей реализована через сервис Google, обеспечивая удобный и безопасный вход в систему.
                </Typography>

                <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2, fontWeight: 'medium' }}>
                    Присоединяйтесь к нам!
                </Typography>
                <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
                    Мы приглашаем всех студентов присоединиться к нашему сообществу! Задавайте вопросы, делитесь знаниями, помогайте другим и получайте помощь сами. Вместе мы сможем сделать процесс обучения более увлекательным и продуктивным.
                </Typography>
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Button component={RouterLink} to="/ask" variant="contained" size="large" sx={{ mr: 2 }}>
                        Задать вопрос
                    </Button>
                    <Button component={RouterLink} to="/" variant="outlined" size="large">
                        Смотреть вопросы
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default About;