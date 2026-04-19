"use client";

import LoginForm from '@/components/auth/login-form'

const HomePage = () => {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background">
      <LoginForm />
    </div>
  )
}

export default HomePage