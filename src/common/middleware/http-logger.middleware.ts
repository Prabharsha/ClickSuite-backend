import { Logger } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

const logger = new Logger("HTTP");

/**
 * Logs one line per request once the response is sent:
 *   [HTTP] POST /api/auth/login 401 18ms
 *   [HTTP] GET  /api/auth/me 200 6ms user=<id>
 *
 * Registered globally via `app.use()` in main.ts (a functional middleware
 * avoids the route-pattern pitfalls of `forRoutes('*')`).
 *
 * Deliberately logs only method/url/status/duration and the authenticated
 * userId — never request bodies, query strings with secrets, tokens, or the
 * Authorization header.
 */
export function httpLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const { statusCode } = res;

    // Populated by Passport after the JWT guard runs; present on the
    // `finish` callback even though middleware itself runs earlier.
    const userId = (req.user as { id?: string } | undefined)?.id;
    const suffix = userId ? ` user=${userId}` : "";

    const line = `${req.method} ${req.originalUrl} ${statusCode} ${durationMs}ms${suffix}`;

    if (statusCode >= 500) {
      logger.error(line);
    } else if (statusCode >= 400) {
      logger.warn(line);
    } else {
      logger.log(line);
    }
  });

  next();
}
