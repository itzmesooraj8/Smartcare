import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Startup log to help diagnose blank-screen in production
try {
	console.log("SmartCare client booting — build:", process.env.VITE_APP_BUILD || "unknown");
} catch (e) {
	/* ignore in environments without console */
}

createRoot(document.getElementById("root")!).render(<App />);
