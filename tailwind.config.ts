import type { Config } from "tailwindcss";

const config: Config = {
        content: [
                "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
                "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
                "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        ],
        theme: {
                extend: {
                        colors: {
                                background: "rgb(var(--background))",
                                foreground: "rgb(var(--foreground))",
                                card: "rgb(var(--card))",
                                "card-foreground": "rgb(var(--card-foreground))",
                                primary: "rgb(var(--primary))",
                                "primary-foreground": "rgb(var(--primary-foreground))",
                                secondary: "rgb(var(--secondary))",
                                "secondary-foreground": "rgb(var(--secondary-foreground))",
                                muted: "rgb(var(--muted))",
                                "muted-foreground": "rgb(var(--muted-foreground))",
                                accent: "rgb(var(--accent))",
                                "accent-foreground": "rgb(var(--accent-foreground))",
                                destructive: "rgb(var(--destructive))",
                                "destructive-foreground": "rgb(var(--destructive-foreground))",
                                border: "rgb(var(--border))",
                                input: "rgb(var(--input))",
                                ring: "rgb(var(--ring))",
                        },
                        borderRadius: {
                                lg: "var(--radius)",
                                md: "calc(var(--radius) * 0.5)",
                                sm: "calc(var(--radius) * 0.25)",
                        },
                },
        },
        plugins: [],
};

export default config;
