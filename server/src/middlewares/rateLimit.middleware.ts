import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiErrors';

const bucket = new Map<string, { token: number; lastRefill: number }>();

export const RateLimitMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const ip = req.ip;

  // If not in the bucket add it
  if (ip && !bucket.has(ip)) {
    bucket.set(ip, {
      token: 10,
      lastRefill: Date.now(),
    });

    // Consume the first token
    const currentUser = bucket.get(ip);
    if (currentUser?.token) {
      currentUser.token -= 1;
    }

    next();
  } else if (ip) {
    const currentUser = bucket.get(ip);

    if (currentUser) {
      const elapsed = Date.now() - currentUser.lastRefill;
      const interval = Math.floor(elapsed / 10000);

      // Lazy refill
      if (interval > 0) {
        const tokens = interval * 2;
        currentUser.token = Math.min(currentUser.token + tokens, 10);
        currentUser.lastRefill += interval * 10000;
      }

      // If token, consume
      if (currentUser.token > 0) {
        currentUser.token -= 1;

        next();
      } else {
        throw new ApiError(403, 'Request limit reached');
      }
    }
  }
};
