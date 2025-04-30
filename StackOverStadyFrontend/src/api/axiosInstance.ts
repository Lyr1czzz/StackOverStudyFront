// src/api/axiosInstance.ts
import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'https://localhost:7295',
    withCredentials: true
});

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('refreshToken='))
                    ?.split('=')[1];

                const accessToken = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('jwt='))
                    ?.split('=')[1];

                const response = await axios.post('https://localhost:7295/Auth/refresh-token', {
                    accessToken,
                    refreshToken
                });

                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

                document.cookie = `jwt=${newAccessToken}; path=/; HttpOnly; Secure; SameSite=None`;
                document.cookie = `refreshToken=${newRefreshToken}; path=/; HttpOnly; Secure; SameSite=None`;

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                console.error('Ошибка обновления токена:', refreshError);
                window.location.href = '/';
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;