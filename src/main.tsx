  import { createRoot } from "react-dom/client";
  import { Capacitor } from "@capacitor/core";
  import App from "./App.tsx";
  import "./index.css";
  import { restoreGithubPagesSpaPath } from "./web/public-path";

  // Initialize Capacitor for native platform detection
  // Make Capacitor available globally for platform detection utilities
  if (typeof window !== 'undefined') {
    (window as any).Capacitor = Capacitor;
    // GitHub Pages 404.html → /?p=story/... must become /story/... before routing
    restoreGithubPagesSpaPath();
  }

  createRoot(document.getElementById("root")!).render(<App />);
  