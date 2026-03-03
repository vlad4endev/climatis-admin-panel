import { logJsError } from "./monitoringLogger";

export function setupGlobalErrorHandlers() {
  // Unhandled JS errors
  window.addEventListener("error", (event) => {
    logJsError(
      event.error || event.message || "Unknown error",
      event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : undefined
    );
  });

  // Unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const error = event.reason;
    logJsError(
      error instanceof Error ? error : String(error || "Unhandled promise rejection"),
      "unhandledrejection"
    );
  });
}
