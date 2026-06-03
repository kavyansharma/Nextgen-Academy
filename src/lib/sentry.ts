import * as Sentry from "@sentry/nextjs";

export function captureException(error: unknown, context?: Record<string, unknown>) {
  console.error("Central Exception Capture:", error);
  
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value as Parameters<typeof scope.setExtra>[1]);
        });
      }
      Sentry.captureException(error);
    });
  }
}
