import { NextResponse } from "next/server";
import { ApiError } from "@/lib/ApiError";
import { ApiResponse } from "@/lib/ApiResponse";

type RouteContext = { params: Promise<Record<string, string>> };
type Handler<TReq = Request> = (req: TReq, ctx?: RouteContext) => Promise<Response>;

export const asyncHandler = <TReq = Request>(handler: Handler<TReq>) => {
        return async (req: TReq, ctx?: RouteContext): Promise<Response> => {
                try {
                        return await handler(req, ctx);
                } catch (error: unknown) {
                        if (error instanceof ApiError) {
                                return NextResponse.json(
                                        new ApiResponse(error.statusCode, null, error.message),
                                        { status: error.statusCode }
                                );
                        }

                        const message = error instanceof Error ? error.message : "Internal Server Error";
                        return NextResponse.json(
                                new ApiResponse(500, null, message),
                                { status: 500 }
                        );
                }
        };
};