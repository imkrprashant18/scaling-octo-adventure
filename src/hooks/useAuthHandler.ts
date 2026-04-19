"use client";

import { USERAUTHAPI } from "@/config/auth";
import { saveAccessToken, saveRefreshToken } from "@/lib/cookie";
import { RegisterInput } from "@/types/user";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

enum UserRole {
        ADMIN = "ADMIN",
        DOCTOR = "DOCTOR",
        PATIENT = "PATIENT",
}

const ROLE_REDIRECT_MAP: Record<UserRole, string> = {
        [UserRole.ADMIN]: "/admin/dashboard",
        [UserRole.DOCTOR]: "/doctor/dashboard",
        [UserRole.PATIENT]: "/patient/dashboard",
};

const DEFAULT_REDIRECT = "/confirm";


const getRedirectPath = (role?: string) => {
        return ROLE_REDIRECT_MAP[role as UserRole] ?? DEFAULT_REDIRECT;
};


const useLoginHandler = () => {
        const router = useRouter();
        const { mutate: login, isPending } = USERAUTHAPI.useUserLogin();

        const handleLogin = (data: RegisterInput) => {
                login(data, {
                        onSuccess: (response) => {
                                const { accessToken, refreshToken, user, message } = response || {};

                                if (!accessToken || !user) {
                                        toast.error("Invalid login response");
                                        return;
                                }
                                saveAccessToken(accessToken);
                                if (refreshToken) saveRefreshToken(refreshToken);
                                toast.success(message ?? "Login successful");
                                const redirectPath = getRedirectPath(user.role);
                                router.push(redirectPath);
                        },

                        onError: (error) => {
                                toast.error(error?.message || "Login failed");
                        },
                });
        };

        return { handleLogin, isPending };
};

export { useLoginHandler };