import jwt, { JwtPayload, SignOptions, VerifyOptions } from "jsonwebtoken";

// It's highly recommended to add these to your .env.local file
const JWT_ACCESS_SECRET = process.env.JWT_SECRET || "fallback_access_secret";
const JWT_REFRESH_SECRET =
	process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret";

export interface TokenPayload {
	userId: string;
	role?: string;
	[key: string]: unknown;
}

/**
 * Generates an Access Token
 * Default expiration is 15 minutes
 */
export const generateAccessToken = (
	payload: TokenPayload,
	options?: SignOptions,
): string => {
	const defaultOptions: SignOptions = { expiresIn: "15m" };
	return jwt.sign(payload, JWT_ACCESS_SECRET, {
		...defaultOptions,
		...options,
	});
};

/**
 * Generates a Refresh Token
 * Default expiration is 7 days
 */
export const generateRefreshToken = (
	payload: TokenPayload,
	options?: SignOptions,
): string => {
	const defaultOptions: SignOptions = { expiresIn: "7d" };
	return jwt.sign(payload, JWT_REFRESH_SECRET, {
		...defaultOptions,
		...options,
	});
};

/**
 * Verifies a given token
 * @param token - The JWT string
 * @param isRefresh - Whether to use the refresh token secret
 * @param options - Optional verification options
 */
export const verifyToken = (
	token: string,
	isRefresh: boolean = false,
	options?: VerifyOptions,
): string | JwtPayload => {
	const secret = isRefresh ? JWT_REFRESH_SECRET : JWT_ACCESS_SECRET;
	return jwt.verify(token, secret, options);
};

/**
 * Decodes a token without verifying its signature
 * @param token - The JWT string
 */
export const decodeToken = (token: string): null | JwtPayload | string => {
	return jwt.decode(token);
};
