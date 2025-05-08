import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import { CssBaseline } from '@mui/material';
import 'react-quill/dist/quill.snow.css';

// Настройка Highlight.js
import hljs from 'highlight.js/lib/core'; // Импортируем ядро
// Импортируем необходимые языки
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java_ from 'highlight.js/lib/languages/java'; // java импортируется как java_
import csharp from 'highlight.js/lib/languages/csharp';
import cpp from 'highlight.js/lib/languages/cpp';
import php from 'highlight.js/lib/languages/php';
import ruby from 'highlight.js/lib/languages/ruby';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import xml from 'highlight.js/lib/languages/xml'; // Для HTML, XML
import css from 'highlight.js/lib/languages/css';

// Выберите и импортируйте одну тему для подсветки
// Популярные: github, atom-one-dark, atom-one-light, monokai-sublime, vs2015
// Все темы тут: node_modules/highlight.js/styles/
import 'highlight.js/styles/github.css'; // Например, тема GitHub
// import 'highlight.js/styles/atom-one-dark.css';

// Регистрация импортированных языков
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('java', java_);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('php', php);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('xml', xml); // для html
hljs.registerLanguage('css', css);

// Опционально: Настроить Highlight.js по умолчанию
 hljs.configure({
   languages: ['javascript', 'python', 'xml', 'css'], // Языки для автоопределения, если не указан класс
  ignoreUnescapedHTML: true, // Для лучшей работы с HTML внутри блоков кода
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ThemeProvider>
            <AuthProvider>
                <CssBaseline />
                <App />
            </AuthProvider>
        </ThemeProvider>
    </React.StrictMode>
);