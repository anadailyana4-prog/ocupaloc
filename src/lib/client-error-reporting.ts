type ErrorScope = "app" | "global" | "dashboard";

type ClientErrorContext = {
  digest?: string;
};

export function serializeClientError(scope: ErrorScope, error: Error, context?: ClientErrorContext) {
  return {
    scope,
    digest: context?.digest,
    name: error.name,
    message: error.message,
    stack: error.stack
  };
}

export function reportClientError(scope: ErrorScope, error: Error, context?: ClientErrorContext): void {
  const payload = serializeClientError(scope, error, context);

  console.error(`[ocupaloc][${scope}-error]`, payload);

  void import("@sentry/nextjs")
    .then(({ withScope, captureException }) => {
      withScope((sentryScope) => {
        sentryScope.setTag("ui_scope", scope);
        if (context?.digest) {
          sentryScope.setTag("error_digest", context.digest);
        }
        sentryScope.setContext("client_error", payload);
        captureException(error);
      });
    })
    .catch(() => {
      console.error(`[ocupaloc][${scope}-error:capture-failed]`, payload);
    });
}