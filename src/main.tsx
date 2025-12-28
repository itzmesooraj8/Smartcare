import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Startup diagnostics suppressed in production builds

createRoot(document.getElementById("root")!).render(<App />);
