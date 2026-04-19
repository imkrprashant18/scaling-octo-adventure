"use client";

import LoginForm from '@/components/auth/login-form'
import { useLoginHandler } from '@/hooks/useAuthHandler';

const HomePage = () => {
  const { handleLogin, isPending } = useLoginHandler()
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background">
      <LoginForm onSubmit={handleLogin} isLoading={isPending} />
    </div>
  )
}

export default HomePage