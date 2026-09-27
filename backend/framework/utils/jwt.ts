import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AccessTokenPayload {
  userId: number;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: number;
  email: string;
}

export const jwtUtils = {
  signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, env.ACCESS_SECRET, {
      expiresIn: env.ACCESS_EXPIRY,
    } as jwt.SignOptions);
  },

  signRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, env.REFRESH_SECRET, {
      expiresIn: env.REFRESH_EXPIRY,
    } as jwt.SignOptions);
  },

  verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, env.ACCESS_SECRET) as AccessTokenPayload;
  },

  verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, env.REFRESH_SECRET) as RefreshTokenPayload;
  },
};
