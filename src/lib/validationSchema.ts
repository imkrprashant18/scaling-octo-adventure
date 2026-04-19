import { z } from "zod";

export const createAvailabilitySchema = z.object({
        startTime: z.string().datetime(),
        endTime: z.string().datetime(),
});


const passwordSchema = z
        .string()
        .min(6, { message: "Password must be at least 8 characters." })
        .max(20, { message: "Password must be at most 128 characters." })
        .refine((p) => !/\s/.test(p), {
                message: "Password must not contain spaces.",
        })
        .refine((p) => /[a-z]/.test(p), {
                message: "Password must contain a lowercase letter.",
        })
        .refine((p) => /[A-Z]/.test(p), {
                message: "Password must contain an uppercase letter.",
        })
        .refine((p) => /[0-9]/.test(p), {
                message: "Password must contain a number.",
        })
        .refine((p) => /[^A-Za-z0-9]/.test(p), {
                message: "Password must contain a symbol (e.g. !@#$%).",
        });
const emailSchema = z
        .string()
        .trim()
        .min(5, { message: "Please enter your email." })
        .max(254, { message: "Email is too long." })
        .email({ message: "Please provide a valid email address." });



export const loginSchema = z.object({
        email: emailSchema,
        password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;