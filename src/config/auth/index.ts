
import type { GetUserResponse, LoginResponse, RegisterInput, VerifyOtpInput } from "@/types/user.d";
import { useMutation, useQuery } from "@tanstack/react-query";
import API from "../request";
import API_ENDPOINTS from "../end-pointes";

const userKeys = {
        all: ["user"] as const,
        login: () => [...userKeys.all, "login"] as const,
        register: () => [...userKeys.all, "register"] as const,
        profile: () => [...userKeys.all, "profile"] as const,
        logout: () => [...userKeys.all, "logout"] as const,
} as const;

const authAPI = {
        register: async (credentials: RegisterInput) => {
                const { data } = await API.post<LoginResponse>(
                        API_ENDPOINTS.AUTH.REGISTER,
                        credentials,
                        { requiresAuth: false },
                );
                return data;
        },
        login: async (credentials: RegisterInput) => {
                const { data } = await API.post<LoginResponse>(
                        API_ENDPOINTS.AUTH.LOGIN,
                        credentials,
                        { requiresAuth: false },
                );
                return data;
        },
        VerifyOtp: async (credentials: VerifyOtpInput) => {
                const { data } = await API.post<LoginResponse>(
                        API_ENDPOINTS.AUTH.VERIFYOTP,
                        credentials,
                        { requiresAuth: false },
                );
                return data;
        },
        profile: async () => {
                const { data } = await API.get<GetUserResponse>(API_ENDPOINTS.AUTH.GETUSER, {
                        requiresAuth: true,
                });
                return data;
        },
} as const;



const useUserRegister = () => {
        return useMutation({
                mutationFn: authAPI.register,
                meta: { errorMessage: "Registration failed" },
        });
}

const useUserLogin = () => {
        return useMutation({
                mutationFn: authAPI.login,
                meta: { errorMessage: "Login failed" },
        });
};

// const useUserLogout = () => {
//         return useMutation({
//                 mutationFn: authAPI.logout,
//                 meta: { errorMessage: "Logout failed" },
//         });
// };




export const USERAUTHAPI = {
        useUserRegister,
        useUserLogin,
} as const;