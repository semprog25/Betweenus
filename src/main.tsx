
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
import { agentLog } from "./utils/agentLog";

// #region agent log
agentLog({
  hypothesisId:'H0',
  location:'src/main.tsx:bootstrap',
  message:'App bootstrap reached',
  data:{},
});
// #endregion

  createRoot(document.getElementById("root")!).render(<App />);
  