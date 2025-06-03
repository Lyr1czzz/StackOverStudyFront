
import { Box, Typography, Link as ListItem, ListItemText, Divider, List } from '@mui/material';

const PrivacyPolicyPage = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
        Политика конфиденциальности StackOverStudy
      </Typography>
      <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 3 }}>
        Последнее обновление: [ДАТА ПОСЛЕДНЕГО ОБНОВЛЕНИЯ]
      </Typography>

      <Typography variant="body1" paragraph>
        Эта страница информирует вас о нашей политике в отношении сбора, использования и раскрытия личной информации, которую мы получаем от пользователей сайта StackOverStudy («Сервис»).
      </Typography>
      <Typography variant="body1" paragraph>
        Мы используем вашу личную информацию только для предоставления и улучшения Сервиса. Используя Сервис, вы соглашаетесь на сбор и использование информации в соответствии с этой политикой.
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, mb: 1.5, fontWeight: 'medium' }}>
        1. Сбор и использование информации
      </Typography>
      <Typography variant="body1" paragraph>
        При использовании нашего Сервиса мы можем попросить вас предоставить нам определенную личную информацию, которая может быть использована для связи или идентификации вас. Личная информация может включать, но не ограничивается:
      </Typography>
      <List dense sx={{pl: 2, mb: 1}}>
        <ListItem sx={{py:0}}><ListItemText primary="Адрес электронной почты (при аутентификации через Google)" /></ListItem>
        <ListItem sx={{py:0}}><ListItemText primary="Имя пользователя (предоставленное Google или выбранное вами)" /></ListItem>
        <ListItem sx={{py:0}}><ListItemText primary="URL изображения профиля (предоставленное Google)" /></ListItem>
      </List>
      <Typography variant="body1" paragraph>
        Мы также собираем информацию, которую ваш браузер отправляет всякий раз, когда вы посещаете наш Сервис («Данные журнала»). Эти Данные журнала могут включать такую информацию, как IP-адрес вашего компьютера, тип браузера, версия браузера, страницы нашего Сервиса, которые вы посещаете, время и дата вашего визита, время, проведенное на этих страницах, и другая статистика.
      </Typography>

      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, mb: 1.5, fontWeight: 'medium' }}>
        2. Файлы cookie
      </Typography>
      <Typography variant="body1" paragraph>
        Файлы cookie - это файлы с небольшим количеством данных, которые могут включать анонимный уникальный идентификатор. Файлы cookie отправляются в ваш браузер с веб-сайта и хранятся на жестком диске вашего компьютера.
      </Typography>
      <Typography variant="body1" paragraph>
        Мы используем сессионные файлы cookie (например, для аутентификации JWT в куках httpOnly) для работы нашего Сервиса. Вы можете настроить свой браузер так, чтобы он отказывался от всех файлов cookie или указывал, когда файл cookie отправляется. Однако, если вы не принимаете файлы cookie, вы не сможете использовать некоторые части нашего Сервиса.
      </Typography>
      {/* ... Добавь другие пункты: поставщики услуг, безопасность, ссылки на другие сайты, изменения в политике, контактная информация и т.д. ... */}

      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, mb: 1.5, fontWeight: 'medium' }}>
        3. Безопасность
      </Typography>
      <Typography variant="body1" paragraph>
        Безопасность вашей личной информации важна для нас, но помните, что ни один метод передачи через Интернет или метод электронного хранения не является на 100% безопасным. Хотя мы стремимся использовать коммерчески приемлемые средства для защиты вашей личной информации, мы не можем гарантировать ее абсолютную безопасность.
      </Typography>


      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, mb: 1.5, fontWeight: 'medium' }}>
        4. Свяжитесь с нами
      </Typography>
      <Typography variant="body1" paragraph>
        Если у вас есть какие-либо вопросы по поводу настоящей Политики конфиденциальности, пожалуйста, свяжитесь с нами по адресу: [Ваш контактный email].
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 4, fontStyle: 'italic' }}>
        Это примерный текст. Для полноценной Политики конфиденциальности рекомендуется проконсультироваться с юристом.
      </Typography>
    </Box>
  );
};

export default PrivacyPolicyPage;