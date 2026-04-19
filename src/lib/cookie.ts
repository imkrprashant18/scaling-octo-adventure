import Cookies from "js-cookie";
import { User } from "@prisma/client";


const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user_data";

export const saveAccessToken = (token: string): void => {
        Cookies.set(ACCESS_TOKEN_KEY, token, {
                expires: 7, // days
                secure: true,
                sameSite: "strict",
        });
};

export const getAccessToken = (): string | undefined => {
        return Cookies.get(ACCESS_TOKEN_KEY);
};

export const removeAccessToken = (): void => {
        Cookies.remove(ACCESS_TOKEN_KEY);
};

export const saveRefreshToken = (token: string): void => {
        Cookies.set(REFRESH_TOKEN_KEY, token, {
                expires: 30,
                secure: true,
                sameSite: "strict",
        });
};

export const getRefreshToken = (): string | undefined => {
        return Cookies.get(REFRESH_TOKEN_KEY);
};

export const removeRefreshToken = (): void => {
        Cookies.remove(REFRESH_TOKEN_KEY);
};


export const saveUser = (user: User): void => {
        Cookies.set(USER_KEY, JSON.stringify(user), {
                expires: 7,
                secure: true,
                sameSite: "strict",
        });
};

export const getUser = (): User | null => {
        const data = Cookies.get(USER_KEY);
        return data ? JSON.parse(data) : null;
};

export const removeUser = (): void => {
        Cookies.remove(USER_KEY);
};

export const clearAuthStorage = (): void => {
        removeAccessToken();
        removeRefreshToken();
        removeUser();
};