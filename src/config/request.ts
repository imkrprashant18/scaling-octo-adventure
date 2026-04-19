import axios, {
        AxiosError,
        InternalAxiosRequestConfig,
        AxiosResponse,
} from "axios";

import { LoginResponse } from "@/types/user";
import { getAccessToken, getRefreshToken, removeRefreshToken, removeUser, saveRefreshToken, saveAccessToken } from "@/lib/cookie";
import { handleApiError } from "./handleError";

// const baseURL = process.env.NEXT_PUBLIC_API_URL;

// if (!baseURL) {
//         throw new Error("Missing NEXT_PUBLIC_API_BASE_URL in environment variables");
// }

const API = axios.create({
        headers: {
                "Content-Type": "application/json",
        },
});

API.interceptors.request.use(
        (config: InternalAxiosRequestConfig & { requiresAuth?: boolean }) => {
                if (config.requiresAuth !== false) {
                        const token = getAccessToken()
                        if (token) {
                                config.headers.Authorization = `Bearer ${token}`;
                        }
                }
                return config;
        },
);

// Response Interceptor – Handles token refresh
API.interceptors.response.use(
        (response: AxiosResponse) => response,
        async (error: AxiosError) => {
                const originalRequest = error.config as InternalAxiosRequestConfig & {
                        _retry?: boolean;
                };

                if (error.response?.status === 401 && !originalRequest._retry) {
                        originalRequest._retry = true;
                        const refreshToken = getRefreshToken()
                        if (!refreshToken) {
                                removeUser();
                                return Promise.reject(error);
                        }
                        try {
                                const res = await axios.post<LoginResponse>(
                                        `/api/v1/auth/refresh`,
                                        { refresh_token: refreshToken },
                                );
                                const newToken = res.data?.accessToken;
                                const newRefreshToken = res.data?.refreshToken;
                                saveAccessToken(newToken);
                                saveRefreshToken(newRefreshToken);
                                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                                return API(originalRequest);
                        } catch (refreshError) {
                                removeUser();
                                removeRefreshToken()
                                return Promise.reject(refreshError);
                        }
                }

                handleApiError(error);
                return Promise.reject(error);
        }
);

export default API;