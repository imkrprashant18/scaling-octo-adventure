"use client"
import { removeAccessToken } from '@/lib/cookie';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const HTTP_UNAUTHENTICATED = 401;
const HTTP_FORBIDDEN = 403;

function handleGlobalQueryError(error: unknown): void {
        const status = (error as { response?: { status?: number } })?.response?.status;

        if (status === HTTP_UNAUTHENTICATED || status === HTTP_FORBIDDEN) {
                removeAccessToken();
        }
}

export const queryClient = new QueryClient({
        defaultOptions: {
                queries: {
                        retry: false, staleTime: 1000 * 60,
                },

        },
        queryCache: new QueryCache({ onError: handleGlobalQueryError }),
        mutationCache: new MutationCache({ onError: handleGlobalQueryError }),

});

const TanstackProviedr = ({ children }: { children: React.ReactNode }) => {
        return (
                <QueryClientProvider client={queryClient} >
                        {children}
                </QueryClientProvider>
        )
}

export default TanstackProviedr