import { getServerEnv } from "@/config/env";

/**
 * Validates request authorization for CRON background jobs
 */
export function validateCronRequest(authHeader: string | null): boolean {
  const env = getServerEnv();

  // If in dev and no CRON_SECRET configured, allow local testing
  if (env.NODE_ENV === "development" && !env.CRON_SECRET) {
    return true;
  }

  if (!env.CRON_SECRET) {
    console.error("CRON_SECRET is not configured on the server.");
    return false;
  }

  if (!authHeader) {
    return false;
  }

  const expectedBearer = `Bearer ${env.CRON_SECRET}`;
  return authHeader === expectedBearer || authHeader === env.CRON_SECRET;
}
