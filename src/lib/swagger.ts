import swaggerJSDoc from "swagger-jsdoc";
import path from "path";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const swaggerSpec = swaggerJSDoc({
        definition: {
                openapi: "3.0.0",
                info: {
                        title: "Bun + Next.js Auth API",
                        version: "1.0.0",
                        description: "OTP Auth system using Bun runtime",
                },
                servers: [
                        { url: `${baseUrl}/api`, description: baseUrl.includes("localhost") ? "Local" : "Production" },
                ],
                components: {
                        securitySchemes: {
                                bearerAuth: {
                                        type: "http",
                                        scheme: "bearer",
                                        bearerFormat: "JWT",
                                },
                        },
                },
        },
        apis: [path.join(process.cwd(), "src/app/api/**/*.ts")],
});