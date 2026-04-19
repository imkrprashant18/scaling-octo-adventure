"use client";

import React, { ReactNode, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeProviderProps {
        children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
        const [theme, setTheme] = useState<Theme>("system");
        const [mounted, setMounted] = useState(false);
        console.log(theme, "098")
        // Apply theme
        const applyTheme = (currentTheme: Theme) => {
                const html = document.documentElement;

                const isDark =
                        currentTheme === "dark" ||
                        (currentTheme === "system" &&
                                window.matchMedia("(prefers-color-scheme: dark)").matches);

                html.classList.toggle("dark", isDark);
        };

        // Initial load
        useEffect(() => {
                setMounted(true);

                const stored = localStorage.getItem("theme") as Theme | null;
                const initialTheme = stored || "system";

                setTheme(initialTheme);
                applyTheme(initialTheme);

                const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

                const handleChange = () => {
                        // ALWAYS check latest theme from localStorage (not stale state)
                        const storedTheme = (localStorage.getItem("theme") as Theme) || "system";

                        if (storedTheme === "system") {
                                applyTheme("system");
                        }
                };

                mediaQuery.addEventListener("change", handleChange);

                return () => {
                        mediaQuery.removeEventListener("change", handleChange);
                };
        }, []);

        // Change theme manually
        const setAppTheme = (newTheme: Theme) => {
                setTheme(newTheme);
                localStorage.setItem("theme", newTheme);
                applyTheme(newTheme);
        };

        // Optional toggle
        const toggleTheme = () => {
                const newTheme = theme === "dark" ? "light" : "dark";
                setAppTheme(newTheme);
        };

        // Prevent hydration mismatch
        if (!mounted) return null;

        return <>{children}</>;
}