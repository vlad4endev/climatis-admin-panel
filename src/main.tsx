import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupGlobalErrorHandlers } from "./lib/globalErrorHandler";
import { registerServiceWorker } from "./lib/registerSW";

// Setup global JS error monitoring
setupGlobalErrorHandlers();

// Register Service Worker for static asset caching
registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
