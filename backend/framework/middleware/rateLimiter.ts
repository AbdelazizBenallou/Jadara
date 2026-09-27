import type { Request, Response, NextFunction } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";

interface RateLimitOpts {
  limiter: RateLimiterMemory;
  keyFn?: (req: Request) => string;
  headers?: boolean;
}

const rateLimit =
  ({ limiter, keyFn, headers = true }: RateLimitOpts) =>
    (req: Request, res: Response, next: NextFunction): void => {
      const key = keyFn ? keyFn(req) : (req.ip ?? "unknown");

      limiter
        .consume(key)
        .then((result) => {
          if (headers) {
            res.setHeader("X-RateLimit-Limit", limiter.points);
            res.setHeader("X-RateLimit-Remaining", result.remainingPoints);
            res.setHeader("X-RateLimit-Reset", Math.ceil(result.msBeforeNext / 1000));
          }
          next();
        })
        .catch((rejRes) => {
          if (headers) {
            res.setHeader("X-RateLimit-Limit", limiter.points);
            res.setHeader("X-RateLimit-Remaining", 0);
            res.setHeader("X-RateLimit-Reset", Math.ceil(rejRes.msBeforeNext / 1000));
            res.setHeader("Retry-After", Math.ceil(rejRes.msBeforeNext / 1000));
          }
          res.status(429).json({
            success: false,
            message: "Too many requests, please try again later",
          });
        });
    };

// Auth
export const loginRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 10, duration: 60 }),
});
export const registerRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 30, duration: 3600 }),
});
export const changePasswordRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 5, duration: 300 }),
});
export const refreshTokenRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 20, duration: 60 }),
});
export const logoutRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 20, duration: 60 }),
});

// General
export const generalRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 100, duration: 60 }),
});

// Users
export const listUsersRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 30, duration: 60 }),
});
export const getUserRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 60, duration: 60 }),
});
export const updateUserRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 20, duration: 60 }),
});
export const deleteUserRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 10, duration: 60 }),
});

// Profile
export const getMyProfileRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 60, duration: 60 }),
});
export const updateMyProfileRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 20, duration: 60 }),
});

// Roles & Permissions
export const roleRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 60, duration: 60 }),
});
export const permissionRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 60, duration: 60 }),
});

// Domains
export const domainRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 60, duration: 60 }),
});

// Skills
export const skillRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 60, duration: 60 }),
});

// User skills
export const userSkillsReadRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 60, duration: 60 }),
});
export const userSkillsWriteRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 20, duration: 60 }),
});

// Projects
export const projectReadRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 60, duration: 60 }),
});
export const projectWriteRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 20, duration: 60 }),
});
export const projectEvidenceRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 10, duration: 60 }),
});

// Reviews
export const reviewReadRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 60, duration: 60 }),
});
export const reviewDecisionRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 10, duration: 60 }),
});

// Documents
export const documentReadRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 60, duration: 60 }),
});
export const documentWriteRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 10, duration: 60 }),
});

// CV / ATS
export const cvReadRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 60, duration: 60 }),
});
export const cvWriteRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 20, duration: 60 }),
});
export const pdfGenerateRateLimit = rateLimit({
  limiter: new RateLimiterMemory({ points: 5, duration: 300 }),
});
