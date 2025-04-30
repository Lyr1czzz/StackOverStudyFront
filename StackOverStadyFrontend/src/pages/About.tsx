import { Container, Typography } from '@mui/material';

const About = () => {
    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                О нас
            </Typography>
            <Typography variant="body1" paragraph>
                Это демонстрационное приложение, созданное для изучения авторизации через Google и работы с JWT.
            </Typography>
            <Typography variant="body1" paragraph>
                Мы стремимся предоставить удобный и безопасный интерфейс для наших пользователей.
            </Typography>
        </Container>
    );
};

export default About;