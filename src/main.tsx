import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupGlobalErrorHandlers } from "./lib/globalErrorHandler";

// Setup global JS error monitoring
setupGlobalErrorHandlers();

createRoot(document.getElementById("root")!).render(<App />);
