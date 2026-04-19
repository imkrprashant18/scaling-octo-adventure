import { AxiosError } from "axios";
import { toast } from "sonner";

interface ErrorData {
        errors?: Record<string, string[]>;
        message?: string;
        Message?: string;
        title?: string;
}

export const handleApiError = (
        error: unknown,
        fallbackMessage = "An error occurred",
): void => {
        const axiosError = error as AxiosError<ErrorData>;
        const { message: rawErrorMessage, code, config, response } = axiosError;

        if (
                rawErrorMessage?.includes("canceled") ||
                rawErrorMessage?.includes("aborted") ||
                code === "ERR_CANCELED"
        ) {
                return;
        }

        if (config?.method?.toUpperCase() === "GET") return;

        if (!response) {
                // Alert.alert("Error", rawErrorMessage || fallbackMessage);
                toast.error(rawErrorMessage || fallbackMessage);

                return;
        }

        const { status, data } = response;

        const backendMessage =
                data?.message || data?.Message || data?.title || rawErrorMessage;

        if (status === 400 && data?.errors) {
                const firstError = Object.values(data.errors)[0]?.[0];
                toast.error(firstError || backendMessage || fallbackMessage);
                // Alert.alert("Error", firstError || backendMessage || fallbackMessage);
                return;
        }
        toast.error(backendMessage || fallbackMessage);
        // Alert.alert("Error", backendMessage || fallbackMessage);
};