import { NextRequest, NextResponse } from "next/server";
import { verifyToken, TokenPayload } from "@/lib/jwt";
import { apiResponse } from "@/utils/apiResponse";

export type AuthenticatedRequest = NextRequest & {
  user?: TokenPayload;
};

type RouteHandler = (req: AuthenticatedRequest, context: any) => Promise<NextResponse> | NextResponse;

export function withAuth(handler: RouteHandler): RouteHandler {
  return async (req: AuthenticatedRequest, context: any) => {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return apiResponse.unauthorized("Authentication required");
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = verifyToken(token) as TokenPayload;
      req.user = decoded;
      return await handler(req, context);
    } catch (error) {
      return apiResponse.unauthorized("Invalid or expired token");
    }
  };
}

export function withRole(allowedRoles: string[], handler: RouteHandler): RouteHandler {
  return withAuth(async (req: AuthenticatedRequest, context: any) => {
    if (!req.user || !req.user.role || !allowedRoles.includes(req.user.role)) {
      return apiResponse.forbidden("You do not have permission to perform this action");
    }
    return await handler(req, context);
  });
}
