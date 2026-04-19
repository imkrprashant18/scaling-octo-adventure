"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validationSchema";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Eye, EyeOff, Loader } from "lucide-react";
import { useState } from "react";

import Link from "next/link";
import Typography from "../common/Typography";
import DefaultContainer from "../common/DefaultContainer";


interface LoginFormProps {
        isLoading?: boolean;
        onSubmit?: (data: LoginInput) => void;
}

const LoginForm = ({ isLoading = false, onSubmit }: LoginFormProps) => {
        const {
                register,
                handleSubmit,
                formState: { errors },
        } = useForm<LoginInput>({
                resolver: zodResolver(loginSchema),
                defaultValues: {
                        email: "",
                        password: "",
                },
        });

        const [showPassword, setShowPassword] = useState(false);

        const handleFormSubmit = (data: LoginInput) => {
                if (onSubmit) {
                        onSubmit(data);
                } else {
                        console.log(data);
                }
        };

        return (
                <DefaultContainer
                        direction="col"
                        className="w-full max-w-md bg-card rounded-2xl shadow-lg px-8 py-10 mt-5 border border-border"
                >
                        {/* Heading */}
                        <DefaultContainer direction="col" className="text-center mb-8">
                                <Typography variant="h2" color="primary" className="mb-2">
                                        Welcome Back
                                </Typography>
                                <Typography color="muted" size="sm">
                                        Sign In to Your Account
                                </Typography>
                        </DefaultContainer>

                        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">

                                {/* Email */}
                                <DefaultContainer direction="col" className="relative">
                                        <div className="relative">
                                                <Input
                                                        id="email"
                                                        {...register("email")}
                                                        placeholder=" "
                                                        disabled={isLoading}
                                                        className="peer w-full h-12 px-4 rounded-lg bg-card border-2 border-border
              text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                />

                                                <label
                                                        htmlFor="email"
                                                        className="absolute left-4 -top-3 bg-card px-2 text-sm text-muted-foreground
              peer-placeholder-shown:top-3.5
              peer-placeholder-shown:text-base
              peer-focus:-top-3
              peer-focus:text-sm
              peer-focus:text-primary
              transition-all cursor-text font-medium"
                                                >
                                                        Email Address
                                                </label>
                                        </div>

                                        {errors.email && (
                                                <Typography color="danger" size="xs" className="mt-2">
                                                        {errors.email.message}
                                                </Typography>
                                        )}
                                </DefaultContainer>

                                {/* Password */}
                                <DefaultContainer direction="col" className="relative">
                                        <div className="relative">
                                                <Input
                                                        id="password"
                                                        type={showPassword ? "text" : "password"}
                                                        {...register("password")}
                                                        placeholder=" "
                                                        disabled={isLoading}
                                                        className="peer w-full h-12 px-4 pr-12 rounded-lg bg-card border-2 border-border
              text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                />

                                                <label
                                                        htmlFor="password"
                                                        className="absolute left-4 -top-3 bg-card px-2 text-sm text-muted-foreground
              peer-placeholder-shown:top-3.5
              peer-placeholder-shown:text-base
              peer-focus:-top-3
              peer-focus:text-sm
              peer-focus:text-primary
              transition-all cursor-text font-medium"
                                                >
                                                        Password
                                                </label>

                                                {/* Eye Toggle */}
                                                <button
                                                        type="button"
                                                        onClick={() => setShowPassword((prev) => !prev)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition"
                                                >
                                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                        </div>

                                        {errors.password && (
                                                <Typography color="danger" size="xs" className="mt-2">
                                                        {errors.password.message}
                                                </Typography>
                                        )}

                                        <DefaultContainer justify="end">
                                                <Link
                                                        href="/forget-password"
                                                        className="text-sm text-primary mt-3 hover:text-primary/80 underline font-semibold transition"
                                                >
                                                        Forgot password?
                                                </Link>
                                        </DefaultContainer>
                                </DefaultContainer>

                                {/* Submit */}
                                <Button
                                        type="submit"
                                        disabled={isLoading}
                                        size="lg"
                                        className="w-full font-semibold"
                                >
                                        {isLoading ? (
                                                <div className="flex items-center gap-2">
                                                        <Loader size={18} className="animate-spin" />
                                                        Signing in...
                                                </div>
                                        ) : (
                                                "Sign In"
                                        )}
                                </Button>

                                {/* Signup */}
                                <DefaultContainer justify="center" gap="2" className="flex-wrap">
                                        <Typography size="sm" color="muted">
                                                Don't have an account?
                                        </Typography>
                                        <Link
                                                href="/register"
                                                className="text-sm text-primary hover:text-primary/80 underline font-semibold transition"
                                        >
                                                Sign Up
                                        </Link>
                                </DefaultContainer>

                        </form>
                </DefaultContainer>
        );
};

export default LoginForm;