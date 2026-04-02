import { NextResponse } from "next/server";
import { ApiError } from "@/lib/ApiError";
import { ApiResponse } from "@/lib/ApiResponse";

type Handler<T = unknown> = (req: Request) => Promise<Response>;

export const asyncHandler = <T = unknown>(handler: Handler<T>) => {
        return async (req: Request): Promise<Response> => {
                try {
                        return await handler(req);
                } catch (error: unknown) {
                        if (error instanceof ApiError) {
                                return NextResponse.json(
                                        new ApiResponse(error.statusCode, null, error.message),
                                        { status: error.statusCode }
                                );
                        }
                        return NextResponse.json(
                                new ApiResponse(500, null, "Internal Server Error"),
                                { status: 500 }
                        );
                }
        };
};