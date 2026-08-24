
  import { createRoot } from "react-dom/client";
  import { Capacitor } from "@capacitor/core";
  import App from "./App.tsx";
  import "./index.css";

  // Initialize Capacitor for native platform detection
  // Make Capacitor available globally for platform detection utilities
  if (typeof window !== 'undefined') {
    (window as any).Capacitor = Capacitor;
  }

  createRoot(document.getElementById("root")!).render(<App />);
  