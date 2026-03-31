"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function ApiDocsPage() {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        return <SwaggerUI url={`${baseUrl}/api/v1/docs`} />;
}
